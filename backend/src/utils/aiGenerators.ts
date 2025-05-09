import { PrismaClient, InsightSource, Category, Style, Insight, QuestionType } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

/**
 * Generates a specified number of insights for a given category
 * @param category The category to generate insights for
 * @param count Number of insights to generate
 * @returns Array of created insight objects
 */
export async function generateInspirationInsights(category: Category, count: number) {
  const insights = [];
  
  for (let i = 0; i < count; i++) {
    const prompt = `Generate an insight for a category with topic "${category.topic}" and category "${category.category}". 
    The insight should be:
    - Relevant to the category
    - Thought-provoking
    - Clear and concise
    
    Return the response as a JSON object with:
    - insightText: The text of the insight
    - source: One of "INSPIRATION", "ANSWER", or "DESCRIPTOR"`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const insightData = JSON.parse(completion.choices[0].message.content);
    
    const insight = await prisma.insight.create({
      data: {
        ...insightData,
        categoryId: category.id,
        source: insightData.source as InsightSource,
      },
    });
    
    insights.push(insight);
  }

  return insights;
}

/**
 * Generates a question for a given insight and style
 * @param insight The insight to generate a question for
 * @param style The style to use for question generation
 * @param questionType The type of question to generate (BINARY, SINGLE_CHOICE, or MULTIPLE_CHOICE)
 * @returns The created question object
 */
export async function generateQuestion(
  insight: Insight, 
  style: Style,
  questionType: QuestionType
) {
  const typeDescription = {
    [QuestionType.BINARY]: "a binary question (yes/no, true/false, agree/disagree)",
    [QuestionType.SINGLE_CHOICE]: "a single-choice question with multiple options",
    [QuestionType.MULTIPLE_CHOICE]: "a multiple-choice question where multiple options can be selected"
  }[questionType];

  const prompt = `Generate ${typeDescription} for exploring this insight: "${insight.insightText}".
    The question should be:
    - Thought-provoking
    - Open-ended
    - Relevant to understanding the insight better
    - Following this style: "${style.description}"
    
    Return the response as a JSON object with:
    - questionText: The actual question text`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
    response_format: { type: "json_object" },
  });

  const questionData = JSON.parse(completion.choices[0].message.content);
  
  const question = await prisma.question.create({
    data: {
      ...questionData,
      styleId: style.id,
      inspirationId: insight.id,
      questionType,
    },
  });
  
  return question;
} 