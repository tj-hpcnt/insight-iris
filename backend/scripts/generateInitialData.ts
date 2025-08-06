import { PrismaClient, InsightSource, Category, Insight, InsightDirection } from '@prisma/client';
import * as dotenv from 'dotenv';
import { 
  generateInspirationInsights, generateBaseQuestion, generateInsightTextFromImportedQuestion,
  generateCategoryOverlapByRanking, generateInsightCategoryComparisonByRanking, 
  generateInsightQuestionComparisonByRanking, generateInsightCategoryOverlap, generateInsightComparisonPresentation,
  reduceExactRedundancyForQuestions, reduceExactRedundancyForInspirations, reduceExactRedundancyForAnswers, 
  reduceRedundancyForQuestions, reduceRedundancyForInspirations, reduceRedundancyForAnswers,
  predictQuestionCandidateCategory, generateQuestionFromProposal, regenerateImportedQuestion,
  generateShortInsightText, generateSelfInsightComparisons, computeQuestionRedundancyGroups,
  } from '../src/utils/aiGenerators';
import { EXTRA_CATEGORIES, parseCategoriesFromCSV } from './categories';
import { FIXED_STYLES } from './styles';
import { processInParallel } from '../src/utils/parallelProcessor';
import { parseQuestionsFromCSV, parseMappingFromCSV, parseQuestionType, extractAnswersFromRow, parseProposedQuestions, handleConversationStarterImport, handleQuestionImport } from './questions';
import { AI_GENERATION_CONFIG } from '../src/config';
dotenv.config();
const prisma = new PrismaClient();

// Extract configuration constants
const {
  BATCH_COUNT,
  MINIMUM_TARGET_INSIGHTS,
  MAX_NEW_INSIGHTS_PER_GENERATION,
  MIN_NEW_INSIGHTS_PER_GENERATION,
  BINARY_PROBABILITY,
  GENERATE_ALL_COMPARISONS,
  GENERATE_SELF_COMPARISONS,
  REGENERATE_IMPORTED_QUESTIONS,
  IMPORT_QUESTIONS_FROM_CSV,
  IMPORT_AFTER_GENERATE,
  REDUCE_ANSWER_INSIGHT_REDUNDANCY,
} = AI_GENERATION_CONFIG;





