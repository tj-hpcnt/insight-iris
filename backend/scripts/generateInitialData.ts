import { PrismaClient, InsightSource, OverlapType, PolarityType, PresentationType, QuestionType } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generateInspirationInsights, generateQuestion } from '../src/utils/aiGenerators';
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
        const [newInsights, isDone, usage] = await generateInspirationInsights(category, 10);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        console.log(`accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);
        insights.push(...newInsights);
        totalInsights += newInsights.length;
        done = isDone;
        console.log(`Generated ${newInsights.length} insights for category: ${category.insightSubject} (total: ${totalInsights})`);
      }
    }


    // Generate questions for each insight and style combination
    console.log('Generating questions...');

    for (const insight of insights) {
      if (insight.source != InsightSource.INSPIRATION) {
        continue;
      }
      if (await prisma.question.findFirst({ where: { inspirationId: insight.id } })) {
        continue;
      }
      const category = categories.find(c => c.id === insight.categoryId);
      if (!category) continue;

      for (const style of styles) {
        const [question, answers, insights, usage] = await generateQuestion(insight, style);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        console.log(`accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);
        console.log(`Generated ${question.questionType} question for insight: ${insight.insightText}`);
        console.log(`${question.questionText}`);
        console.log(`${answers.map(a => a.answerText).join('|||')}`);
        console.log(`${insights.map(i => i.insightText).join('|||')}`);
      }
    }

    console.log('Data generation completed successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 