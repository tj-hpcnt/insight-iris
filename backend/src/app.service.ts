import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, InsightSource, OverlapType, PolarityType, Insight, Category, CategoryOverlap, InsightComparison, InsightComparisonPresentation, Question, Answer, QuestionType } from '@prisma/client';
import { searchQuestionsAnswersInsights, SearchResult } from './utils/search';
import { generateExportData } from './utils/export';
import type { ExportData } from './utils/export';
import { Response } from 'express';
import { 
  generateInspirationInsights, generateBaseQuestion,
  reduceRedundancyForQuestions, reduceRedundancyForInspirations, reduceRedundancyForAnswers,
  reduceExactRedundancyForQuestions, reduceExactRedundancyForAnswers,
  predictQuestionCandidateCategory, generateQuestionFromProposal
} from './utils/aiGenerators';
import { deleteQuestion, deleteAnswer, getAnswerCount, deleteCategory } from './utils/delete';
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
    originalQuestion?: string | null;
    isImageQuestion?: boolean;
    publishedId: string | null;
    answers: {
      id: number;
      answerText: string;
      originalAnswer?: string | null;
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
            approved: true,
            firstDays: true as any,
          },
        });

        const publishedCount = questions.filter(q => q.publishedId !== null).length;
        const proposedCount = questions.filter(q => q.proposedQuestion !== null).length;
        const generatedCount = questions.filter(q => q.publishedId === null && q.proposedQuestion === null).length;
        const approvedCount = questions.filter(q => q.approved === true).length;
        const firstDaysCount = questions.filter(q => q.firstDays === true).length;
        const totalCount = questions.length;

        return {
          ...category,
          questionCounts: {
            published: publishedCount,
            proposed: proposedCount,
            generated: generatedCount,
            approved: approvedCount,
            firstDays: firstDaysCount,
            total: totalCount,
          },
        };
      })
    );

    return categoriesWithCounts;
  }

  async createCategory(category: string, subcategory: string, insightSubject: string) {
    // Validate input
    if (!category?.trim() || !subcategory?.trim() || !insightSubject?.trim()) {
      throw new BadRequestException('All fields (category, subcategory, insightSubject) are required');
    }

    const trimmedCategory = category.trim();
    const trimmedSubcategory = subcategory.trim();
    const trimmedInsightSubject = insightSubject.trim();

    // Check for duplicate category
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        category: trimmedCategory,
        subcategory: trimmedSubcategory,
        insightSubject: trimmedInsightSubject,
      },
    });

    if (existingCategory) {
      throw new BadRequestException('A category with the same combination of category, subcategory, and insight subject already exists');
    }

    // Create the new category
    const newCategory = await this.prisma.category.create({
      data: {
        category: trimmedCategory,
        subcategory: trimmedSubcategory,
        insightSubject: trimmedInsightSubject,
      },
    });

    // Return the created category with question counts (initially all zeros)
    return {
      ...newCategory,
      questionCounts: {
        published: 0,
        proposed: 0,
        generated: 0,
        approved: 0,
        firstDays: 0,
        total: 0,
      },
    };
  }

  async listQuestionsInCategory(categoryId: number, approved?: boolean, firstDays?: boolean) {
    const whereClause: any = {
      categoryId,
    };
    
    // Add approved filter if specified
    if (approved !== undefined) {
      whereClause.approved = approved;
    }
    
    // Add firstDays filter if specified
    if (firstDays !== undefined) {
      whereClause.firstDays = firstDays;
    }
    
    const questions = await this.prisma.question.findMany({
      where: whereClause,
      select: {
        id: true,
        categoryId: true,
        inspirationId: true,
        questionType: true,
        questionText: true,
        originalQuestion: true,
        isImageQuestion: true,
        publishedId: true,
        proposedQuestion: true,
        persistentId: true as any,
        approved: true,
        firstDays: true as any,
        inspiration: {
          select: {
            id: true,
            insightText: true,
            shortInsightText: true,
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
          select: {
            id: true,
            answerText: true,
            originalAnswer: true,
            insight: {
              select: {
                id: true,
                insightText: true,
                shortInsightText: true,
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

    // Return the results directly since we explicitly selected all needed fields
    return questions;
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
        originalQuestion: (fetchedQuestionData as any).originalQuestion,
        isImageQuestion: (fetchedQuestionData as any).isImageQuestion,
        publishedId: fetchedQuestionData.publishedId,
        answers: fetchedQuestionData.answers.map(ans => ({
          id: ans.id,
          answerText: ans.answerText,
          originalAnswer: (ans as any).originalAnswer,
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
      select: {
        id: true,
        categoryId: true,
        inspirationId: true,
        questionType: true,
        questionText: true,
        originalQuestion: true,
        isImageQuestion: true,
        publishedId: true,
        proposedQuestion: true,
        persistentId: true as any,
        approved: true,
        firstDays: true as any,
        inspiration: {
          select: {
            id: true,
            categoryId: true,
            insightText: true,
            shortInsightText: true,
            source: true,
            generationOrder: true,
            publishedTag: true,
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
          select: {
            id: true,
            answerText: true,
            originalAnswer: true,
            insight: {
              select: {
                id: true,
                categoryId: true,
                insightText: true,
                shortInsightText: true,
                source: true,
                generationOrder: true,
                publishedTag: true,
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

    // Get the insight IDs from the answers
    const answerInsightIds = (question as any).answers
      .map((answer: any) => answer.insight?.id)
      .filter(Boolean);

    // Fetch positive compatibility comparisons between answer insights
    let compatibilityComparisons = [];
    if (answerInsightIds.length > 1) {
      compatibilityComparisons = await this.prisma.insightComparison.findMany({
        where: {
          polarity: 'POSITIVE',
          OR: [
            {
              insightAId: { in: answerInsightIds },
              insightBId: { in: answerInsightIds },
            },
          ],
        },
        include: {
          presentation: true,
          insightA: {
            select: {
              id: true,
              insightText: true,
              shortInsightText: true,
              category: {
                select: {
                  id: true,
                  insightSubject: true,
                },
              },
            },
          },
          insightB: {
            select: {
              id: true,
              insightText: true,
              shortInsightText: true,
              category: {
                select: {
                  id: true,
                  insightSubject: true,
                },
              },
            },
          },
        },
      });
    }

    return {
      ...question,
      answers: (question as any).answers.map((answer: any) => ({
        id: answer.id,
        answerText: answer.answerText,
        originalAnswer: answer.originalAnswer ?? null,
        linkedAnswerInsight: answer.insight,
      })),
      compatibilityComparisons: compatibilityComparisons.map((comparison: any) => ({
        id: comparison.id,
        insightA: comparison.insightA,
        insightB: comparison.insightB,
        presentation: comparison.presentation,
      })),
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

    // Helper function to create a progress indicator with cycling dots
    const createProgressIndicator = (baseMessage: string) => {
      let dotCount = 1;
      const timer = setInterval(() => {
        const dots = '.'.repeat(dotCount);
        const spaces = ' '.repeat(4 - dotCount); // Pad to keep consistent length
        res.write(`\r${baseMessage}${dots}${spaces}`);
        dotCount = (dotCount % 4) + 1;
      }, 2000);

      return () => {
        clearInterval(timer);
        res.write('\n'); // Move to next line after clearing
      };
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

      const lastestQuestion = await this.prisma.question.findFirst({
        where: { categoryId: category.id },
        orderBy: { id: 'desc' },
      });

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
        
        const stopProgress1 = createProgressIndicator('Generating inspiration insights');
        const [newInsights, isDone, usage] = await generateInspirationInsights(category, target);
        stopProgress1();
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
      const stopProgress2 = createProgressIndicator('Reducing redundancy for inspiration insights');
      const [deletedIds, usage] = await reduceRedundancyForInspirations(category);
      stopProgress2();
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
        const stopProgress3 = createProgressIndicator('Generating questions for insights');
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
        stopProgress3();
      }

      // Phase 3: Reduce redundancy for answer insights
      log('Phase 3: Reducing redundancy for answer insights...');
      const exactAnswerDupes = await reduceExactRedundancyForAnswers();
      for (const merged of exactAnswerDupes) {
        log(`Merged exact duplicate answer insight: "${merged.oldInsight.insightText}" -> "${merged.newInsight.insightText}"`);
      }

      const stopProgress5 = createProgressIndicator('Reducing redundancy for answer insights');
      const answerReductionResult = await reduceRedundancyForAnswers(category);
      stopProgress5();
      if (answerReductionResult) {
        const [mergedInsights, usage] = answerReductionResult;
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        for (const merged of mergedInsights) {
          log(`Merged similar answer insight: "${merged.oldInsight.insightText}" -> "${merged.newInsight.insightText}"`);
        }
      }

      
      // Phase 4: Reduce redundancy for questions
      log('Phase 4: Reducing redundancy for questions...');
      const exactQuestionDupes = await reduceExactRedundancyForQuestions();
      for (const merged of exactQuestionDupes) {
        log(`Merged exact duplicate question: "${merged.oldQuestion.questionText}" -> "${merged.newQuestion.questionText}"`);
      }

      const stopProgress4 = createProgressIndicator('Reducing redundancy for questions');
      const questionReductionResult = await reduceRedundancyForQuestions(category, lastestQuestion.id);
      stopProgress4();
      if (questionReductionResult) {
        const [mergedQuestions, usage] = questionReductionResult;
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        for (const merged of mergedQuestions) {
          log(`Merged similar question: "${merged.oldQuestion.questionText}" -> "${merged.newQuestion.questionText}"`);
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

  async proposeQuestion(proposedQuestionText: string, res: Response) {
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

    // Helper function to create a progress indicator with cycling dots
    const createProgressIndicator = (baseMessage: string) => {
      let dotCount = 1;
      const timer = setInterval(() => {
        const dots = '.'.repeat(dotCount);
        const spaces = ' '.repeat(4 - dotCount); // Pad to keep consistent length
        res.write(`\r${baseMessage}${dots}${spaces}`);
        dotCount = (dotCount % 4) + 1;
      }, 2000);

      return () => {
        clearInterval(timer);
        res.write('\n'); // Move to next line after clearing
      };
    };

    try {
      if (!proposedQuestionText?.trim()) {
        log('Error: Proposed question text is required');
        res.end();
        return;
      }

      const trimmedProposal = proposedQuestionText.trim();
      log(`Processing proposed question: "${trimmedProposal}"`);

      // Check if a question with this exact proposal already exists
      const existingQuestion = await this.prisma.question.findFirst({
        where: { 
          proposedQuestion: trimmedProposal
        },
      });

      if (existingQuestion) {
        log(`Question with this proposal already exists: ${trimmedProposal}`);
        log(`Existing question ID: ${existingQuestion.id}`);
        res.write(`EXISTING_QUESTION:${existingQuestion.id}\n`);
        res.end();
        return;
      }

      // Phase 1: Predict category for the proposed question
      log('Phase 1: Predicting question category...');
      const stopProgress1 = createProgressIndicator('Analyzing question category');
      const categoryResult = await predictQuestionCandidateCategory(trimmedProposal);
      stopProgress1();

      if (!categoryResult) {
        log(`Failed to predict category for proposed question: ${trimmedProposal}`);
        res.end();
        return;
      }

      const [category, categoryUsage] = categoryResult;
      totalUsage.promptTokens += categoryUsage.prompt_tokens;
      totalUsage.cachedPromptTokens += categoryUsage.prompt_tokens_details?.cached_tokens || 0;
      totalUsage.completionTokens += categoryUsage.completion_tokens;

      log(`Predicted category: ${category.insightSubject}`);

      // Phase 2: Generate the complete question from the proposal
      log('Phase 2: Generating complete question...');
      const stopProgress2 = createProgressIndicator('Generating question and answers');
      const questionResult = await generateQuestionFromProposal(category, trimmedProposal, false);
      stopProgress2();

      if (!questionResult) {
        log(`Failed to generate question from proposal: ${trimmedProposal}`);
        res.end();
        return;
      }

      const [question, answers, insights, questionUsage] = questionResult;
      totalUsage.promptTokens += questionUsage.prompt_tokens;
      totalUsage.cachedPromptTokens += questionUsage.prompt_tokens_details?.cached_tokens || 0;
      totalUsage.completionTokens += questionUsage.completion_tokens;

      if (!question) {
        log(`No question generated from proposal (likely duplicate): ${trimmedProposal}`);
        res.end();
        return;
      }

      log(`Generated ${question.questionType} question: ${question.questionText}`);
      log(`Generated answers: ${answers.map(a => a.answerText).join(' | ')}`);
      log(`Generated insights: ${insights.map(i => i.insightText).join(' | ')}`);

      // Phase 3: Reduce redundancy for questions in the category
      log('Phase 3: Reducing redundancy for questions...');
      const exactQuestionDupes = await reduceExactRedundancyForQuestions();
      for (const merged of exactQuestionDupes) {
        log(`Merged exact duplicate question: "${merged.oldQuestion.questionText}" -> "${merged.newQuestion.questionText}"`);
      }

      const stopProgress3 = createProgressIndicator('Reducing redundancy for questions');
      const questionReductionResult = await reduceRedundancyForQuestions(category);
      stopProgress3();
      if (questionReductionResult) {
        const [mergedQuestions, usage] = questionReductionResult;
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        for (const merged of mergedQuestions) {
          log(`Merged similar question: "${merged.oldQuestion.questionText}" -> "${merged.newQuestion.questionText}"`);
        }
      }

      // Phase 4: Reduce redundancy for answer insights in the category
      log('Phase 4: Reducing redundancy for answer insights...');
      const exactAnswerDupes = await reduceExactRedundancyForAnswers();
      for (const merged of exactAnswerDupes) {
        log(`Merged exact duplicate answer insight: "${merged.oldInsight.insightText}" -> "${merged.newInsight.insightText}"`);
      }

      const stopProgress4 = createProgressIndicator('Reducing redundancy for answer insights');
      const answerReductionResult = await reduceRedundancyForAnswers(category);
      stopProgress4();
      if (answerReductionResult) {
        const [mergedInsights, usage] = answerReductionResult;
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        for (const merged of mergedInsights) {
          log(`Merged similar answer insight: "${merged.oldInsight.insightText}" -> "${merged.newInsight.insightText}"`);
        }
      }

      // Get the final question to return its ID
      const finalQuestion = await this.prisma.question.findFirst({
        where: { 
          proposedQuestion: trimmedProposal
        },
      });

      log(`\nProposal processing completed successfully!`);
      log(`Generated question ID: ${finalQuestion?.id || question.id}`);
      log(`Category: ${category.insightSubject}`);
      log(`Token usage - Input: ${totalUsage.promptTokens}, Cached: ${totalUsage.cachedPromptTokens}, Output: ${totalUsage.completionTokens}`);
      
      res.write(`PROPOSAL_COMPLETE:${finalQuestion?.id || question.id}:${category.id}\n`);
      res.end();

    } catch (error) {
      log(`Error during question proposal: ${error.message}`);
      log(`Stack trace: ${error.stack}`);
      res.end();
    }
  }

  async regenerateQuestion(questionId: number, feedback: string, res: Response) {
    const { regenerateQuestionWithFeedback, reduceExactRedundancyForAnswers } = await import('./utils/aiGenerators');

    const log = (message: string) => {
      res.write(`${message}\n`);
    };

    const createProgressIndicator = (baseMessage: string) => {
      let dotCount = 0;
      return setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        const dots = '.'.repeat(dotCount);
        const spaces = ' '.repeat(3 - dotCount);
        log(`${baseMessage}${dots}${spaces}`);
      }, 500);
    };

    try {
      // Set up streaming response
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Get the existing question with all related data
      log('Fetching question data...');
      const existingQuestion = await this.prisma.question.findUnique({
        where: { id: questionId },
        include: {
          answers: {
            include: {
              insight: true
            }
          },
          inspiration: true
        }
      });

      if (!existingQuestion) {
        throw new Error(`Question with ID ${questionId} not found`);
      }

      if (!existingQuestion.inspiration) {
        throw new Error(`Inspiration insight not found for question ${questionId}`);
      }

      // Regenerate the question with feedback
      log('Regenerating question with AI...');
      const progressIndicator = createProgressIndicator('Regenerating question with AI');
      
      const result = await regenerateQuestionWithFeedback(
        existingQuestion as any, // Type assertion since we know the structure
        feedback
      );

      clearInterval(progressIndicator);

      if (!result) {
        throw new Error('Failed to regenerate question');
      }

      const [updatedQuestion, newAnswers, newInsights, usage] = result;

      log('Question regenerated successfully!');
      log(`Token usage: ${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion = ${usage.prompt_tokens + usage.completion_tokens} total`);

      // Apply answer insight reduction
      log('Reducing redundancy in answer insights...');
      const redundancyProgressIndicator = createProgressIndicator('Reducing answer redundancy');

      const redundancyResult = await reduceExactRedundancyForAnswers();
      
      clearInterval(redundancyProgressIndicator);

      if (redundancyResult && redundancyResult.length > 0) {
        log(`Merged ${redundancyResult.length} redundant answer insights`);
      } else {
        log('No redundant answer insights found');
      }

      log('Question regeneration complete!');
      res.write(`REGENERATION_COMPLETE:${updatedQuestion.id}\n`);
      res.end();
    } catch (error) {
      console.error('Error in regenerateQuestion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      log(`Error: ${errorMessage}`);
      res.status(500).end();
    }
  }

  async deleteQuestion(questionId: number) {
    try {
      await deleteQuestion(questionId);
      return { success: true, message: 'Question deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteAnswer(answerId: number) {
    try {
      await deleteAnswer(answerId);
      return { success: true, message: 'Answer deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getQuestionAnswerCount(questionId: number) {
    try {
      const count = await getAnswerCount(questionId);
      return { count, canDeleteAnswers: count > 2 };
    } catch (error) {
      throw new NotFoundException('Question not found');
    }
  }

  async deleteCategory(categoryId: number) {
    try {
      await deleteCategory(categoryId);
      return { success: true, message: 'Category deleted successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async toggleQuestionApproval(questionId: number) {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id: questionId },
        select: { approved: true }
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      const updatedQuestion = await this.prisma.question.update({
        where: { id: questionId },
        data: { approved: !question.approved },
        select: { id: true, approved: true }
      });

      return { success: true, approved: updatedQuestion.approved };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async toggleQuestionFirstDays(questionId: number) {
    try {
      const question = await this.prisma.question.findUnique({
        where: { id: questionId },
        select: { firstDays: true }
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      const updatedQuestion = await this.prisma.question.update({
        where: { id: questionId },
        data: { firstDays: !question.firstDays },
        select: { id: true, firstDays: true }
      });

      return { success: true, firstDays: updatedQuestion.firstDays };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async getQuestionComments(questionId: number) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: { questionId },
        orderBy: { createdAt: 'desc' }
      });

      return comments;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getAllComments() {
    try {
      const comments = await this.prisma.comment.findMany({
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              persistentId: true,
              publishedId: true,
              proposedQuestion: true,
              answers: {
                select: {
                  id: true,
                  answerText: true
                }
              },
              category: {
                select: {
                  id: true,
                  category: true,
                  subcategory: true,
                  insightSubject: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return comments;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async addQuestionComment(questionId: number, text: string, username: string) {
    try {
      // Check if question exists
      const question = await this.prisma.question.findUnique({
        where: { id: questionId }
      });

      if (!question) {
        throw new NotFoundException('Question not found');
      }

      const comment = await this.prisma.comment.create({
        data: {
          questionId,
          text: text.trim(),
          username
        }
      });

      return comment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async updateComment(commentId: number, text: string, username: string) {
    try {
      // Check if comment exists
      const existingComment = await this.prisma.comment.findUnique({
        where: { id: commentId }
      });

      if (!existingComment) {
        throw new NotFoundException('Comment not found');
      }

      // Check if user owns the comment
      if (existingComment.username !== username) {
        throw new ForbiddenException('You can only edit your own comments');
      }

      const updatedComment = await this.prisma.comment.update({
        where: { id: commentId },
        data: {
          text: text.trim()
        }
      });

      return updatedComment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  async deleteComment(commentId: number, username: string) {
    try {
      // Check if comment exists
      const existingComment = await this.prisma.comment.findUnique({
        where: { id: commentId }
      });

      if (!existingComment) {
        throw new NotFoundException('Comment not found');
      }

      // Check if user owns the comment
      if (existingComment.username !== username) {
        throw new ForbiddenException('You can only delete your own comments');
      }

      await this.prisma.comment.delete({
        where: { id: commentId }
      });

      return { success: true, message: 'Comment deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
} 