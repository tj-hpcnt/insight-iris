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
    // Insert categories from CATEGORIES constant
    console.log('Inserting categories...');
    const categories = [];
    for (const categoryData of CATEGORIES) {
      const category = await prisma.category.create({
        data: categoryData,
      });
      categories.push(category);
      console.log(`Created category: ${category.category} - ${category.topicHeader}`);
    }

    // Generate insights for each category using the new utility function
    console.log('Generating insights...');
    const insights = [];
    for (const category of categories) {
      const categoryInsights = await generateInspirationInsights(category, 1);
      insights.push(...categoryInsights);
      console.log(`Generated insights for category: ${category.insightSubject}`);
    }

    // Create fixed styles
    console.log('Creating styles...');
    const styles = [];
    for (const styleDescription of FIXED_STYLES) {
      const style = await prisma.style.create({
        data: { description: styleDescription },
      });
      styles.push(style);
      console.log(`Created style: ${styleDescription.substring(0, 50)}...`);
    }

    // Generate questions for each insight and style combination
    console.log('Generating questions...');
    const questionTypes = [QuestionType.BINARY, QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE];
    
    for (const insight of insights) {
      const category = categories.find(c => c.id === insight.categoryId);
      if (!category) continue;

      for (const style of styles) {
        for (const questionType of questionTypes) {
          await generateQuestion(insight, style, questionType);
          console.log(`Generated ${questionType} question for insight: ${insight.insightText.substring(0, 50)}...`);
        }
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