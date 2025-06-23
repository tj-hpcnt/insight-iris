import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, InsightSource, OverlapType, PolarityType, Insight, Category, CategoryOverlap, InsightComparison, InsightComparisonPresentation, Question, Answer, QuestionType } from '@prisma/client';

// Define category information structure
type CategoryInfo = {
  id: number;
  category: string;
  topicHeader: string;
  subcategory: string;
  insightSubject: string;
};

// Extended Insight type that includes category information
type InsightWithCategory = Insight & {
  category: CategoryInfo;
};

// Define a more specific type for the nested structure we're building
type QuestionWithAnswersAndDetailedInsights = Question & {
  answers: (Answer & {
    insight: InsightWithCategory | null; // The detailed insight for this answer option
  })[];
};

export interface FullQuestionContextPayload {
  retrievedById: number;
  initialInsightDetails: InsightWithCategory;
  inspirationInsightDetails: InsightWithCategory | null;
  questionDetails: {
    id: number;
    inspirationId: number;
    questionType: QuestionType;
    questionText: string;
    publishedId: string | null;
    answers: {
      id: number;
      answerText: string;
      linkedAnswerInsight: InsightWithCategory | null; // The detailed Answer insight for this option
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
      include: {
        question: {
          select: {
            questionText: true,
            publishedId: true,
          },
        },
      },
    });
  }

  async listAnswerInsightsInCategory(categoryId: number) {
    // First, find all questions that have at least one answer with an insight in this category
    const questionsWithAnswersInCategory = await this.prisma.question.findMany({
      where: {
        answers: {
          some: {
            insight: {
              categoryId,
              source: InsightSource.ANSWER,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    const questionIds = questionsWithAnswersInCategory.map(q => q.id);

    // Then fetch all answers for those questions
    return this.prisma.answer.findMany({
      where: {
        questionId: {
          in: questionIds,
        },
      },
      include: {
        question: {
          select: {
            questionText: true,
            publishedId: true,
          },
        },
        insight: {
          select: {
            id: true,
            insightText: true,
            source: true,
            publishedTag: true,
          },
        },
      },
      orderBy: {
        id: 'asc'
      },
    });
  }

  // Renamed and refactored from getInsightDetails
  async getFullQuestionContextByInsightId(anyInsightId: number): Promise<FullQuestionContextPayload> {
    const initialInsight = await this.prisma.insight.findUnique({
      where: { id: anyInsightId },
      include: {
        category: {
          select: {
            id: true,
            category: true,
            topicHeader: true,
            subcategory: true,
            insightSubject: true,
          },
        },
      },
    });

    if (!initialInsight) {
      throw new NotFoundException(`Insight with ID ${anyInsightId} not found`);
    }

    let inspirationInsight: InsightWithCategory | null = null;
    let fetchedQuestionData: QuestionWithAnswersAndDetailedInsights | null = null;

    if (initialInsight.source === InsightSource.INSPIRATION) {
      inspirationInsight = initialInsight;
      fetchedQuestionData = await this.prisma.question.findFirst({
        where: { inspirationId: inspirationInsight.id },
        include: {
          answers: {
            orderBy: { id: 'asc' },
            include: { 
              insight: {
                include: {
                  category: {
                    select: {
                      id: true,
                      category: true,
                      topicHeader: true,
                      subcategory: true,
                      insightSubject: true,
                    },
                  },
                },
              },
            },
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
              include: { 
                insight: {
                  include: {
                    category: {
                      select: {
                        id: true,
                        category: true,
                        topicHeader: true,
                        subcategory: true,
                        insightSubject: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (questionForAnswer) {
          fetchedQuestionData = questionForAnswer;
          const inspirationInsightResult = await this.prisma.insight.findUnique({
            where: { id: questionForAnswer.inspirationId },
            include: {
              category: {
                select: {
                  id: true,
                  category: true,
                  topicHeader: true,
                  subcategory: true,
                  insightSubject: true,
                },
              },
            },
          });
          inspirationInsight = inspirationInsightResult;
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
        publishedId: fetchedQuestionData.publishedId,
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