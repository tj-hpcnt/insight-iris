import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, InsightSource, OverlapType, PolarityType, Insight, Category, CategoryOverlap, InsightComparison, InsightComparisonPresentation, Question, Answer, QuestionType } from '@prisma/client';
import { searchQuestionsAnswersInsights, SearchResult } from './utils/search';
import { generateExportData } from './utils/export';
import type { ExportData } from './utils/export';
import { Response } from 'express';
import { 
  generateInspirationInsights, generateBaseQuestion,
  reduceRedundancyForQuestions, reduceRedundancyForInspirations, reduceRedundancyForAnswers,
  reduceExactRedundancyForQuestions, reduceExactRedundancyForAnswers
} from './utils/aiGenerators';
import { processInParallel } from './utils/parallelProcessor';

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

  async exportData(): Promise<ExportData> {
    return await generateExportData(this.prisma);
  }

  async generateQuestionsForCategory(categoryId: number, res: Response) {
    const BATCH_COUNT = 10;
    const MINIMUM_TARGET_INSIGHTS = 10;
    const MAX_NEW_INSIGHTS_PER_GENERATION = 30;
    const MIN_NEW_INSIGHTS_PER_GENERATION = 5;
    const BINARY_PROBABILITY = 0.3;

    let totalUsage = {
      promptTokens: 0,
      cachedPromptTokens: 0,
      completionTokens: 0,
    };

    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const log = (message: string) => {
      console.log(message);
      res.write(`${message}\n`);
    };

    try {
      // Get the category
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        log(`Error: Category with ID ${categoryId} not found`);
        res.end();
        return;
      }

      log(`Starting question generation for category: ${category.insightSubject}`);

      // Phase 1: Generate inspiration insights
      log('Phase 1: Generating inspiration insights...');
      
      let totalInsights = await this.prisma.insight.count({ 
        where: { categoryId: category.id, source: InsightSource.INSPIRATION } 
      });
      
      let done = false;
      let round_fails = 0;
      let previousTotalInsights = -1;

      const targetInsights = totalInsights + MINIMUM_TARGET_INSIGHTS
      
      while (!done && totalInsights < targetInsights) {
        const newTotalInsights = await this.prisma.insight.count({ 
          where: { categoryId: category.id, source: InsightSource.INSPIRATION } 
        });
        
        if (newTotalInsights === previousTotalInsights) {
          round_fails++;
          if (round_fails === 3) {
            log(`Terminating inspiration pool generation after 3 rounds of failure`);
            break;
          }
          continue;
        }
        
        previousTotalInsights = newTotalInsights;
        const target = Math.max(MIN_NEW_INSIGHTS_PER_GENERATION, 
          Math.min(MAX_NEW_INSIGHTS_PER_GENERATION, targetInsights - newTotalInsights));
        
        const [newInsights, isDone, usage] = await generateInspirationInsights(category, target);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        
        done = isDone;
        totalInsights = newTotalInsights + newInsights.length;
        
        log(`Generated ${newInsights.length} new insights (total: ${totalInsights})`);
        for (const insight of newInsights) {
          log(`  - ${insight.insightText}`);
        }
      }

      // Reduce redundancy for inspiration insights
      log('Reducing redundancy for inspiration insights...');
      const [deletedIds, usage] = await reduceRedundancyForInspirations(category);
      totalUsage.promptTokens += usage.prompt_tokens;
      totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
      totalUsage.completionTokens += usage.completion_tokens;
      log(`Reduced redundancy: ${deletedIds.length} insights deleted`);

      // Phase 2: Generate questions for inspiration insights without questions
      log('Phase 2: Generating questions for inspiration insights...');
      
      const inspirationInsights = await this.prisma.insight.findMany({
        where: {
          categoryId: category.id,
          source: InsightSource.INSPIRATION
        }
      });

      // Find insights that don't have questions by checking if they have a question with their inspirationId
      const insightsWithoutQuestions = [];
      for (const insight of inspirationInsights) {
        const existingQuestion = await this.prisma.question.findFirst({
          where: { inspirationId: insight.id }
        });
        if (!existingQuestion) {
          insightsWithoutQuestions.push(insight);
        }
      }
      log(`Found ${insightsWithoutQuestions.length} inspiration insights without questions`);

      if (insightsWithoutQuestions.length > 0) {
        await processInParallel<typeof insightsWithoutQuestions[0], void>(
          insightsWithoutQuestions,
          async (insight) => {
            try {
              const preferBinary = Math.random() < BINARY_PROBABILITY;
              const [question, answers, answerInsights, usage] = await generateBaseQuestion(insight, preferBinary);
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
              totalUsage.completionTokens += usage.completion_tokens;
              
              if (question) {
                log(`Generated ${question.questionType} question: ${question.questionText}`);
                log(`  Answers: ${answers.map(a => a.answerText).join(' | ')}`);
              } else {
                log(`Failed to generate question for insight: ${insight.insightText}`);
              }
            } catch (err) {
              log(`Error processing insight ID ${insight.id}: ${err.message}`);
            }
          },
          BATCH_COUNT
        );
      }

      // Phase 3: Reduce redundancy for questions
      log('Phase 3: Reducing redundancy for questions...');
      const exactQuestionDupes = await reduceExactRedundancyForQuestions();
      for (const merged of exactQuestionDupes) {
        log(`Merged exact duplicate question: "${merged.oldQuestion.questionText}" -> "${merged.newQuestion.questionText}"`);
      }

      const questionReductionResult = await reduceRedundancyForQuestions(category);
      if (questionReductionResult) {
        const [mergedQuestions, usage] = questionReductionResult;
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        for (const merged of mergedQuestions) {
          log(`Merged similar question: "${merged.oldQuestion.questionText}" -> "${merged.newQuestion.questionText}"`);
        }
      }

      // Phase 4: Reduce redundancy for answer insights
      log('Phase 4: Reducing redundancy for answer insights...');
      const exactAnswerDupes = await reduceExactRedundancyForAnswers();
      for (const merged of exactAnswerDupes) {
        log(`Merged exact duplicate answer insight: "${merged.oldInsight.insightText}" -> "${merged.newInsight.insightText}"`);
      }

      const answerReductionResult = await reduceRedundancyForAnswers(category);
      if (answerReductionResult) {
        const [mergedInsights, usage] = answerReductionResult;
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        for (const merged of mergedInsights) {
          log(`Merged similar answer insight: "${merged.oldInsight.insightText}" -> "${merged.newInsight.insightText}"`);
        }
      }

      // Final stats
      const finalQuestionCount = await this.prisma.question.count({
        where: { categoryId: category.id }
      });
      const finalInsightCount = await this.prisma.insight.count({
        where: { categoryId: category.id, source: InsightSource.INSPIRATION }
      });

      log(`\nGeneration completed successfully!`);
      log(`Final counts for ${category.insightSubject}:`);
      log(`  - Questions: ${finalQuestionCount}`);
      log(`  - Inspiration insights: ${finalInsightCount}`);
      log(`Token usage - Input: ${totalUsage.promptTokens}, Cached: ${totalUsage.cachedPromptTokens}, Output: ${totalUsage.completionTokens}`);
      
      res.write('GENERATION_COMPLETE\n');
      res.end();

    } catch (error) {
      log(`Error during question generation: ${error.message}`);
      log(`Stack trace: ${error.stack}`);
      res.end();
    }
  }
} 