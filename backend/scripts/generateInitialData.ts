import { PrismaClient, InsightSource, OverlapType, PolarityType, PresentationType, QuestionType } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateInspirationInsights, generateBaseQuestion, generateCategoryOverlap } from '../src/utils/aiGenerators';
import { CATEGORIES } from './categories';
import { FIXED_STYLES } from './styles';

const result = dotenv.config();
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        console.log(`Created category: ${category.category} - ${category.topicHeader}`);
      }
    }
    const styles = await prisma.style.findMany();
    // Create fixed styles
    if (styles.length == 0) {
      console.log('Creating styles...');
      for (const styleDescription of FIXED_STYLES) {
        const style = await prisma.style.create({
          data: { description: styleDescription },
        });
        styles.push(style);
        console.log(`Created style: ${styleDescription.substring(0, 50)}...`);
      }
    }

    let totalUsage = {
      promptTokens: 0,
      cachedPromptTokens: 0,
      completionTokens: 0,
    };

    const overlaps = await prisma.categoryOverlap.findMany();
    // Generate category overlaps
    if (overlaps.length < categories.length * categories.length) {
      console.log('Generating category overlaps...');
      for (const category of categories) {
        for (const otherCategory of categories) {
          let existing = await prisma.categoryOverlap.findFirst({ where: { categoryAId: category.id, categoryBId: otherCategory.id } });
          if (existing) {
            continue;
          }
          const [overlap, usage] = await generateCategoryOverlap(category, otherCategory);
          overlaps.push(overlap);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          console.log(`${category.category}:${category.subcategory}:${category.insightSubject} - ${otherCategory.category}:${otherCategory.subcategory}:${otherCategory.insightSubject} - ${overlap?.overlap}`);
        }
      }
    }
    console.log(`accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);

    const insights = await prisma.insight.findMany();
    // Generate insights for each category using the new utility function
    console.log('Generating insights...');
    for (const category of categories) {
      if (insights.filter(i => i.categoryId == category.id).length > 0) {
        continue;
      }
      let totalInsights = 0;
      let done = false;

      while (!done && totalInsights < 50) {
        const [newInsights, isDone, usage] = await generateInspirationInsights(category, 30);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        console.log(`accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);
        insights.push(...newInsights);
        totalInsights += newInsights.length;
        done = isDone;
        console.log(`Generated ${newInsights.length} insights for category: ${category.insightSubject} (total: ${totalInsights})`);
        console.log(`${newInsights.map(i => i.insightText).join('\n')}`);
      }
    }


    // Generate questions for each insight and style combination
    console.log('Generating questions...');

    const style = styles.find(s => s.description.indexOf("cheeky") >= 0);

    insights.sort(() => Math.random() - 0.5);

    // Split insights into 10 batches
    const batchCount = 10;
    const batchSize = Math.ceil(insights.length / batchCount);
    const insightBatches = Array.from({ length: batchCount }, (_, i) =>
      insights.slice(i * batchSize, (i + 1) * batchSize)
    );

    await Promise.all(
      insightBatches.map(async (batch, batchIndex) => {
        for (const insight of batch) {
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
          console.log(`[Batch ${batchIndex + 1}] accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);
          console.log(`[Batch ${batchIndex + 1}] Generated ${question.questionType} question for insight: ${insight.insightText}`);
          console.log(`${question.questionText}`);
          console.log(`${answers.map(a => a.answerText).join('|||')}`);
          console.log(`${insights.map(i => i.insightText).join('|||')}`);
        }
      })
    );

    console.log('Data generation completed successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 