import { PrismaClient, InsightSource, Category, Insight } from '@prisma/client';
import * as dotenv from 'dotenv';
import { generateInspirationInsights, generateBaseQuestion, reassignCategory, reduceRedundancyForInspirations, generateCategoryOverlapByRanking, generateInsightCategoryOverlap, generateInsightComparisonPresentation, generateInsightCategoryComparisonByRanking, reduceExactRedundancyForAnswers, reduceRedundancyForQuestions, reduceExactRedundancyForQuestions, reduceExactRedundancyForInspirations, generateInsightTextFromTag } from '../src/utils/aiGenerators';
import { EXTRA_CATEGORIES, parseCategoriesFromCSV } from './categories';
import { FIXED_STYLES } from './styles';
import { processInParallel } from '../src/utils/parallelProcessor';
import { reduceRedundancyForAnswers } from '../src/utils/aiGenerators';
import { parseInsightsFromCSV } from './insights';
dotenv.config();
const prisma = new PrismaClient();
const BATCH_COUNT = 10;
const MINIMUM_BASE_INSIGHTS = 5
const INSIGHT_INITAL_POOL_COUNT = 10

async function main() {
  try {
    let categories = await prisma.category.findMany();
    
    // Combine categories from CSV and extra categories
    const csvCategories = await parseCategoriesFromCSV();
    const allCategoryData = [...csvCategories, ...EXTRA_CATEGORIES];
    
    // Upsert categories (create or update)
    console.log('Upserting categories...');
    for (const categoryData of allCategoryData) {
      // Check if category already exists
      const existingCategory = categories.find(c => 
        c.category === categoryData.category &&
        c.topicHeader === categoryData.topicHeader &&
        c.subcategory === categoryData.subcategory &&
        c.insightSubject === categoryData.insightSubject
      );

      let category;
      if (existingCategory) {
        // Update existing category
        category = await prisma.category.update({
          where: { id: existingCategory.id },
          data: { expandedHints: categoryData.expandedHints },
        });
        console.log(`Updated category: ${category.category} - ${category.topicHeader} - ${category.subcategory} - ${category.insightSubject}`);
      } else {
        // Create new category
        category = await prisma.category.create({
          data: categoryData,
        });
        categories.push(category);
        console.log(`Created category: ${category.category} - ${category.topicHeader} - ${category.subcategory} - ${category.insightSubject}`);
      }
    }
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

    console.log('Importing pre-existing insights from CSV...');
    const csvInsights = await parseInsightsFromCSV();
    console.log(`Found ${csvInsights.length} insights in CSV`);

    // Phase 1: Insert all CSV insights as DESCRIPTOR type
    const insertedDescriptorInsights: Insight[] = [];
    for (const csvInsight of csvInsights) {
      // Find matching category
      const matchingCategory = categories.find(c => 
        c.category === csvInsight.category &&
        c.subcategory === csvInsight.subcategory &&
        c.insightSubject === csvInsight.insightSubject
      );

      if (!matchingCategory) {
        console.warn(`No matching category found for insight: ${csvInsight.insightTag} (${csvInsight.category} > ${csvInsight.subcategory} > ${csvInsight.insightSubject})`);
        continue;
      }

      // Check if this insight already exists (by publishedTag)
      const existingInsight = await prisma.insight.findFirst({
        where: {
          publishedTag: csvInsight.insightTag,
          source: InsightSource.DESCRIPTOR,
        },
      });

      if (existingInsight) {
        console.log(`Insight already exists: ${csvInsight.insightTag}`);
        insertedDescriptorInsights.push(existingInsight);
        continue;
      }

      // Create the insight with placeholder text
      const insight = await prisma.insight.create({
        data: {
          categoryId: matchingCategory.id,
          insightText: "IMPORTED",
          source: InsightSource.DESCRIPTOR,
          publishedTag: csvInsight.insightTag,
        },
      });
      
      insertedDescriptorInsights.push(insight);
      console.log(`Inserted descriptor insight: ${csvInsight.insightTag}`);
    }

    let totalUsage = {
      promptTokens: 0,
      cachedPromptTokens: 0,
      completionTokens: 0,
    };

    console.log('Phase 2: Generating proper insight text for descriptor insights...');
    const insightsNeedingGeneration = insertedDescriptorInsights.filter(insight => 
      insight.insightText === "IMPORTED" // Only generate for insights that still have placeholder text
    );
    
    if (insightsNeedingGeneration.length > 0) {
      console.log(`Generating insight text for ${insightsNeedingGeneration.length} insights`);
      
      await processInParallel<Insight, void>(
        insightsNeedingGeneration,
        async (insight) => {
          try {
            const category = categories.find(c => c.id === insight.categoryId);
            if (!category) {
              console.error(`Category not found for insight ${insight.id}`);
              return;
            }

            const result = await generateInsightTextFromTag(insight.publishedTag!, category);
            if (result) {
              const [generatedText, usage] = result;
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
              totalUsage.completionTokens += usage.completion_tokens;

              // Update the insight with the generated text
              await prisma.insight.update({
                where: { id: insight.id },
                data: { insightText: generatedText },
              });

              console.log(`Generated insight text for "${insight.publishedTag}": ${generatedText}`);
            } else {
              console.error(`Failed to generate insight text for "${insight.publishedTag}"`);
            }
          } catch (error) {
            console.error(`Error processing insight ${insight.id}:`, error);
          }
        },
        BATCH_COUNT
      );
    } else {
      console.log('All descriptor insights already have generated text, skipping generation phase');
    }

    // Start periodic logging of token usage every 5 seconds
    const usageLogger = setInterval(() => {
      console.log(`accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);
    }, 5000);

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

    const overlaps = await prisma.categoryOverlap.findMany();

    console.log('Generating insights...');
    await processInParallel<Category, void>(
      categories,
      async (category) => {
        var totalInsights = await prisma.insight.count({ where: { categoryId: category.id, source: InsightSource.INSPIRATION } });
        // This is not a perfect check to see if we already did the correct job
        if (totalInsights > MINIMUM_BASE_INSIGHTS) return;
        let done = false;
        let round_fails = 0;
        totalInsights = -1; // first pass is never a failure
        while (!done && totalInsights < INSIGHT_INITAL_POOL_COUNT) {
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
          const target = Math.max(3, Math.min(30, INSIGHT_INITAL_POOL_COUNT - totalInsights));
          const [newInsights, isDone, usage] = await generateInspirationInsights(category, target);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          done = isDone;
          console.log(`Generated ${newInsights.length} insights for category: ${category.insightSubject} (total: ${totalInsights})`);
          console.log(`${newInsights.map(i => i.insightText).join('\n')}`);
          for (const insight of newInsights) {
            const [newCategory, usage] = await reassignCategory(insight);
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
            totalUsage.completionTokens += usage.completion_tokens;
            if (newCategory.id != insight.categoryId) {
              console.log(`Reassigned category for inspiration insight: ${insight.insightText} from ${insight.categoryId} to ${newCategory.id}`);
            }
          }
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

          const [question, answers, insights, usage] = await generateBaseQuestion(insight);
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

    console.log('Reassigning category for inspiration insights...');
    let answerInsights = await prisma.insight.findMany({ where: { source: InsightSource.ANSWER } });

    await processInParallel<Insight, void>(
      answerInsights,
      async (insight) => {
        const originalCategory = await prisma.category.findFirst({ where: { id: insight.categoryId } });
        const [category, usage] = await reassignCategory(insight);
        if (category.id == originalCategory.id) {
          return;
        }
        console.log(`Reassigned category for insight: ${insight.insightText} from ${originalCategory?.insightSubject} to ${category?.insightSubject}`);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
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

    console.log('Reducing redundancy for ANSWER insights exact matches...');
    const answerInsightExactDupes = await reduceExactRedundancyForAnswers();
    for (const mergedInsight of answerInsightExactDupes) {
      console.log(`Merged insight: ${mergedInsight.oldInsight.insightText} -> ${mergedInsight.newInsight.insightText}`);
    }
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

    console.log('Generating insight comparisons for strong category overlaps (by relevant categories)...');

    answerInsights = await prisma.insight.findMany({ where: { source: InsightSource.ANSWER } });
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