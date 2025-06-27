import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, InsightSource, OverlapType, PolarityType, Insight, Category, CategoryOverlap, InsightComparison, InsightComparisonPresentation, Question, Answer, QuestionType } from '@prisma/client';
import { searchQuestionsAnswersInsights, SearchResult } from './utils/search';

// Define category information structure
type CategoryInfo = {
  id: number;
  category: string;
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
    const categories = await this.prisma.category.findMany({
      orderBy: [
        { category: 'asc' },
        { subcategory: 'asc' },
        { insightSubject: 'asc' }
      ]
    });

    // Add question counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const questions = await this.prisma.question.findMany({
          where: { categoryId: category.id },
          select: {
            publishedId: true,
            proposedQuestion: true,
          },
        });

        const publishedCount = questions.filter(q => q.publishedId !== null).length;
        const proposedCount = questions.filter(q => q.proposedQuestion !== null).length;
        const generatedCount = questions.filter(q => q.publishedId === null && q.proposedQuestion === null).length;

        return {
          ...category,
          questionCounts: {
            published: publishedCount,
            proposed: proposedCount,
            generated: generatedCount,
          },
        };
      })
    );

    return categoriesWithCounts;
  }

  async listQuestionsInCategory(categoryId: number) {
    return this.prisma.question.findMany({
      where: {
        categoryId,
      },
      include: {
        inspiration: {
          select: {
            id: true,
            insightText: true,
            publishedTag: true,
            source: true,
            category: {
              select: {
                id: true,
                category: true,
                subcategory: true,
                insightSubject: true,
              },
            },
            firstCategory: {
              select: {
                id: true,
                category: true,
                subcategory: true,
                insightSubject: true,
              },
            },
          },
        },
        answers: {
          include: {
            insight: {
              select: {
                id: true,
                insightText: true,
                publishedTag: true,
                source: true,
                category: {
                  select: {
                    id: true,
                    category: true,
                    subcategory: true,
                    insightSubject: true,
                  },
                },
                firstCategory: {
                  select: {
                    id: true,
                    category: true,
                    subcategory: true,
                    insightSubject: true,
                  },
                },
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
        category: {
          select: {
            id: true,
            category: true,
            subcategory: true,
            insightSubject: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async getFullQuestionContextByInsightId(anyInsightId: number): Promise<FullQuestionContextPayload> {
    const initialInsight = await this.prisma.insight.findUnique({
      where: { id: anyInsightId },
      include: {
        category: {
          select: {
            id: true,
            category: true,
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

  async getQuestionById(questionId: number) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        inspiration: {
          include: {
            category: {
              select: {
                id: true,
                category: true,
                subcategory: true,
                insightSubject: true,
              },
            },
          },
        },
        answers: {
          orderBy: { id: 'asc' },
          include: { 
            insight: {
              include: {
                category: {
                  select: {
                    id: true,
                    category: true,
                    subcategory: true,
                    insightSubject: true,
                  },
                },
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            category: true,
            subcategory: true,
            insightSubject: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${questionId} not found`);
    }

    return {
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      publishedId: question.publishedId,
      proposedQuestion: question.proposedQuestion,
      inspiration: question.inspiration,
      answers: question.answers.map(answer => ({
        id: answer.id,
        answerText: answer.answerText,
        linkedAnswerInsight: answer.insight,
      })),
      category: question.category,
    };
  }

  async searchQuestionsAnswersInsights(searchQuery: string): Promise<SearchResult[]> {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }

    return await searchQuestionsAnswersInsights(searchQuery.trim());
  }
} 