async function main() {
  try {
    let totalUsage = {
      promptTokens: 0,
      cachedPromptTokens: 0,
      completionTokens: 0,
    };

    // Start periodic logging of token usage every 5 seconds
    const usageLogger = setInterval(() => {
      console.log(`accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);
    }, 5000);
    // Combine categories from CSV and extra categories
    const csvCategories = await parseCategoriesFromCSV();
    const allCategoryData = [...csvCategories, ...EXTRA_CATEGORIES];
    
    // Upsert categories (create or update)
    console.log('Upserting categories...');
    for (const categoryData of allCategoryData) {
      // Check if category already exists
      const existingCategory = await prisma.category.findFirst({
        where:{
          category: categoryData.category,
          subcategory: categoryData.subcategory,
          insightSubject: categoryData.insightSubject
        }
      });

      let category;
      if (existingCategory) {
        // Update existing category
        category = await prisma.category.update({
          where: { id: existingCategory.id },
          data: { expandedHints: categoryData.expandedHints },
        });
        console.log(`Updated category: ${category.category} - ${category.subcategory} - ${category.insightSubject}`);
      } else {
        // Create new category
        category = await prisma.category.create({
          data: categoryData,
        });
        console.log(`Created category: ${category.category} - ${category.subcategory} - ${category.insightSubject}`);
      }
    }
    let categories = await prisma.category.findMany();

    const styles = await prisma.style.findMany();
    // Create fixed styles
    if (styles.length == 0) {
      console.log('Creating styles...');
      for (const [name, description] of Object.entries(FIXED_STYLES) as Array<[string, string]>) {
        const style = await prisma.style.create({
          data: {
            name,
            description
          },
        });
        styles.push(style);
        console.log(`Created style ${name}: ${description.substring(0, 50)}...`);
      }
    }

    // Handle question import based on timing preference
    if (!IMPORT_AFTER_GENERATE) {
      await handleQuestionImport(prisma, categories, totalUsage);
    }

    // Generate category overlaps by ranking, in parallel for each category
    console.log('Generating category overlaps by ranking...');
    await processInParallel(
      categories,
      async (category) => {
        const result = await generateCategoryOverlapByRanking(category);
        if (result) {
          const [overlapsForCategory, usage] = result;
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          for (const overlap of overlapsForCategory.filter(o => o.overlap === "STRONG")) {
            // Always log with the current category first
            let firstId, secondId;
            if (overlap.categoryAId === category.id) {
              firstId = overlap.categoryAId;
              secondId = overlap.categoryBId;
            } else {
              firstId = overlap.categoryBId;
              secondId = overlap.categoryAId;
            }
            const firstSubject = categories.find(c => c.id === firstId)?.insightSubject;
            const secondSubject = categories.find(c => c.id === secondId)?.insightSubject;
            console.log(
              `CategoryOverlap: ${firstId} (${firstSubject}) - ${secondId} (${secondSubject}) (${overlap.overlap})`
            );
          }
        }
      },
      BATCH_COUNT
    );

    console.log('Generating insights...');
    await processInParallel<Category, void>(
      categories,
      async (category) => {
        var totalInsights = await prisma.insight.count({ where: { categoryId: category.id, source: InsightSource.INSPIRATION } });
        // This is not a perfect check to see if we already did the correct job
        if (totalInsights > MINIMUM_TARGET_INSIGHTS) return;
        let done = false;
        let round_fails = 0;
        totalInsights = -1; // first pass is never a failure
        while (!done && totalInsights < MINIMUM_TARGET_INSIGHTS) {
          const newTotalInsights = await prisma.insight.count({ where: { categoryId: category.id, source: InsightSource.INSPIRATION } });
          if (newTotalInsights == totalInsights) {
            round_fails++;
            if (round_fails == 3) {
              console.log(`Terminating inspiration pool generation for category: ${category.insightSubject} after 3 rounds of failure`);
              break;
            }
            continue;
          }
          totalInsights = newTotalInsights;
          const target = Math.max(MIN_NEW_INSIGHTS_PER_GENERATION, Math.min(MAX_NEW_INSIGHTS_PER_GENERATION, MINIMUM_TARGET_INSIGHTS - totalInsights));
          const [newInsights, isDone, usage] = await generateInspirationInsights(category, target);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          done = isDone;
          console.log(`Generated ${newInsights.length} insights for category: ${category.insightSubject} (total: ${totalInsights})`);
          console.log(`${newInsights.map(i => i.insightText).join('\n')}`);

        }
        totalInsights = await prisma.insight.count({ where: { categoryId: category.id, source: InsightSource.INSPIRATION } });

        console.log(`Reducing redundancy for category: ${category.insightSubject}`);
        const [deletedIds, usage] = await reduceRedundancyForInspirations(category);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        console.log(`Reduced redundancy for category: ${category.insightSubject} - ${deletedIds.length} insights deleted of ${totalInsights}`);

      },
      BATCH_COUNT
    );

    console.log('Reducing redundancy for INSPIRATION insights exact matches...');
    const inspirationInsightExactDupes = await reduceExactRedundancyForInspirations();
    for (const mergedInsight of inspirationInsightExactDupes) {
      console.log(`Merged insight: ${mergedInsight.oldInsight.insightText} -> ${mergedInsight.newInsight.insightText}`);
    }

    console.log('Generating questions...');
    const insights = await prisma.insight.findMany({ where: { source: InsightSource.INSPIRATION } });
    insights.sort(() => Math.random() - 0.5);

    await processInParallel<Insight, void>(
      insights,
      async (insight) => {
        try {
          if (insight.source != InsightSource.INSPIRATION) {
            return;
          }
          if (await prisma.question.findFirst({ where: { inspirationId: insight.id } })) {
            return;
          }
          const category = categories.find(c => c.id === insight.categoryId);
          if (!category) return;

          const preferBinary = Math.random() < BINARY_PROBABILITY;
          const [question, answers, insights, usage] = await generateBaseQuestion(insight, preferBinary);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          if (question) {
            console.log(`Generated ${question.questionType} question for insight: ${insight.insightText}`);
            console.log(`${question.questionText}`);
            console.log(`${answers.map(a => a.answerText).join('|||')}`);
            console.log(`${insights.map(i => i.insightText).join('|||')}`);
          } else {
            console.error(`No question generated for insight: ${insight.insightText}`);
            //TODO: delete insight
          }
        } catch (err) {
          console.error(`Error processing insight ID: ${insight.id}`, err);
        }
      },
      BATCH_COUNT
    );



    console.log('Reducing redundancy for QUESTION exact matches...');
    const questionExactDupes = await reduceExactRedundancyForQuestions();
    for (const mergedQuestion of questionExactDupes) {
      console.log(`Merged question: "${mergedQuestion.oldQuestion.questionText}" -> "${mergedQuestion.newQuestion.questionText}"`);
    }
     
    console.log('Reducing redundancy for questions...');
    await processInParallel<Category, void>(
      categories,
      async (category) => {
        const result = await reduceRedundancyForQuestions(category);
        if (result) {
          const [mergedQuestions, usage] = result;
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          for (const mergedQuestion of mergedQuestions) {
            console.log(`Merged question: "${mergedQuestion.oldQuestion.questionText}" -> "${mergedQuestion.newQuestion.questionText}"`);
          }
        }
      },
      BATCH_COUNT
    );

    console.log('Generating questions from proposed concepts...');
    const proposedQuestions = await parseProposedQuestions();
    
    if (proposedQuestions.length > 0) {
      console.log(`Processing ${proposedQuestions.length} proposed questions`);
      
      await processInParallel<string, void>(
        proposedQuestions,
        async (proposedQuestionText) => {
          try {
            // Check if a question with this exact text already exists
            const existingQuestion = await prisma.question.findFirst({
              where: { 
                proposedQuestion: proposedQuestionText
              },
            });

            if (existingQuestion) {
              console.log(`Question already exists: ${proposedQuestionText}`);
              return;
            }

            // First, predict the category for this proposed question
            const categoryResult = await predictQuestionCandidateCategory(proposedQuestionText);
            if (!categoryResult) {
              console.error(`Failed to predict category for proposed question: ${proposedQuestionText}`);
              return;
            }

            const [category, categoryUsage] = categoryResult;
            totalUsage.promptTokens += categoryUsage.prompt_tokens;
            totalUsage.cachedPromptTokens += categoryUsage.prompt_tokens_details?.cached_tokens || 0;
            totalUsage.completionTokens += categoryUsage.completion_tokens;

            // Generate the complete question from the proposal
            // For proposed questions, we'll make them binary by default for simplicity
            const questionResult = await generateQuestionFromProposal(category, proposedQuestionText, false);
            if (!questionResult) {
              console.error(`Failed to generate question from proposal: ${proposedQuestionText}`);
              return;
            }

            const [question, answers, insights, questionUsage] = questionResult;
            totalUsage.promptTokens += questionUsage.prompt_tokens;
            totalUsage.cachedPromptTokens += questionUsage.prompt_tokens_details?.cached_tokens || 0;
            totalUsage.completionTokens += questionUsage.completion_tokens;

            if (question) {
              console.log(`Generated ${question.questionType} question from proposal: ${proposedQuestionText}`);
              console.log(`Generated question: ${question.questionText}`);
              console.log(`Generated answers: ${answers.map(a => a.answerText).join('|||')}`);
              console.log(`Generated insights: ${insights.map(i => i.insightText).join('|||')}`);
            } else {
              console.log(`No question generated from proposal (likely duplicate): ${proposedQuestionText}`);
            }
          } catch (err) {
            console.error(`Error processing proposed question: ${proposedQuestionText}`, err);
          }
        },
        BATCH_COUNT
      );
    } else {
      console.log('No proposed questions found, skipping proposed question generation phase');
    }

    // Handle question import after generation if configured
    if (IMPORT_AFTER_GENERATE) {
      await handleQuestionImport(prisma, categories, totalUsage);
    }

    console.log('Computing question redundancy groups for all categories...');
    await processInParallel<Category, void>(
      categories,
      async (category) => {
        try {
          const usage = await computeQuestionRedundancyGroups(category);
          if (usage) {
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
            totalUsage.completionTokens += usage.completion_tokens;
            console.log(`Computed question redundancy groups for category: ${category.insightSubject}`);
          } else {
            console.log(`No redundancy groups computed for category: ${category.insightSubject} (insufficient questions)`);
          }
        } catch (err) {
          console.error(`Error computing question redundancy groups for category ${category.insightSubject}:`, err);
        }
      },
      BATCH_COUNT
    );

    console.log('Reducing redundancy for ANSWER insights exact matches...');
    const answerInsightExactDupes = await reduceExactRedundancyForAnswers();
    for (const mergedInsight of answerInsightExactDupes) {
      console.log(`Merged insight: ${mergedInsight.oldInsight.insightText} -> ${mergedInsight.newInsight.insightText}`);
    }
    if (REDUCE_ANSWER_INSIGHT_REDUNDANCY) {
      console.log('Reducing redundancy for ANSWER insights AI matches...');
      await processInParallel<Category, void>(
        categories,
        async (category) => {
          const result = await reduceRedundancyForAnswers(category);
          if (result) {
            const [mergedInsights, usage] = result;
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
            totalUsage.completionTokens += usage.completion_tokens;
            for (const mergedInsight of mergedInsights) {
              console.log(`Merged insight: ${mergedInsight.oldInsight.insightText} -> ${mergedInsight.newInsight.insightText}`);
            }
          }
        },
        BATCH_COUNT
      );
    }

    console.log('Generating short insight text for all insights...');
    const allInsights = await prisma.insight.findMany({
      where: {
        source: InsightSource.ANSWER,
        shortInsightText: null, // Only process insights that don't have short text yet
      },
    });
    
    if (allInsights.length > 0) {
      console.log(`Generating short text for ${allInsights.length} insights`);
      
      await processInParallel<Insight, void>(
        allInsights,
        async (insight) => {
          try {
            const result = await generateShortInsightText(insight);
            if (result) {
              const [shortText, usage] = result;
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
              totalUsage.completionTokens += usage.completion_tokens;

              // Update the insight with the generated short text
              await prisma.insight.update({
                where: { id: insight.id },
                data: { shortInsightText: shortText },
              });

              console.log(`Generated short text for insight ${insight.id}: "${shortText}" (from "${insight.insightText}")`);
            } else {
              console.error(`Failed to generate short text for insight ${insight.id}: "${insight.insightText}"`);
            }
          } catch (error) {
            console.error(`Error processing insight ${insight.id}:`, error);
          }
        },
        BATCH_COUNT
      );
    } else {
      console.log('No insights need short text generation, skipping short text generation phase');
    }
    if (GENERATE_SELF_COMPARISONS) {
      console.log('Generating insight comparisons within each question\'s answers...');
      
      // Get all questions that have multiple answer insights to compare
      const questionsToProcess = await prisma.question.findMany({
        include: {
          answers: {
            include: {
              insight: true,
            },
          },
        },
      });

      console.log(`Processing ${questionsToProcess.length} questions for self-comparisons`);

      await processInParallel<typeof questionsToProcess[0], void>(
        questionsToProcess,
        async (question) => {
          try {
            const result = await generateSelfInsightComparisons(question.id, (msg: string) => console.log(msg));
            if (result) {
              const [usage, strongComparisonCount] = result;
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
              totalUsage.completionTokens += usage.completion_tokens;
            }
          } catch (err) {
            console.error(`Error processing question ${question.id} for self-comparisons:`, err);
          }
        },
        BATCH_COUNT
      );
    }
    if (GENERATE_ALL_COMPARISONS) {
      console.log('Generating insight comparisons for strong category overlaps (by relevant categories)...');

      const answerInsights = await prisma.insight.findMany({ where: { source: InsightSource.ANSWER } });
      await processInParallel<Insight, void>(
        answerInsights,
        async (insight) => {
          try {
            // Get relevant categories for this insight using AI
            const overlapResult = await generateInsightCategoryOverlap(insight);
            if (!overlapResult) {
              console.error(`No relevant categories found for insight ${insight.id}`);
              return;
            }
            const [relevantCategories, removedCategories, usage] = overlapResult;
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
            totalUsage.completionTokens += usage.completion_tokens;

            console.log(`Relevant categories for insight ${insight.insightText}: condensed to ${relevantCategories.length} removed ${removedCategories.length}`)
            console.log(`will consider categories: ${relevantCategories.map(c => c.insightSubject).join(', ')}`);

            const existingComparisons = await prisma.insightComparison.findMany({
              where: {
                OR: [
                  { insightAId: insight.id },
                  { insightBId: insight.id },
                ],
              },
              select: { insightAId: true, insightBId: true },
            });
            const existingComparisonSet = new Set(existingComparisons.map(c => c.insightAId === insight.id ? c.insightBId : c.insightAId));
            for (const relevantCategory of relevantCategories) {
              const otherInsights = await prisma.insight.findMany({
                where: {
                  categoryId: relevantCategory.id,
                  source: InsightSource.ANSWER,
                }
              });
              // check if all of otherInsights are in existingComparisonSet
              if (otherInsights.every(o => existingComparisonSet.has(o.id))) {
                continue;
              }
              const [comparisons, usage] = await generateInsightCategoryComparisonByRanking(insight, relevantCategory);
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
              totalUsage.completionTokens += usage.completion_tokens;
              for (const comparison of comparisons) {
                // Only create presentation for strong overlaps
                if (comparison.overlap === "STRONG") {
                  try {
                    const [presentation, usage] = await generateInsightComparisonPresentation(comparison);
                    totalUsage.promptTokens += usage.prompt_tokens;
                    totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
                    totalUsage.completionTokens += usage.completion_tokens;
                    console.log(`Compared: ${comparison.insightAId} <-> ${comparison.insightBId} | ${comparison.polarity} ${comparison.overlap}`);
                    if (presentation) {
                      console.log(`Presentation: ${presentation.presentationTitle}: ${presentation.conciseAText} <-> ${presentation.conciseBText} (Importance: ${presentation.importance})`);
                    }
                  } catch (err) {
                    console.error(`Error generating presentation for comparison ${comparison.id}`, err);
                  }
                } else {
                  //console.log(`Compared: ${comparison.insightAId} <-> ${comparison.insightBId} | ${comparison.polarity} ${comparison.overlap}`);
                }
              }
            }
          } catch (err) {
            console.error(`Error processing insight ID: ${insight.id} for category overlap comparisons`, err);
          }
        },
        BATCH_COUNT
      );
    }

    // Import conversation starters
    await handleConversationStarterImport(prisma);

    clearInterval(usageLogger);
    console.log(`accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);
    console.log('Data generation completed successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 