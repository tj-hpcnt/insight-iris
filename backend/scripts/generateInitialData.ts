import { PrismaClient, InsightSource, Category, Insight } from '../src/generated/prisma/core';
import * as dotenv from 'dotenv';
import { generateInspirationInsights, generateBaseQuestion, generateCategoryOverlap, reassignCategory, generateInsightComparison, reduceRedundancy, generateCategoryOverlapByRanking, generateInsightCategoryOverlap, generateInsightComparisonPresentation, generateInsightCategoryComparisonByRanking } from '../src/utils/aiGenerators';
import { CATEGORIES } from './categories';
import { FIXED_STYLES } from './styles';
import { processInParallel } from '../src/utils/parallelProcessor';

dotenv.config();
const prisma = new PrismaClient();
const BATCH_COUNT = 10;
const MINIMUM_BASE_INSIGHTS = 10
const INSIGHT_INITAL_POOL_COUNT = 100

async function main() {
  try {
    const categories = await prisma.category.findMany();
    // Insert categories from CATEGORIES constant
    if (categories.length == 0) {
      console.log('Inserting categories...');
      for (const categoryData of CATEGORIES) {
        const category = await prisma.category.create({
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

    let totalUsage = {
      promptTokens: 0,
      cachedPromptTokens: 0,
      completionTokens: 0,
    };

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
          const target = Math.max(10, Math.min(30, INSIGHT_INITAL_POOL_COUNT - totalInsights));
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
        console.log(`Reducing redundancy for category: ${category.insightSubject}`);
        const [deletedIds, usage] = await reduceRedundancy(category);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        console.log(`Reduced redundancy for category: ${category.insightSubject} - ${deletedIds.length} insights deleted of ${totalInsights}`);

      },
      BATCH_COUNT
    );

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
          console.log(`Generated ${question.questionType} question for insight: ${insight.insightText}`);
          console.log(`${question.questionText}`);
          console.log(`${answers.map(a => a.answerText).join('|||')}`);
          console.log(`${insights.map(i => i.insightText).join('|||')}`);
        } catch (err) {
          console.error(`Error processing insight ID: ${insight.id}`, err);
        }
      },
      BATCH_COUNT
    );

    console.log('Reassigning category for inspiration insights...');
    const answerInsights = await prisma.insight.findMany({ where: { source: InsightSource.ANSWER } });

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

    console.log('Generating insight comparisons for strong category overlaps (by relevant categories)...');

    // Only consider INSPIRATION insights
    const inspirationInsights = insights.filter(i => i.source === InsightSource.INSPIRATION);

    // Iterate over each inspiration insight
    await processInParallel<Insight, void>(
      inspirationInsights,
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
                    console.log(`Presentation: ${presentation.presentationTitle}: ${presentation.conciseAText} <-> ${presentation.conciseBText}`);
                  }
                } catch (err) {
                  console.error(`Error generating presentation for comparison ${comparison.id}`, err);
                }
              } else {
                console.log(`Compared: ${comparison.insightAId} <-> ${comparison.insightBId} | ${comparison.polarity} ${comparison.overlap}`);
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