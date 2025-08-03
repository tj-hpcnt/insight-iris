import { PrismaClient, InsightSource, PolarityType } from '@prisma/client';

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

interface ExportCompatibilityInsight {
  insightPairId: number;
  presentationTitle: string;
  conciseAText: string;
  conciseBText: string;
  insightAText: string;
  insightBText: string;
}

interface ExportQuestion {
  persistentId: string;
  publishedId: string | null;
  category: string;
  subcategory: string;
  insightSubject: string;
  questionText: string;
  questionType: string;
  isImageQuestion: boolean;
  approved: boolean;
  conversationStarter: boolean;
  answers: {
    answerText: string;
    answerInsight: {
      insightText: string;
      shortInsightText: string | null;
      publishedTag: string | null;
    } | null;
  }[];
  proposedQuestion: string | null;
}

export interface ExportData {
  exportedAt: string;
  questions: ExportQuestion[];
}

export async function generateExportData(prisma: PrismaClient): Promise<ExportData> {
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

  const exportQuestions: ExportQuestion[] = questions.map(question => {
    // Collect all insight IDs related to this question
    const questionInsightIds = [
      question.inspirationId,
      ...question.answers.map(answer => answer.insightId).filter(id => id !== null)
    ];

    return {
      persistentId: question.persistentId,
      publishedId: question.publishedId,
      category: question.category.category,
      subcategory: question.category.subcategory,
      insightSubject: question.category.insightSubject,
      questionText: question.questionText,
      questionType: question.questionType,
      isImageQuestion: question.isImageQuestion,
      approved: question.approved,
      conversationStarter: question.conversationStarter,
      answers: question.answers.map(answer => ({
        answerText: answer.answerText,
        originalAnswerText: answer.originalAnswer,
        answerInsight: answer.insight ? {
          insightText: answer.insight.insightText,
          shortInsightText: answer.insight.shortInsightText,
          publishedTag: answer.insight.publishedTag
        } : null
      })),
      proposedQuestion: question.proposedQuestion,
    };
  });

  return {
    exportedAt: new Date().toISOString(),
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