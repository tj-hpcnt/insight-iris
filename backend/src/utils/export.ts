import { PrismaClient, InsightSource } from '@prisma/client';

interface ExportCategory {
  category: string;
  subcategory: string;
  insightSubject: string;
  expandedHints: string | null;
}

interface ExportAnswerInsight {
  category: string;
  subcategory: string;
  insightSubject: string;
  insightText: string;
  publishedTag: string | null;
  generationOrder: number | null;
}

interface ExportQuestion {
  category: string;
  subcategory: string;
  insightSubject: string;
  questionText: string;
  questionType: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  inspirationInsight: {
    insightText: string;
    publishedTag: string | null;
  };
  answers: {
    answerText: string;
    answerInsight: {
      insightText: string;
      publishedTag: string | null;
    } | null;
  }[];
}

export interface ExportData {
  exportedAt: string;
  categories: ExportCategory[];
  answerInsights: ExportAnswerInsight[];
  questions: ExportQuestion[];
}

export async function generateExportData(prisma: PrismaClient): Promise<ExportData> {
  // Get all categories
  const categories = await prisma.category.findMany({
    orderBy: [
      { category: 'asc' },
      { subcategory: 'asc' },
      { insightSubject: 'asc' }
    ]
  });

  // Get all answer insights
  const answerInsights = await prisma.insight.findMany({
    where: {
      source: InsightSource.ANSWER
    },
    include: {
      category: true
    },
    orderBy: [
      { category: { category: 'asc' } },
      { category: { subcategory: 'asc' } },
      { category: { insightSubject: 'asc' } },
      { generationOrder: 'asc' },
      { id: 'asc' }
    ]
  });

  // Get all questions with their related data
  const questions = await prisma.question.findMany({
    include: {
      category: true,
      inspiration: true,
      answers: {
        include: {
          insight: true
        },
        orderBy: {
          id: 'asc'
        }
      }
    },
    orderBy: [
      { category: { category: 'asc' } },
      { category: { subcategory: 'asc' } },
      { category: { insightSubject: 'asc' } },
      { id: 'asc' }
    ]
  });

  // Transform data to export format
  const exportCategories: ExportCategory[] = categories.map(cat => ({
    category: cat.category,
    subcategory: cat.subcategory,
    insightSubject: cat.insightSubject,
    expandedHints: cat.expandedHints
  }));

  const exportAnswerInsights: ExportAnswerInsight[] = answerInsights.map(insight => ({
    category: insight.category.category,
    subcategory: insight.category.subcategory,
    insightSubject: insight.category.insightSubject,
    insightText: insight.insightText,
    publishedTag: insight.publishedTag,
    generationOrder: insight.generationOrder
  }));

  const exportQuestions: ExportQuestion[] = questions.map(question => ({
    category: question.category.category,
    subcategory: question.category.subcategory,
    insightSubject: question.category.insightSubject,
    questionText: question.questionText,
    questionType: question.questionType,
    publishedId: question.publishedId,
    proposedQuestion: question.proposedQuestion,
    inspirationInsight: {
      insightText: question.inspiration.insightText,
      publishedTag: question.inspiration.publishedTag
    },
    answers: question.answers.map(answer => ({
      answerText: answer.answerText,
      answerInsight: answer.insight ? {
        insightText: answer.insight.insightText,
        publishedTag: answer.insight.publishedTag
      } : null
    }))
  }));

  return {
    exportedAt: new Date().toISOString(),
    categories: exportCategories,
    answerInsights: exportAnswerInsights,
    questions: exportQuestions
  };
}

export function generateTimestampedFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:\-]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `insight-iris-export_${timestamp}.json`;
} 