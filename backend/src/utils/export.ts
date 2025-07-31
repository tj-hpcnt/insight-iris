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
  category: string;
  subcategory: string;
  insightSubject: string;
  questionText: string;
  questionType: string;
  publishedId: string | null;
  persistentId: string;
  proposedQuestion: string | null;
  approved: boolean;
  conversationStarter: boolean;
  inspirationInsight: {
    insightText: string;
    shortInsightText: string | null;
    publishedTag: string | null;
  };
  answers: {
    answerText: string;
    answerInsight: {
      insightText: string;
      shortInsightText: string | null;
      publishedTag: string | null;
    } | null;
  }[];
  compatibility: {
    positiveCompatibilityInsights: ExportCompatibilityInsight[];
    negativeCompatibilityInsights: {
      insightPairId: number;
      insightAText: string;
      insightBText: string;
    }[];
  };
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

  // Get all insight comparisons with presentations
  const insightComparisons = await prisma.insightComparison.findMany({
    include: {
      insightA: true,
      insightB: true,
      presentation: true
    }
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

  // Helper function to get compatibility insights for a question
  const getCompatibilityInsights = (questionInsightIds: number[]) => {
    const positiveCompatibilityInsights: ExportCompatibilityInsight[] = [];
    const negativeCompatibilityInsights: { insightPairId: number; insightAText: string; insightBText: string; }[] = [];

    insightComparisons.forEach(comparison => {
      const isRelevant = questionInsightIds.includes(comparison.insightAId) || 
                        questionInsightIds.includes(comparison.insightBId);
      
      if (isRelevant) {
        if (comparison.polarity === PolarityType.POSITIVE && comparison.presentation) {
          positiveCompatibilityInsights.push({
            insightPairId: comparison.id,
            presentationTitle: comparison.presentation.presentationTitle,
            conciseAText: comparison.presentation.conciseAText,
            conciseBText: comparison.presentation.conciseBText,
            insightAText: comparison.insightA.insightText,
            insightBText: comparison.insightB.insightText
          });
        } else if (comparison.polarity === PolarityType.NEGATIVE) {
          negativeCompatibilityInsights.push({
            insightPairId: comparison.id,
            insightAText: comparison.insightA.insightText,
            insightBText: comparison.insightB.insightText
          });
        }
      }
    });

    return {
      positiveCompatibilityInsights,
      negativeCompatibilityInsights
    };
  };

  const exportQuestions: ExportQuestion[] = questions.map(question => {
    // Collect all insight IDs related to this question
    const questionInsightIds = [
      question.inspirationId,
      ...question.answers.map(answer => answer.insightId).filter(id => id !== null)
    ];

    const compatibility = getCompatibilityInsights(questionInsightIds);

    return {
      category: question.category.category,
      subcategory: question.category.subcategory,
      insightSubject: question.category.insightSubject,
      questionText: question.questionText,
      questionType: question.questionType,
      publishedId: question.publishedId,
      persistentId: question.persistentId,
      proposedQuestion: question.proposedQuestion,
      approved: question.approved,
      conversationStarter: question.conversationStarter,
      inspirationInsight: {
        insightText: question.inspiration.insightText,
        shortInsightText: question.inspiration.shortInsightText,
        publishedTag: question.inspiration.publishedTag
      },
      answers: question.answers.map(answer => ({
        answerText: answer.answerText,
        originalAnswerText: answer.originalAnswer,
        answerInsight: answer.insight ? {
          insightText: answer.insight.insightText,
          shortInsightText: answer.insight.shortInsightText,
          publishedTag: answer.insight.publishedTag
        } : null
      })),
      compatibility
    };
  });

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