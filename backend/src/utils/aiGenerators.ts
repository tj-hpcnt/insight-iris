import { PrismaClient, InsightSource, Category, Style, Insight, QuestionType, Question, Answer, CategoryOverlap, OverlapType } from '../../src/generated/prisma/core';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { PrismaClient as CachePrismaClient } from '../../src/generated/prisma/cache';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();
const cachePrisma = new CachePrismaClient();

/**
 * Fetches a cached prompt execution from the database
 * @param model The model used for the completion
 * @param messages The messages sent to the model
 * @param format The response format used
 * @returns The cached completion result if found, null otherwise
 */
async function fetchCachedExecution(
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  format: { type: string; json_schema: any }
): Promise<OpenAI.Chat.Completions.ChatCompletion | null> {
  const cached = await cachePrisma.cache.findFirst({
    where: {
      model,
      prompt: JSON.stringify(messages),
      format: JSON.stringify(format),
    },
  });

  if (!cached) {
    return null;
  }

  return JSON.parse(cached.output) as OpenAI.Chat.Completions.ChatCompletion;
}

/**
 * Caches the result of a prompt execution in the database
 * @param model The model used for the completion
 * @param messages The messages sent to the model
 * @param format The response format used
 * @param completion The completion result from OpenAI
 */
async function cachePromptExecution(
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  format: { type: string; json_schema: any },
  completion: OpenAI.Chat.Completions.ChatCompletion
) {
  await cachePrisma.cache.create({
    data: {
      model,
      prompt: JSON.stringify(messages),
      format: JSON.stringify(format),
      output: JSON.stringify(completion),
    },
  });
}

/**
 * Generates a specified number of insights for a given category
 * @param category The category to generate insights for
 * @param count Number of insights to generate
 * @returns Tuple containing array of created insight objects, boolean indicating if all useful insights have been generated, and token usage statistics
 */
