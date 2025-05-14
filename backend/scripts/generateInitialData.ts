import { PrismaClient, InsightSource, OverlapType, PolarityType, PresentationType, QuestionType } from '../src/generated/prisma/core';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateInspirationInsights, generateBaseQuestion, generateCategoryOverlap, reassignCategory } from '../src/utils/aiGenerators';
import { CATEGORIES } from './categories';
import { FIXED_STYLES } from './styles';

const result = dotenv.config();
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BATCH_COUNT = 10;

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
      console.log(
        `accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`
      );
    }, 5000);

    const overlaps = await prisma.categoryOverlap.findMany();
    // Generate category overlaps
    if (overlaps.length < categories.length * categories.length) {
      console.log('Generating category overlaps...');
      for (const category of categories) {
        // Split categories into 10 batches
        const batchSize = Math.ceil(categories.length / BATCH_COUNT);
        const categoryBatches = Array.from({ length: BATCH_COUNT }, (_, i) =>
          categories.slice(i * batchSize, (i + 1) * batchSize)
        );

        await Promise.all(
          categoryBatches.map(async (batch) => {
            for (const otherCategory of batch) {
              // make sure we sort them so that we don't generate bidirectionally and can use the LLM cache
              const [categoryA, categoryB] = [category, otherCategory].sort((a, b) => a.id - b.id);
              let existing = await prisma.categoryOverlap.findFirst({ where: { categoryAId: categoryA.id, categoryBId: categoryB.id } });
              if (existing) {
                continue;
              }
              const [overlap, usage] = await generateCategoryOverlap(categoryA, categoryB);
              overlaps.push(overlap);
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
              totalUsage.completionTokens += usage.completion_tokens;
              console.log(`${category.category}:${category.subcategory}:${category.insightSubject} - ${otherCategory.category}:${otherCategory.subcategory}:${otherCategory.insightSubject} - ${overlap?.overlap}`);
            }
          })
        );
        // Removed per-iteration token log
      }
    }

    const insights = await prisma.insight.findMany();
    // Generate insights for each category using the new utility function
    console.log('Generating insights...');
    // Split categories into batches
    const categoryBatchSize = Math.ceil(categories.length / BATCH_COUNT);
    const categoryBatches = Array.from({ length: BATCH_COUNT }, (_, i) =>
      categories.slice(i * categoryBatchSize, (i + 1) * categoryBatchSize)
    );

    await Promise.all(
      categoryBatches.map(async (batch, batchIndex) => {
        for (const category of batch) {
          if (insights.filter(i => i.categoryId == category.id).length > 0) {
            continue;
          }
          let totalInsights = 0;
          let done = false;

          while (!done && totalInsights < 10) {
            const [newInsights, isDone, usage] = await generateInspirationInsights(category, 5);
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
            totalUsage.completionTokens += usage.completion_tokens;
            insights.push(...newInsights);
            totalInsights += newInsights.length;
            done = isDone;
            console.log(`[Batch ${batchIndex + 1}] Generated ${newInsights.length} insights for category: ${category.insightSubject} (total: ${totalInsights})`);
            console.log(`${newInsights.map(i => i.insightText).join('\n')}`);
          }
        }
      })
    );


    // Generate questions for each insight and style combination
    console.log('Generating questions...');

    const style = styles.find(s => s.description.indexOf("cheeky") >= 0);

    insights.sort(() => Math.random() - 0.5);

    // Split insights into 10 batches
    batchSize = Math.ceil(insights.length / BATCH_COUNT);
    insightBatches = Array.from({ length: BATCH_COUNT }, (_, i) =>
      insights.slice(i * batchSize, (i + 1) * batchSize)
    );

    await Promise.all(
      insightBatches.map(async (batch, batchIndex) => {
        for (const insight of batch) {
          try {
            if (insight.source != InsightSource.INSPIRATION) {
              continue;
            }
            if (await prisma.question.findFirst({ where: { inspirationId: insight.id } })) {
              continue;
            }
            const category = categories.find(c => c.id === insight.categoryId);
            if (!category) continue;

            const [question, answers, insights, usage] = await generateBaseQuestion(insight);
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
            totalUsage.completionTokens += usage.completion_tokens;
            console.log(`[Batch ${batchIndex + 1}] Generated ${question.questionType} question for insight: ${insight.insightText}`);
            console.log(`${question.questionText}`);
            console.log(`${answers.map(a => a.answerText).join('|||')}`);
            console.log(`${insights.map(i => i.insightText).join('|||')}`);
          } catch (err) {
            console.error(`Error processing insight ID: ${insight.id}`, err);
          }
        }
      })
    );

    // reassign the category for the inspiration insights
    console.log('Reassigning category for inspiration insights...');
    // Filter inspiration insights and split into batches
    const inspirationInsights = insights.filter(insight => insight.source === InsightSource.INSPIRATION);
    var batchSize = Math.ceil(inspirationInsights.length / BATCH_COUNT);
    var insightBatches = Array.from({ length: BATCH_COUNT }, (_, i) =>
      inspirationInsights.slice(i * batchSize, (i + 1) * batchSize)
    );

    await Promise.all(
      insightBatches.map(async (batch, batchIndex) => {
        for (const insight of batch) {
          const originalCategory = await prisma.category.findFirst({ where: { id: insight.categoryId } });
          const [category, usage] = await reassignCategory(insight);
          if (category.id == originalCategory.id) {
            continue;
          }
          console.log(`[Batch ${batchIndex + 1}] Reassigned category for insight: ${insight.insightText} from ${originalCategory?.insightSubject} to ${category?.insightSubject}`);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
        }
      })
    );

    // Generate insight comparisons for pairs with strong category overlap
    console.log('Generating insight comparisons for strong category overlaps...');
    // Get all pairs of insights in different categories
    const insightPairs = [];
    for (let i = 0; i < insights.length; i++) {
      for (let j = i + 1; j < insights.length; j++) {
        const a = insights[i];
        const b = insights[j];
        if (a.categoryId === b.categoryId) continue;
        insightPairs.push([a, b]);
      }
    }
    // Batch the pairs
    const pairBatchSize = Math.ceil(insightPairs.length / BATCH_COUNT);
    const pairBatches = Array.from({ length: BATCH_COUNT }, (_, i) =>
      insightPairs.slice(i * pairBatchSize, (i + 1) * pairBatchSize)
    );
    await Promise.all(
      pairBatches.map(async (batch, batchIndex) => {
        for (var [insightA, insightB] of batch) {
          //swap insight a and b if their ids are out of order to maximize caching
          if (insightA.id > insightB.id) {
            [insightA, insightB] = [insightB, insightA];
          }
          // Skip if already compared
          const existing = await prisma.insightComparison.findFirst({
            where: {
              insightAId: insightA.id,
              insightBId: insightB.id,
            },
          });
          if (existing) continue;
          // Query for a strong overlap between the categories
          const overlap = await prisma.categoryOverlap.findFirst({
            where: {
              categoryAId: Math.min(insightA.categoryId, insightB.categoryId), 
              categoryBId: Math.max(insightA.categoryId, insightB.categoryId),
              overlap: 'STRONG',
            }
          });
          if (!overlap) continue;
          try {
            const result = await import('../src/utils/aiGenerators');
            const generateInsightComparison = result.generateInsightComparison;
            const comparisonResult = await generateInsightComparison(insightA, insightB);
            if (comparisonResult) {
              const [comparison, usage] = comparisonResult;
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
              totalUsage.completionTokens += usage.completion_tokens;
              console.log(`[Batch ${batchIndex + 1}] Compared: ${insightA.insightText} <-> ${insightB.insightText}`);
              if (comparison) {
                console.log(`[Batch ${batchIndex + 1}] ${comparison.polarity} ${comparison.overlap} ${comparison.presentation}`);
                console.log(`[Batch ${batchIndex + 1}] ${comparison.presentationTitle}: ${comparison.conciseAText} <-> ${comparison.conciseBText}`);
              }
            }
          } catch (err) {
            console.error(`Error comparing insights ${insightA.id} and ${insightB.id}`, err);
          }
        }
      })
    );

    clearInterval(usageLogger);
    console.log('Data generation completed successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 