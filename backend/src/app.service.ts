import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, InsightSource, OverlapType, PolarityType, Insight, Category, CategoryOverlap, InsightComparison, InsightComparisonPresentation, Question, Answer, QuestionType } from '@prisma/client';

// Define a more specific type for the nested structure we're building
type QuestionWithAnswersAndDetailedInsights = Question & {
  answers: (Answer & {
    insight: Insight | null; // The detailed insight for this answer option
  })[];
};

export interface FullQuestionContextPayload {
  retrievedById: number;
  initialInsightDetails: Insight;
  inspirationInsightDetails: Insight | null;
  questionDetails: {
    id: number;
    inspirationId: number;
    questionType: QuestionType;
    questionText: string;
    answers: {
      id: number;
      answerText: string;
      linkedAnswerInsight: Insight | null; // The detailed Answer insight for this option
    }[];
  } | null;
}

@Injectable()
export class AppService {
  constructor(private prisma: PrismaClient) {}

  getHello(): string {
    return 'Welcome to Insight Iris API';
  }

  async listCategories() {
    return this.prisma.category.findMany();
  }


  async listInspirationInsightsInCategory(categoryId: number) {
    return this.prisma.insight.findMany({
      where: {
        categoryId,
        source: InsightSource.INSPIRATION,
      },
    });
  }

  async listAnswerInsightsInCategory(categoryId: number) {
    return this.prisma.insight.findMany({
      where: {
        categoryId,
        source: InsightSource.ANSWER,
      },
    });
  }

  // Renamed and refactored from getInsightDetails
  async getFullQuestionContextByInsightId(anyInsightId: number): Promise<FullQuestionContextPayload> {
    const initialInsight = await this.prisma.insight.findUnique({
      where: { id: anyInsightId },
    });

    if (!initialInsight) {
      throw new NotFoundException(`Insight with ID ${anyInsightId} not found`);
    }

    let inspirationInsight: Insight | null = null;
    let fetchedQuestionData: QuestionWithAnswersAndDetailedInsights | null = null;

    if (initialInsight.source === InsightSource.INSPIRATION) {
      inspirationInsight = initialInsight;
      fetchedQuestionData = await this.prisma.question.findFirst({
        where: { inspirationId: inspirationInsight.id },
        include: {
          answers: {
            orderBy: { id: 'asc' },
            include: { insight: true }, // Include the detailed Answer Insight for each option
          },
        },
      });
    } else if (initialInsight.source === InsightSource.ANSWER) {
      // The initialInsight is a detailed Answer Insight. Find its corresponding Answer record.
      const answerRecord = await this.prisma.answer.findFirst({
        where: { insightId: initialInsight.id },
      });

      if (answerRecord) {
        // Now fetch the Question this Answer belongs to, and its Inspiration Insight
        const questionForAnswer = await this.prisma.question.findUnique({
          where: { id: answerRecord.questionId },
          include: {
            answers: { // Fetch all answers for this question
              orderBy: { id: 'asc' },
              include: { insight: true },
            },
          },
        });

        if (questionForAnswer) {
          fetchedQuestionData = questionForAnswer;
          inspirationInsight = await this.prisma.insight.findUnique({
            where: { id: questionForAnswer.inspirationId },
          });
          if (!inspirationInsight) {
             // This would indicate a data integrity issue if a question's inspirationId doesn't point to a valid insight
             console.warn(`Data integrity issue: Inspiration insight ID ${questionForAnswer.inspirationId} not found for question ID ${questionForAnswer.id}`);
          }
        }
      } else {
        // This Answer Insight is not linked to any specific Answer option of a Question
        console.warn(`Answer Insight ID ${initialInsight.id} is not linked to a question's answer option.`);
      }
    }
    // If initialInsight.source is DESCRIPTOR or other, inspirationInsight and fetchedQuestionData will remain null.

    // Prepare the questionDetails part of the payload
    let questionDetailsPayload = null;
    if (fetchedQuestionData && inspirationInsight) { // Ensure we have both for a valid question context
      questionDetailsPayload = {
        id: fetchedQuestionData.id,
        inspirationId: fetchedQuestionData.inspirationId,
        questionType: fetchedQuestionData.questionType,
        questionText: fetchedQuestionData.questionText,
        answers: fetchedQuestionData.answers.map(ans => ({
          id: ans.id,
          answerText: ans.answerText,
          linkedAnswerInsight: ans.insight, // This is the fully included Insight model for the answer
        })),
      };
    }

    return {
      retrievedById: anyInsightId,
      initialInsightDetails: initialInsight,
      inspirationInsightDetails: inspirationInsight,
      questionDetails: questionDetailsPayload,
    };
  }
} 