export async function generateInspirationInsights(category: Category, count: number): Promise<[Insight[], boolean, OpenAI.Completions.CompletionUsage]> {
  var extraHints = "";
  if (category.expandedHints) {
    extraHints = `Hints:${category.expandedHints}
    `;
  }

  const existingInsights = await prisma.insight.findMany({
    where: {
      categoryId: category.id,
    },
  });

  var existingInsightsText = existingInsights.map(insight => insight.insightText).join("\n");

  if (existingInsightsText.length > 0) {
    existingInsightsText = `
Existing insights for this category:
${existingInsightsText}`;
  }

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers.  We need to generate the most useful insights that we could use to perform matching and introductions to start building the question database.  The utility of the insights should be evaluated in terms of various factors including:
- Will it help as an ice breaker if you knew each others' answers?
- Does it imply compatibility for casual daily life?
- Does it imply compatibility for long term plans?
- Does it imply you can have a lot of fun together?
- Does it help you on a first date?
- Is it not a criterion for matching but knowing it would help you understand each other ?

Generate ${count} candidate insights for the requested category.  If all useful insights have been generated, set done to true.  Don't generate duplicate or useless insights.  Output JSON only.  Format:

{"insights":["I enjoy Italian food", "I prefer a partner who works out a lot", "I love dogs"], "done":false}
{"insights":[],"done":true}

Category: ${category.category}	
Topic: ${category.topicHeader}	
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}
${extraHints}${existingInsightsText}`;

  const model = "gpt-4.1";
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      name: "insights",
      schema: {
        type: "object",
        properties: {
          insights: {
            type: "array",
            items: {
              type: "string"
            }
          },
          done: {
            type: "boolean"
          }
        },
        required: ["insights", "done"]
      }
    },
  };

  // Try to fetch from cache first
  const cachedCompletion = await fetchCachedExecution(model, messages, format);
  const completion = cachedCompletion || await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  if (!cachedCompletion) {
    await cachePromptExecution(model, messages, format, completion);
  }

  let insightData = (completion.choices[0].message as any).parsed || { insights: [], done: true };
  const insights = [];

  try {
    for (const insightText of insightData.insights) {
      const insight = await prisma.insight.create({
        data: {
          insightText,
          categoryId: category.id,
          source: InsightSource.INSPIRATION,
        },
      });
      insights.push(insight);
    }
  } catch (error) {
    console.error('Error creating insights:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null
  }

  return [insights, insightData.done, completion.usage];
}

/**
 * Generates a question for a given insight and style
 * @param insight The insight to generate a question for
 * @param style The style to use for question generation
 * @returns Tuple containing the created question object, array of answers, array of insights, and token usage statistics
 */
export async function generateBaseQuestion(
  insight: Insight
): Promise<[Question, Answer[], Insight[], OpenAI.Completions.CompletionUsage] | null> {
  const category = await prisma.category.findUnique({
    where: { id: insight.categoryId }
  });

  if (!category) {
    throw new Error(`Category not found for insight ${insight.id}`);
  }

  const typeDescription = {
    [QuestionType.BINARY]: "a binary question (yes/no, true/false, agree/disagree)",
    [QuestionType.SINGLE_CHOICE]: "a single-choice question with multiple options",
    [QuestionType.MULTIPLE_CHOICE]: "a multiple-choice question where multiple options can be selected"
  };

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers.  We need to generate the fun questions to answer that can explore a potential insight 

You must generate a great question to facilitate finding out if a particular insight is true of a user.  There will always be a skip option so if no choice is suitable, then you don't need to include a vague alternative, only include decisive alternatives.  Any option presented should produce a usable insight about the person answering the question.  If an insight could have parallel interesting insights, then prefer a single choice or multiple choice based answer instead of a binary statement.  When making a Yes or No / True / False type question, do not include the details in the answer. Output JSON only.  Format:

{"question":"Which food do you love the most?","answers":["Pizza", "Steak", "Salad", "Noodles"], "insights":["I love pizza", "I love steak", "I love Salad", "I love Noodles"], "type":"MULTIPLE_CHOICE"}

The allowed question types are:
- BINARY: ${typeDescription[QuestionType.BINARY]}
- SINGLE_CHOICE: ${typeDescription[QuestionType.SINGLE_CHOICE]}
- MULTIPLE_CHOICE: ${typeDescription[QuestionType.MULTIPLE_CHOICE]}

The classification for the insight is:
Category: ${category.category}	
Topic: ${category.topicHeader}	
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

The insight to query is:
${insight.insightText}`;

  const model = "gpt-4.1";
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      name: "question",
      schema: {
        type: "object",
        properties: {
          question: {
            type: "string"
          },
          answers: {
            type: "array",
            items: {
              type: "string"
            }
          },
          insights: {
            type: "array",
            items: {
              type: "string"
            }
          },
          type: {
            type: "string",
            enum: ["BINARY", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]
          }
        },
        required: ["question", "answers", "insights", "type"]
      }
    }
  };

  // Try to fetch from cache first
  const cachedCompletion = await fetchCachedExecution(model, messages, format);
  const completion = cachedCompletion || await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  if (!cachedCompletion) {
    await cachePromptExecution(model, messages, format, completion);
  }

  try {
    const questionData = (completion.choices[0].message as any).parsed as {
      question: string;
      answers: string[];
      insights: string[];
      type: QuestionType;
    };
    if (!questionData) {
      throw new Error("Parse error");
    }

    const question = await prisma.question.create({
      data: {
        questionText: questionData.question,
        questionType: questionData.type,
        inspirationId: insight.id,
      },
    });

    // Create answers and insights
    const answers: Answer[] = [];
    const newInsights: Insight[] = [];

    for (let i = 0; i < questionData.answers.length; i++) {
      // Create new insight for each answer
      const newInsight = await prisma.insight.create({
        data: {
          insightText: questionData.insights[i],
          categoryId: category.id,
          source: InsightSource.ANSWER,
        },
      });
      newInsights.push(newInsight);

      // Create answer linking question to insight
      const answer = await prisma.answer.create({
        data: {
          answerText: questionData.answers[i],
          questionId: question.id,
          insightId: newInsight.id,
        },
      });
      answers.push(answer);
    }

    return [question, answers, newInsights, completion.usage];
  } catch (error) {
    console.error('Error creating question:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Generates a category overlap between two categories using AI to determine if their insights might overlap
 * @param categoryA The first category to compare
 * @param categoryB The second category to compare
 * @returns The created CategoryOverlap object and token usage statistics
 */
export async function generateCategoryOverlap(
  categoryA: Category,
  categoryB: Category
): Promise<[CategoryOverlap, OpenAI.Completions.CompletionUsage] | null> {
  if (categoryA.id == categoryB.id) {
    const overlap = await prisma.categoryOverlap.create({
      data: {
        categoryAId: categoryA.id,
        categoryBId: categoryB.id,
        overlap: OverlapType.STRONG,
      },
    });
    const usage = { prompt_tokens: 0, prompt_tokens_details: { cached_tokens: 0 }, completion_tokens: 0, total_tokens: 0 };
    return [overlap, usage];
  }
  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to determine if two categories of insights might have overlapping or related insights.  Ultimately we will take each pair of potential insights in categoryies that you determine to have overlapp and analyze them to see if they imply compatibility or incomaptibility between the two users.   

Category A:
Category: ${categoryA.category}
Topic: ${categoryA.topicHeader}
Subcategory: ${categoryA.subcategory}
Subject: ${categoryA.insightSubject}

Category B:
Category: ${categoryB.category}
Topic: ${categoryB.topicHeader}
Subcategory: ${categoryB.subcategory}
Subject: ${categoryB.insightSubject}

Determine the likelihood of insights from category A and category B being implying compatibility between the two users. Output JSON only. Format:
{"overlap":"STRONG"}
{"overlap":"WEAK"}

Inisghts from categories might look like:
"I love to travel"
"I prefer a partner who can provide for me"

Use STRONG if the categories are likely to have insights that have strong implication for compatibility.
Use WEAK if the categories are not likely to have insights that imply compatibility.`;

  const model = "gpt-4.1";
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      name: "overlap",
      schema: {
        type: "object",
        properties: {
          overlap: {
            type: "string",
            enum: ["STRONG", "WEAK", "NONE"]
          }
        },
        required: ["overlap"]
      }
    }
  };

  // Try to fetch from cache first
  const cachedCompletion = await fetchCachedExecution(model, messages, format);
  const completion = cachedCompletion || await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  if (!cachedCompletion) {
    await cachePromptExecution(model, messages, format, completion);
  }

  try {
    const overlapData = (completion.choices[0].message as any).parsed as {
      overlap: OverlapType;
    };
    if (!overlapData) {
      throw new Error("Parse error");
    }
    
    const categoryOverlap = await prisma.categoryOverlap.create({
      data: {
        categoryAId: categoryA.id,
        categoryBId: categoryB.id,
        overlap: overlapData.overlap,
      },
    });

    return [categoryOverlap, completion.usage];
  } catch (error) {
    console.error('Error creating category overlap:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Generates a new category for an insight using AI to determine the best fit
 * @param insight The insight to recategorize
 * @returns Tuple containing the new category object and token usage statistics
 */
export async function reassignCategory(
  insight: Insight
): Promise<[Category, OpenAI.Completions.CompletionUsage] | null> {
  // Get all existing categories
  const categories = await prisma.category.findMany();
  const allSubjects = []

  const existingCategory = await prisma.category.findFirst({ where: { id: insight.categoryId } });
  if (!existingCategory) {
    throw new Error("Category not found");
  }
  
  // Build category tree
  const categoryTree = categories.reduce((tree, cat) => {
    if (!tree[cat.category]) {
      tree[cat.category] = {};
    }
    if (!tree[cat.category][cat.topicHeader]) {
      tree[cat.category][cat.topicHeader] = {};
    }
    if (!tree[cat.category][cat.topicHeader][cat.subcategory]) {
      tree[cat.category][cat.topicHeader][cat.subcategory] = [];
    }
    tree[cat.category][cat.topicHeader][cat.subcategory].push(cat.insightSubject);
    allSubjects.push(cat.insightSubject);
    return tree;
  }, {} as Record<string, Record<string, Record<string, string[]>>>);

  // Convert tree to string representation
  const categoryTreeStr = Object.entries(categoryTree)
    .map(([category, topics]) => {
      return `${category}:\n${Object.entries(topics)
        .map(([topic, subcategories]) => {
          return `  ${topic}:\n${Object.entries(subcategories)
            .map(([subcategory, subjects]) => {
              return `    ${subcategory}:\n${subjects
                .map(subject => `      - ${subject}`)
                .join('\n')}`;
            })
            .join('\n')}`;
        })
        .join('\n')}`;
    })
    .join('\n');

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to determine the most appropriate category for an insight.

The insight to categorize is:
"${insight.insightText}"

It was generated related to another insight with this classification, so there is a decent chance that it is related to the same category:
Category: ${existingCategory.category}	
Topic: ${existingCategory.topicHeader}	
Subcategory: ${existingCategory.subcategory}
Subject: ${existingCategory.insightSubject}

Here is the hierarchical category structure:
${categoryTreeStr}

Please select the most appropriate leaf category (insightSubject) for this insight. The category should be the most specific and relevant category that captures the essence of the insight. Output JSON only. Format:

{"insightSubject":"Dietary preferences"}`;

  const model = "gpt-4.1";
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      name: "category",
      schema: {
        type: "object",
        properties: {
          insightSubject: {
            type: "string",
            enum: allSubjects
          }
        },
        required: ["insightSubject"]
      }
    }
  };

  // Try to fetch from cache first
  const cachedCompletion = await fetchCachedExecution(model, messages, format);
  const completion = cachedCompletion || await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  if (!cachedCompletion) {
    await cachePromptExecution(model, messages, format, completion);
  }

  try {
    const categoryData = (completion.choices[0].message as any).parsed as {
      insightSubject: string;
    };
    if (!categoryData) {
      throw new Error("Parse error");
    }

    // Find or create the category
    let category = await prisma.category.findFirst({
      where: {
        insightSubject: categoryData.insightSubject,
      },
    });

    if (!category) {
      throw new Error("Unknown subject");
    }

    // update the category for the insight
    await prisma.insight.update({
      where: { id: insight.id },
      data: { categoryId: category.id },
    });

    return [category, completion.usage];
  } catch (error) {
    console.error('Error creating category:', error);
    console.error('Raw response:', completion.choices[0].message);
    return [null, completion.usage];
  }
} 