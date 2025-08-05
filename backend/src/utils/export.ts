import { PrismaClient, Question, QuestionType } from '@prisma/client';

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
  deleted: boolean;
  publishedId: string | null;
  category: string;
  subcategory: string;
  insightSubject: string;
  questionText: string;
  questionType: string;
  isImageQuestion: boolean;
  legacyQuestionType: string;
  legacyIsMultiSelect: boolean;
  imagesPerRow: number | null;
  approved: boolean;
  conversationStarter: boolean;
  firstDays: boolean;
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

  const exportQuestions: ExportQuestion[] = questions.map(question => 
    generateQuestionExportData(question, false)
  );

  // Get deleted questions
  const deletedQuestions = await prisma.deletedPublishedQuestion.findMany({
    orderBy: {
      id: 'asc'
    }
  });

  // Parse deleted questions from JSON and mark as deleted
  const deletedExportQuestions: ExportQuestion[] = deletedQuestions.map(deleted => {
    const parsedData = JSON.parse(deleted.exportData) as ExportQuestion;
    return {
      ...parsedData,
      deleted: true
    };
  });

  // Concatenate active and deleted questions
  const allQuestions = [...exportQuestions, ...deletedExportQuestions];

  return {
    exportedAt: new Date().toISOString(),
    questions: allQuestions
  };
}

function mapLegacyQuestionType(question: { 
  questionType: string;
  isImageQuestion: boolean;
}): string {
  switch(question.questionType) {
    case QuestionType.BINARY:
      return question.isImageQuestion ? 'BINARY_IMAGE' : 'BINARY_TEXT';
    case QuestionType.MULTIPLE_CHOICE:
      return question.isImageQuestion ? 'MCQ_IMAGE' : 'MCQ_TEXT';
    case QuestionType.SINGLE_CHOICE:
      return question.isImageQuestion ? 'MCQ_IMAGE' : 'MCQ_TEXT';
    default:
      throw new Error(`Unknown question type: ${question.questionType}`);
  }
}

function mapLegacyQuestionIsMultiSelect(question: {
  questionType: string;
}): boolean {
  switch(question.questionType) {
    case QuestionType.MULTIPLE_CHOICE:
      return true;
    case QuestionType.SINGLE_CHOICE:
      return false;
    case QuestionType.BINARY:
      return false;
    default:
      throw new Error(`Unknown question type: ${question.questionType}`);
    }
}

/**
 * Generates export data for a single question
 * @param question - Question with all related data included
 * @returns ExportQuestion object
 */
export function generateQuestionExportData(question: {
  persistentId: string;
  publishedId: string | null;
  questionText: string;
  questionType: string;
  isImageQuestion: boolean;
  imagesPerRow: number | null;
  approved: boolean;
  conversationStarter: boolean;
  firstDays: boolean;
  proposedQuestion: string | null;
  category: {
    category: string;
    subcategory: string;
    insightSubject: string;
  };
  answers: Array<{
    answerText: string;
    originalAnswer: string | null;
    insight: {
      insightText: string;
      shortInsightText: string | null;
      publishedTag: string | null;
    } | null;
  }>;
}, deleted: boolean = false): ExportQuestion {
  return {
    persistentId: question.persistentId,
    deleted,
    publishedId: question.publishedId,
    category: question.category.category,
    subcategory: question.category.subcategory,
    insightSubject: question.category.insightSubject,
    questionText: question.questionText,
    questionType: question.questionType,
    isImageQuestion: question.isImageQuestion,
    legacyQuestionType: mapLegacyQuestionType(question),
    legacyIsMultiSelect: mapLegacyQuestionIsMultiSelect(question),
    imagesPerRow: question.imagesPerRow,
    approved: question.approved,
    conversationStarter: question.conversationStarter,
    firstDays: question.firstDays,
    answers: question.answers.map(answer => ({
      answerText: answer.answerText,
      answerInsight: answer.insight ? {
        insightText: answer.insight.insightText,
        shortInsightText: answer.insight.shortInsightText,
        publishedTag: answer.insight.publishedTag
      } : null
    })),
    proposedQuestion: question.proposedQuestion,
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