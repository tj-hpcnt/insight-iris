import { PrismaClient, InsightSource, Category, Style, Insight, QuestionType, Question, Answer, CategoryOverlap, OverlapType, PolarityType, InsightComparison, InsightComparisonPresentation } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { fetchCachedExecution, cachePromptExecution } from './llmCaching';
import { pickSampleQuestions } from '../../scripts/questions';
import { deleteQuestionWithCascade } from './delete';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

const ULTRA_LOW_MODEL = "gpt-4.1";
const LOW_MODEL = "o3";
const HIGH_MODEL = "o3";

export function fixIllegalEnumCharacters(str: string): string {
  str = str.replaceAll('"', "\'")
  str = str.replaceAll('…', '...')
  return str
}

/**
 * Generates a unique persistent ID for questions with collision detection
 * @param prefix Either 'GQ' for generated questions or 'PQ' for proposed questions
 * @param tx Optional Prisma transaction client
 * @returns A unique persistent ID in format GQXXXXXX or PQXXXXXX
 */
export async function generateUniquePersistentId(prefix: 'GQ' | 'PQ', tx?: any): Promise<string> {
  const client = tx || prisma;
  const maxRetries = 100; // Prevent infinite loops
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate random 6-digit number
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    const persistentId = `${prefix}${randomNumber}`;
    
    // Check if this ID already exists
    const existingQuestion = await client.question.findUnique({
      where: { persistentId }
    });
    
    if (!existingQuestion) {
      return persistentId;
    }
  }
  
  throw new Error(`Failed to generate unique persistent ID after ${maxRetries} attempts`);
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

  // Get all categories to build taxonomy
  const allCategories = await prisma.category.findMany();
  
  // Build category tree for context
  const categoryTree = allCategories.reduce((tree, cat) => {
    if (!tree[cat.category]) {
      tree[cat.category] = {};
    }
    if (!tree[cat.category][cat.subcategory]) {
      tree[cat.category][cat.subcategory] = [];
    }
    tree[cat.category][cat.subcategory].push(cat.insightSubject);
    return tree;
  }, {} as Record<string, Record<string, string[]>>);

  // Convert tree to string representation
  const categoryTreeStr = Object.entries(categoryTree)
    .map(([category, subcategories]) => {
      return `${category}:\n${Object.entries(subcategories)
        .map(([subcategory, subjects]) => {
          return `  ${subcategory}:\n${subjects
            .map(subject => `    - ${subject}`)
            .join('\n')}`;
        })
        .join('\n')}`;
    })
    .join('\n');

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

Generate ${count} candidate insights for the requested category.  If all useful insights have been generated, set done to true.  Don't generate duplicate or useless insights.  Focus on insights that are specific to the target category and don't overlap with insights that would be better categorized elsewhere. Output JSON only.  Format:

{"insights":["I enjoy Italian food", "I prefer a partner who works out a lot", "I love dogs"], "done":false}
{"insights":[],"done":true}

Here is the complete insight taxonomy to help you understand the scope and avoid overlap:
${categoryTreeStr}

Target Category: ${category.category}	
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}
${extraHints}${existingInsightsText}`;

  const model = LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
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
        required: ["insights", "done"],
        additionalProperties: false
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

  let insightData = (completion.choices[0].message as any).parsed || { insights: [], done: true };
  const insights = [];

  try {
    for (const insightText of insightData.insights) {
      const insight = await prisma.insight.create({
        data: {
          insightText: fixIllegalEnumCharacters(insightText),
          categoryId: category.id,
          source: InsightSource.INSPIRATION,
        },
      });
      insights.push(insight);
    }

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [insights, insightData.done, completion.usage];
  } catch (error) {
    console.error('Error creating insights:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null
  }
}


const TYPE_DESCRIPTIONS = {
  [QuestionType.BINARY]: "a statement that the user will either press heart or X on (e.g. allowed answers are only Yes or No)",
  [QuestionType.SINGLE_CHOICE]: "a multiple-choice question were only one option makes sense to select (maximum 5 answers)",
  [QuestionType.MULTIPLE_CHOICE]: "a multiple-choice question where multiple options can be selected (maximum 5 answers)"
};


/**
 * Builds the prompt and messages for question generation
 * @param insight The insight to generate a question for
 * @param category The category for the insight
 * @param preferBinary Whether to prefer binary questions
 * @returns Tuple containing the prompt messages, format schema, and model
 */
async function buildQuestionGenerationPrompt(
  insight: Insight,
  category: Category,
  preferBinary: boolean
): Promise<[OpenAI.Chat.ChatCompletionMessageParam[], any, string]> {
  // Get all categories to build taxonomy
  const allCategories = await prisma.category.findMany();
  
  // Build category tree for context
  const categoryTree = allCategories.reduce((tree, cat) => {
    if (!tree[cat.category]) {
      tree[cat.category] = {};
    }
    if (!tree[cat.category][cat.subcategory]) {
      tree[cat.category][cat.subcategory] = [];
    }
    tree[cat.category][cat.subcategory].push(cat.insightSubject);
    return tree;
  }, {} as Record<string, Record<string, string[]>>);

  // Convert tree to string representation
  const categoryTreeStr = Object.entries(categoryTree)
    .map(([category, subcategories]) => {
      return `${category}:\n${Object.entries(subcategories)
        .map(([subcategory, subjects]) => {
          return `  ${subcategory}:\n${subjects
            .map(subject => `    - ${subject}`)
            .join('\n')}`;
        })
        .join('\n')}`;
    })
    .join('\n');

  const categoryInsights = await prisma.insight.findMany({
    where: {
      categoryId: category.id,
      source: InsightSource.ANSWER,
    },
    select: {
      id: true, // We only need the IDs of these insights.
    },
  });
  const insightIdsInCategory = categoryInsights.map(ci => ci.id);
  const existingQuestionsRaw = await prisma.question.findMany({
    where: {
      inspirationId: {
        in: insightIdsInCategory,
      },
    },
    select: {
      questionText: true, // Select only the questionText.
    },
  });
  const questions = existingQuestionsRaw.map(q => ({ text: q.questionText }));

  const sampleQuestions = pickSampleQuestions(18);
  const preferBinaryPrompt = preferBinary ? "" : `
  If an insight could have parallel interesting insights, then prefer a single choice or multiple choice based answer instead of a binary statement.
  `;

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers.  We need to generate the fun questions to answer that can explore a potential insight 

You must generate a great question to facilitate finding out if a particular insight is true of a user.  There will always be a skip option so if no choice is suitable, then you don't need to include a vague alternative, only include decisive alternatives.  Any option presented should produce a usable insight about the person answering the question.  Do not generate a "None of these" option if the other options aren't completely exhaustive, as it would not be able to have an insight.

The allowed question types are:
- BINARY: ${TYPE_DESCRIPTIONS[QuestionType.BINARY]}
- SINGLE_CHOICE: ${TYPE_DESCRIPTIONS[QuestionType.SINGLE_CHOICE]}
- MULTIPLE_CHOICE: ${TYPE_DESCRIPTIONS[QuestionType.MULTIPLE_CHOICE]}
${preferBinaryPrompt}

When making a binary statement, do not include the details in the answer, simply make the statement the user can agree or disagree with.  Make sure any question does not actually contain a chain of dependent questions.  Don't make new questions that are too similar to existing questions.  If the question has a huge number of possible answers, try to emphasize diversity in selecting possible answers.

Focus on generating a question that is specifically relevant to the target category and won't overlap with questions that would be better suited for other categories in the taxonomy.

Here is the complete insight taxonomy to help you understand the scope and avoid overlap:
${categoryTreeStr}

The classification for the target insight is:
Category: ${category.category}	
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

The insight to query is:
${insight.insightText}

The existing questions for this category are:
${questions.map(question => question.text).join('\n')}

Output JSON only.  Each genreated answer MUST have a corresponding insight.  The arrays of answers and insights must be the same length.  Follow this format and use the examples to guide how to choose tone and style:
${sampleQuestions}

If you can't generate a unique question, then output:
{"question":"","answers":[], "insights":[], "type":"DUPLICATE"}
`;

  const model = LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
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
            enum: ["BINARY", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "DUPLICATE"]
          }
        },
        required: ["question", "answers", "insights", "type"],
        additionalProperties: false
      }
    }
  };

  return [messages, format, model];
}

/**
 * Generates a question for a given insight and style
 * @param insight The insight to generate a question for
 * @param preferBinary Whether to prefer binary questions
 * @returns Tuple containing the created question object, array of answers, array of insights, and token usage statistics
 */
export async function generateBaseQuestion(
  insight: Insight,
  preferBinary: boolean
): Promise<[Question, Answer[], Insight[], OpenAI.Completions.CompletionUsage] | null> {
  const category = await prisma.category.findUnique({
    where: { id: insight.categoryId }
  });

  if (!category) {
    throw new Error(`Category not found for insight ${insight.id}`);
  }

  const [messages, format, model] = await buildQuestionGenerationPrompt(insight, category, preferBinary);

  // Try to fetch from cache first
  const cachedCompletion = await fetchCachedExecution(model, messages, format);
  const completion = cachedCompletion || await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  return await processQuestionCompletion(
    completion,
    cachedCompletion,
    model,
    messages,
    format,
    category,
    insight.id, // inspirationId
    true // shouldDeleteExisting
  );
}


/**
 * Reduces redundancy in inspiration insights for a given category by identifying and removing duplicate insights
 * @param category The category to reduce redundancy in
 * @returns Tuple containing array of deleted insight objects and token usage statistics
 */
export async function reduceRedundancyForInspirations(
  category: Category
): Promise<[Insight[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all inspiration insights for this category
  const insights = await prisma.insight.findMany({
    where: {
      categoryId: category.id,
      source: InsightSource.INSPIRATION,
    },
    include: {
      question: {
        include: {
          answers: {
            include: {
              insight: true,
            }
          }
        }
      }
    }, // Include question to check if insight already has one
  });

  if (insights.length <= 1) {
    return [[], NO_TOKEN_USAGE];
  }

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to identify and remove redundant inspiration insights that essentially convey the same information.

Category Classification:
Category: ${category.category}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

Here are all the inspiration insights for this category:
${insights.map(insight => insight.insightText).join('\n')}

Please analyze these insights and group together those that are equivalent (i.e., they convey essentially the same information or meaning). For each group, the first insight in the list should be the clearest or most preferred representation. Don't output single insights, only groups of 2 or more. Each insight can only appear in one group.  Output JSON only. Format:

{"equivalentInsightGroups": [["I love Italian food", "I enjoy pasta dishes", "Italian cuisine is my favorite"], ["I dislike sports", "I'm not a sports fan"]]}`;

  const model = HIGH_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "equivalent_inspiration_insights",
      schema: {
        type: "object",
        properties: {
          equivalentInsightGroups: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "string",
                enum: insights.map(insight => insight.insightText)
              }
            }
          }
        },
        required: ["equivalentInsightGroups"],
        additionalProperties: false
      }
    }
  };

  // Skip cache as requested
  const completion = await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  try {
    const redundancyData = (completion.choices[0].message as any).parsed as {
      equivalentInsightGroups: string[][];
    };
    if (!redundancyData || !redundancyData.equivalentInsightGroups) {
      console.error("Parse error or no equivalentInsightGroups in response:", redundancyData);
      throw new Error("Parse error or malformed response for equivalent insights");
    }

    const insightsMap = new Map(insights.map(i => [i.insightText, i]));
    const deletedInsights: Insight[] = [];

    // Wrap in a transaction
    await prisma.$transaction(async (tx) => {
      for (const rawGroup of redundancyData.equivalentInsightGroups) {
        if (rawGroup.length < 2) {
          continue; // No redundancy in this group
        }

        const allInGroup = rawGroup.map(insightText => insightsMap.get(insightText));
        const existing = allInGroup.filter(insight => insight.question?.publishedId)
        const proposed = allInGroup.filter(insight => insight.question?.proposedQuestion)
        const generated  = allInGroup.filter(insight => !insight.question?.publishedId && !insight.question?.proposedQuestion)
        const groupInsights = existing.concat(proposed).concat(generated)


        if (groupInsights.length < 2) {
          console.warn(`Not enough valid insights found for group in category ${category.id}. Skipping group.`);
          continue;
        }

        // Separate insights with and without questions
        const insightsWithQuestions = groupInsights.filter(insight => insight.question);
        const insightsWithoutQuestions = groupInsights.filter(insight => !insight.question);

        let insightsToDelete: (typeof insights)[0][] = [];

        if (insightsWithQuestions.length > 0) {
          insightsToDelete = insightsWithoutQuestions;
          if (insightsWithQuestions.length > 1) {
            var questionsToDelete = insightsWithQuestions.filter(insight => !insight.question.publishedId);
            if (questionsToDelete.length == insightsWithQuestions.length) {
              questionsToDelete = insightsWithQuestions.slice(1);
            }
            insightsToDelete = insightsToDelete.concat(questionsToDelete);
            for (const insight of insightsToDelete) {
              if (!insight.question) {
                continue
              }
              await deleteQuestionWithCascade(tx, insight.question);
            }
          }
        } else {
          insightsToDelete = insightsWithoutQuestions;
        }

        // Delete the identified redundant insights 
        for (const redundantInsight of insightsToDelete) {
          await tx.insight.delete({
            where: { id: redundantInsight.id }
          });
          deletedInsights.push(redundantInsight);
        }
      }
    });

    return [deletedInsights, completion.usage];

  } catch (error) {
    console.error('Error reducing redundancy:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Reduces redundancy in ANSWER insights for a given category by identifying and merging equivalent insights.
 * It identifies groups of equivalent insights considering their question context, keeps the clearest one,
 * relinks Answer records from redundant insights to the primary one, and then deletes the redundant insights.
 * @param category The category to reduce redundancy in
 * @returns Tuple containing array of deleted insight IDs and token usage statistics
 */
export async function reduceRedundancyForAnswers(
  category: Category
): Promise<[{oldInsight: Insight, newInsight: Insight}[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all ANSWER insights for this category with their associated questions and answers
  const insights = await prisma.insight.findMany({
    where: {
      categoryId: category.id,
      source: InsightSource.ANSWER,
    },
    include: {
      answers: {
        include: {
          question: true,
        }
      }
    }
  });

  if (insights.length <= 1) {
    return [[], NO_TOKEN_USAGE];
  }

  // Build insight-question context pairs for the AI
  const insightContexts = insights.map(insight => {
    const answer = insight.answers?.[0]; // Get the first (should be only) answer
    const question = answer?.question;
    return {
      insight: insight.insightText,
      question: question?.questionText || 'No question context',
      answer: answer?.answerText || 'No answer context'
    };
  });

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to identify and merge equivalent insights within a category that essentially convey the same information, but ONLY when they make sense within the context of their related questions.

Category Classification:
Category: ${category.category}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

Here are all the ANSWER insights for this category with their question context:
${insightContexts.map((ctx) => JSON.stringify(ctx)).join('\n')}

Please analyze these insights considering their question context and group together only those that are truly equivalent. For each group, the first insight in the list should be the clearest or most preferred representation. Don't output single insights, only groups of 2 or more. Each insight can only appear in one group. 

Only group insights as equivalent if they truly convey the same information AND it makes sense within the context of their related questions. Different questions may lead to similar-sounding insights that are actually distinct in meaning. For example:
- "I enjoy spicy food" from a cuisine preference question vs "I like spicy challenges" from a personality question should NOT be grouped
- "I prefer dogs" from a pet preference question vs "I prefer dogs over cats" from an animal preference question SHOULD be grouped if they convey the same preference

If a question has multiple answers that are subtlely different, be careful to only group ones together that are very close in meaning, e.g. the difference would not affect the user's compatibility with another user.

When ordering the insights in a group, list the more general insights first, then the more specific ones.

Output JSON only. Format:

{"equivalentInsightGroups": [["I love Italian food", "I enjoy pasta dishes", "Italian cuisine is my favorite"], ["I dislike sports", "I'm not a sports fan"]]}`;

  const model = HIGH_MODEL; // Using o3 as it's good for classification and structuring
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "equivalent_answer_insights",
      schema: {
        type: "object",
        properties: {
          equivalentInsightGroups: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "string",
                // Ensure the LLM only outputs insights that actually exist in this category
                enum: insights.map(insight => insight.insightText)
              },
            }
          }
        },
        required: ["equivalentInsightGroups"],
        additionalProperties: false
      }
    }
  };

  // Skip cache as this process should always use the latest set of insights
  const completion = await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  try {
    const redundancyData = (completion.choices[0].message as any).parsed as {
      equivalentInsightGroups: string[][];
    };
    if (!redundancyData || !redundancyData.equivalentInsightGroups) {
      console.error("Parse error or no equivalentInsightGroups in response:", redundancyData);
      throw new Error("Parse error or malformed response for equivalent insights");
    }

    const insightsMap = new Map(insights.map(i => [i.insightText, i]));
    const mergedInsights: {oldInsight: Insight, newInsight: Insight}[] = [];

    //wrap in a transaction
    await prisma.$transaction(async (tx) => {
      for (const rawGroup of redundancyData.equivalentInsightGroups) {
        if (rawGroup.length < 2) { // If only one insight in a group, nothing to merge
          continue;
        }

        const allInGroup = rawGroup.map(insightText => insightsMap.get(insightText));
        const existing = allInGroup.filter(insight => insight.publishedTag)
        const generated = allInGroup.filter(insight => !insight.publishedTag)
        const group = existing.concat(generated)

        const primaryInsight = group[0]

        if (!primaryInsight) {
          console.warn(`Primary insight text "${primaryInsight.insightText}" not found in category ${category.id}. Skipping group.`);
          continue;
        }

        const existingComparisons = await tx.insightComparison.findMany({
          where: {
            OR: [{ insightAId: primaryInsight.id }, { insightBId: primaryInsight.id }],
          },
          select: {
            insightAId: true,
            insightBId: true
          }
        })
        .then(comparisons => 
          comparisons.map(comp => 
            comp.insightAId === primaryInsight.id ? comp.insightBId : comp.insightAId
          )
        );
        

        for (let i = 1; i < group.length; i++) {
          const redundantInsight = group[i];

          if (!redundantInsight) {
            console.warn(`Redundant insight text "${redundantInsight.insightText}" not found in category ${category.id}. Skipping.`);
            continue;
          }

          if (redundantInsight.id === primaryInsight.id) {
            console.warn(`Primary and redundant insight are the same for text "${primaryInsight.insightText}". Skipping merge for this item.`);
            continue;
          }

          if (redundantInsight.publishedTag) {
            console.warn(`Redundant insight text "${redundantInsight.insightText}" is published. Skipping merge for this item.`);
            continue;
          }

          // Relink Answer records
          await tx.answer.updateMany({
            where: { insightId: redundantInsight.id },
            data: { insightId: primaryInsight.id },
          });

          // Fetch all InsightComparison records involving the redundantInsight
          const comparisonsToRelink = await tx.insightComparison.findMany({
            where: {
              OR: [
                { insightAId: redundantInsight.id },
                { insightBId: redundantInsight.id },
              ],
            },
          });

          for (const comp of comparisonsToRelink) {
            const originalCompId = comp.id;
            let newAId = comp.insightAId;
            let newBId = comp.insightBId;

            if (comp.insightAId === redundantInsight.id) {
              newAId = primaryInsight.id;
            }
            if (comp.insightBId === redundantInsight.id) { 
              newBId = primaryInsight.id;
            }
            [newAId, newBId] = [Math.min(newAId, newBId), Math.max(newAId, newBId)];

            const newId = newAId === primaryInsight.id ? newBId : newAId;

            if (existingComparisons.includes(newId)) {
              // If the new id is already in the existing comparisons, we need to delete the comparison
              await tx.insightComparisonPresentation.deleteMany({ where: { insightComparisonId: originalCompId } });
              await tx.insightComparison.delete({ where: { id: originalCompId } });
              continue;
            }

            try {
              await tx.insightComparison.update({
                where: { id: originalCompId },
                data: { insightAId: newAId, insightBId: newBId },
              });
            } catch (e) {
                console.error(`Error updating InsightComparison (ID: ${originalCompId}) from (A:${comp.insightAId}, B:${comp.insightBId}) to (A:${newAId}, B:${newBId}):`, e);
            }
          }

          // Delete the redundant insight
          await tx.insight.delete({
            where: { id: redundantInsight.id },
          });
          mergedInsights.push({oldInsight: redundantInsight, newInsight: primaryInsight});
        }
      }
    });

    return [mergedInsights, completion.usage];

  } catch (error) {
    console.error(`Error reducing redundancy for ANSWER insights in category ${category.insightSubject}:`, error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Generates category overlaps by ranking all potential relationships for a given category
 * @param category The category to find overlaps for
 * @returns Tuple containing array of created CategoryOverlap objects and token usage statistics
 */
export async function generateCategoryOverlapByRanking(
  category: Category
): Promise<[CategoryOverlap[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all categories
  const allCategories = await prisma.category.findMany();

  if (allCategories.length === 0) {
    return [[], NO_TOKEN_USAGE];
  }

  // Get all valid insight subjects for validation
  const validSubjects = allCategories.map(cat => cat.insightSubject);

  // Build category tree for context
  const categoryTree = allCategories.reduce((tree, cat) => {
    if (!tree[cat.category]) {
      tree[cat.category] = {};
    }
    if (!tree[cat.category][cat.subcategory]) {
      tree[cat.category][cat.subcategory] = [];
    }
    tree[cat.category][cat.subcategory].push(cat.insightSubject);
    return tree;
  }, {} as Record<string, Record<string, string[]>>);

  // Convert tree to string representation
  const categoryTreeStr = Object.entries(categoryTree)
    .map(([category, subcategories]) => {
      return `${category}:\n${Object.entries(subcategories)
        .map(([subcategory, subjects]) => {
          return `  ${subcategory}:\n${subjects
            .map(subject => `    - ${subject}`)
            .join('\n')}`;
        })
        .join('\n')}`;
    })
    .join('\n');

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to determine which categories of insights might have overlapping or related insights that could imply compatibility between users.

Here are all categories in the system:
${categoryTreeStr}

Please analyze the target category and identify which other categories have STRONG relationships that could imply compatibility or incompatibility between users. Output them in descending order of importance. Make sure to generate the most important possible insights as trivial things are not helpful for matching.  Consider:
- Will insights from these categories help as ice breakers if users knew each others' answers?
- Do they imply compatibility for casual daily life?
- Do they imply compatibility for long term plans?
- Do they imply users can have a lot of fun together?
- Would they help on a first date?
- Would knowing each others' answers help users understand each other better?

Output JSON only. Format:
{"strongSubjects": ["Dietary preferences", "Travel style", "Music taste"]}

Target Category:
Category: ${category.category}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}
`;

  const model = HIGH_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "ranked_categories",
      schema: {
        type: "object",
        properties: {
          strongSubjects: {
            type: "array",
            items: {
              type: "string",
              enum: validSubjects
            }
          }
        },
        required: ["strongSubjects"],
        additionalProperties: false
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

  try {
    const rankingData = (completion.choices[0].message as any).parsed as {
      strongSubjects: string[];
    };
    if (!rankingData) {
      throw new Error("Parse error");
    }

    const overlaps: CategoryOverlap[] = [];

    const allStrongSubjects = Array.from(
      new Set([category.insightSubject, ...rankingData.strongSubjects])
    );

    for (const subject of allStrongSubjects) {
      const relatedCategory = allCategories.find(cat => cat.insightSubject === subject);
      if (!relatedCategory) {
        throw new Error(`Category not found for subject: ${subject}`);
      }

      // Ensure categoryAId is always the smaller ID for consistency
      const [categoryAId, categoryBId] = category.id < relatedCategory.id
        ? [category.id, relatedCategory.id]
        : [relatedCategory.id, category.id];

      const overlap = await prisma.categoryOverlap.upsert({
        where: {
          categoryAId_categoryBId: {
            categoryAId,
            categoryBId,
          },
        },
        update: {
          overlap: "STRONG",
        },
        create: {
          categoryAId,
          categoryBId,
          overlap: "STRONG",
        },
      });
      overlaps.push(overlap);
    }

    // Create WEAK entries for categories not in the ranked list
    const rankedCategoryIds = new Set(allStrongSubjects.map(subject =>
      subject === category.insightSubject
        ? category.id
        : allCategories.find(cat => cat.insightSubject === subject)?.id
    ));

    for (const otherCategory of allCategories) {
      if (!rankedCategoryIds.has(otherCategory.id)) {
        const [categoryAId, categoryBId] = category.id < otherCategory.id
          ? [category.id, otherCategory.id]
          : [otherCategory.id, category.id];

        const overlap = await prisma.categoryOverlap.upsert({
          where: {
            categoryAId_categoryBId: {
              categoryAId,
              categoryBId,
            },
          },
          update: {
            overlap: "WEAK",
          },
          create: {
            categoryAId,
            categoryBId,
            overlap: "WEAK",
          },
        });
        overlaps.push(overlap);
      }
    }

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [overlaps, completion.usage];
  } catch (error) {
    console.error('Error creating category overlaps:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Determines which categories are most relevant for a given insight based on existing category overlaps
 * @param insight The insight to find relevant categories for
 * @returns Tuple containing array of relevant categories and token usage statistics
 */
export async function generateInsightCategoryOverlap(
  insight: Insight,
): Promise<[Category[], Category[], OpenAI.Completions.CompletionUsage] | null> {
  // Get the insight's category
  const insightCategory = await prisma.category.findUnique({
    where: { id: insight.categoryId }
  });

  if (!insightCategory) {
    throw new Error(`Category not found for insight ${insight.id}`);
  }

  // Get all categories that have overlaps with the insight's category
  const categoryOverlaps = await prisma.categoryOverlap.findMany({
    where: {
      AND: [
        { overlap: "STRONG" },
        {
          OR: [
            { categoryAId: insightCategory.id },
            { categoryBId: insightCategory.id },
          ]
        }
      ]
    },
    include: {
      categoryA: true,
      categoryB: true
    }
  });

  // Extract unique categories from overlaps
  const relatedCategories = new Set<Category>();
  relatedCategories.add(insightCategory);
  for (const overlap of categoryOverlaps) {
    if (overlap.categoryA.id !== insightCategory.id) {
      relatedCategories.add(overlap.categoryA);
    }
    if (overlap.categoryB.id !== insightCategory.id) {
      relatedCategories.add(overlap.categoryB);
    }
  }


  if (relatedCategories.size === 0) {
    throw Error(`No base related categories found for insight ${insight.id}`);
  }

  // Build category tree for context
  const categoryTree = Array.from(relatedCategories).reduce((tree, cat) => {
    if (!tree[cat.category]) {
      tree[cat.category] = {};
    }
    if (!tree[cat.category][cat.subcategory]) {
      tree[cat.category][cat.subcategory] = [];
    }
    tree[cat.category][cat.subcategory].push(cat.insightSubject);
    return tree;
  }, {} as Record<string, Record<string, string[]>>);

  // Convert tree to string representation
  const categoryTreeStr = Object.entries(categoryTree)
    .map(([category, subcategories]) => {
      return `${category}:\n${Object.entries(subcategories)
        .map(([subcategory, subjects]) => {
          return `  ${subcategory}:\n${subjects
            .map(subject => `    - ${subject}`)
            .join('\n')}`;
        })
        .join('\n')}`;
    })
    .join('\n');

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to determine which categories likely contain insights that overlap most with a specific insight.

Here are the categories that have been identified as having potential relationships with this specific insight:
${categoryTreeStr}

Please analyze the target insight and identify which of these categories are most to have insights which interact with the insight specified. Consider how insights from one of these catergories might interact with the insight specified:
- Would the insights help as ice breakers if users knew each others' answers?
- Do they imply compatibility for casual daily life?
- Do they imply compatibility for long term plans?
- Do they imply users can have a lot of fun together?
- Would they help on a first date?
- Would knowing each others' answers help users understand each other better?

Output JSON only. Each subject must be unique. Format:
{"relevantSubjects": ["Dietary preferences", "Travel style", "Music taste"]}

Target Insight:
"${insight.insightText}"

Target Category:
Category: ${insightCategory.category}
Subcategory: ${insightCategory.subcategory}
Subject: ${insightCategory.insightSubject}
`;

  const model = LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "relevant_categories",
      schema: {
        type: "object",
        properties: {
          relevantSubjects: {
            type: "array",
            items: {
              type: "string",
              enum: Array.from(relatedCategories).map(cat => cat.insightSubject)
            }
          }
        },
        required: ["relevantSubjects"],
        additionalProperties: false
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

  try {
    const rankingData = (completion.choices[0].message as any).parsed as {
      relevantSubjects: string[];
    };
    if (!rankingData) {
      throw new Error("Parse error");
    }

    const uniqueRelevantSubjects = Array.from(new Set(rankingData.relevantSubjects));

    const relevantCategories = Array.from(relatedCategories).filter(cat =>
      uniqueRelevantSubjects.includes(cat.insightSubject) || cat.insightSubject === insightCategory.insightSubject
    );

    const removedCategories = Array.from(relatedCategories).filter(cat =>
      !relevantCategories.includes(cat)
    );

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [relevantCategories, removedCategories, completion.usage];
  } catch (error) {
    console.error('Error determining relevant categories:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

const NO_TOKEN_USAGE = { prompt_tokens: 0, completion_tokens: 0, prompt_tokens_details: { cached_tokens: 0 } } as OpenAI.Completions.CompletionUsage;

/**
 * Helper function to process question generation completion and create database records
 * @param completion The OpenAI completion response
 * @param cachedCompletion Whether this was a cached completion
 * @param model The model used for the completion
 * @param messages The messages sent to the model
 * @param format The JSON schema format used
 * @param category The category for the question
 * @param inspirationId The inspiration insight ID (can be null for proposal-based questions)
 * @param shouldDeleteExisting Whether to delete existing questions for this inspiration
 * @param proposedQuestionText Optional proposed question text for creating temporary inspiration
 * @returns Tuple containing the created question object, array of answers, array of insights, and token usage statistics
 */
async function processQuestionCompletion(
  completion: OpenAI.Chat.ChatCompletion,
  cachedCompletion: OpenAI.Chat.ChatCompletion | null,
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  format: any,
  category: Category,
  inspirationId: number | null,
  shouldDeleteExisting: boolean,
  proposedQuestionText?: string
): Promise<[Question, Answer[], Insight[], OpenAI.Completions.CompletionUsage] | null> {
  if ((completion.choices[0].message as any).parsed.type == "DUPLICATE") {
    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }
    return [null, null, null, completion.usage];
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
    if (questionData.answers.length != questionData.insights.length) {
      throw new Error("Answers and insights length mismatch");
    }

    if (proposedQuestionText) {
      if (inspirationId) {
        throw new Error("Proposal-based question already has an inspiration");
      }
      if (questionData.insights.length == 0) {
        throw new Error("Proposal-based question must have a generatedinsight");
      }
    } else {
      if (!inspirationId) {
        throw new Error("Base questions must have come from an inspiration");
      }
    }

    // Use a transaction to ensure atomic creation of question, insights, and answers
    const [question, answers, newInsights] = await prisma.$transaction(async (tx) => {
      let actualInspirationId = inspirationId;

      // Create inspiration insight from first answer's insight if needed (for proposal-based questions)
      if (proposedQuestionText) {
        const inspirationInsight = await tx.insight.create({
          data: {
            insightText: fixIllegalEnumCharacters(questionData.insights[0]),
            categoryId: category.id,
            source: InsightSource.INSPIRATION,
          },
        });
        actualInspirationId = inspirationInsight.id;
      }

      // Delete existing questions if needed
      if (shouldDeleteExisting && actualInspirationId) {
        await tx.question.deleteMany({
          where: {
            inspirationId: actualInspirationId,
          },
        });
      }

      // Generate persistent ID based on question type
      const persistentIdPrefix = proposedQuestionText ? 'PQ' : 'GQ';
      const persistentId = await generateUniquePersistentId(persistentIdPrefix, tx);

      // Create the question
      const question = await tx.question.create({
        data: {
          questionText: fixIllegalEnumCharacters(questionData.question),
          questionType: questionData.type as QuestionType,
          inspirationId: actualInspirationId!,
          categoryId: category.id,
          persistentId: persistentId,
          proposedQuestion: proposedQuestionText || null, // Store the original proposed question text
        },
      });

      const answers: Answer[] = [];
      const newInsights: Insight[] = [];

      for (let i = 0; i < questionData.answers.length; i++) {
        // Create new insight for each answer
        const newInsight = await tx.insight.create({
          data: {
            insightText: fixIllegalEnumCharacters(questionData.insights[i]),
            categoryId: category.id,
            source: InsightSource.ANSWER,
          },
        });
        newInsights.push(newInsight);

        // Create answer linking question to insight
        const answer = await tx.answer.create({
          data: {
            answerText: questionData.answers[i],
            questionId: question.id,
            insightId: newInsight.id,
          },
        });
        answers.push(answer);
      }

      return [question, answers, newInsights];
    });

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [question, answers, newInsights, completion.usage];
  } catch (error) {
    console.error('Error creating question:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}
/**
 * Generates insight comparisons between a target insight and a list of insights using batch ranking
 * @param insight The target insight to compare against
 * @param insightsToCompare Array of insights to compare with the target insight
 * @returns Tuple containing array of created InsightComparison objects and token usage statistics
 */
export async function generateInsightBatchComparisonByRanking(
  insight: Insight,
  insightsToCompare: Insight[]
): Promise<[InsightComparison[], OpenAI.Completions.CompletionUsage] | null> {
  if (insightsToCompare.length === 0) {
    return [[], NO_TOKEN_USAGE]
  }

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to determine how a specific insight relates to other insights.

  You are provided a list of insights to compare against a single target insight. Your job is to compare each one with the single target insight. For each of the insights, you need to determine if that would indicate compatibility or incompatibility with the target insight. You will output a list of insights that are compatible and one list of insights that are incompatible. Only include ones where the relationship is strong, e.g. it would strongly impact the compatibility of the two users or be fun and sensible ice breaker. List the most important one first.

  Output JSON only. Format:
  {"compatible": ["I love Italian food", "Pizza is my favorite food"], "incompatible": ["I'm a vegetarian"]}

  Insights to Compare Against:
  ${insightsToCompare.map((compareInsight) => `"${compareInsight.insightText}"`).join('\n')}

  Target Insight:
  "${insight.insightText}"
  `;

  const model = LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "insight_comparisons",
      schema: {
        type: "object",
        properties: {
          compatible: {
            type: "array",
            items: {
              type: "string",
              enum: insightsToCompare.map(insight => insight.insightText)
            }
          },
          incompatible: {
            type: "array",
            items: {
              type: "string",
              enum: insightsToCompare.map(insight => insight.insightText)
            }
          }
        },
        required: ["compatible", "incompatible"],
        additionalProperties: false
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

  try {
    const comparisonData = (completion.choices[0].message as any).parsed as {
      compatible: string[];
      incompatible: string[];
    };
    if (!comparisonData) {
      throw new Error("Parse error");
    }

    // There are a few cases where the original 1-1 comparison determined a WEAK relationship, but most cases are STRONG
    // None were determined as WEAK, an only one was considered neutral while all other insights that match are positive
    // TODO: check that the end result of this ranked mode acheives similar results to the 1-1 comparison

    const comparisons: InsightComparison[] = [];
    const strongCompatible = new Set(comparisonData.compatible);
    const strongIncompatible = new Set(comparisonData.incompatible);

    for (const compareInsight of insightsToCompare) {
      let polarity: PolarityType = null;
      if (strongCompatible.has(compareInsight.insightText)) polarity = "POSITIVE";
      else if (strongIncompatible.has(compareInsight.insightText)) polarity = "NEGATIVE";

      if (!polarity) {
        const comparison = await prisma.insightComparison.upsert({
          where: {
            insightAId_insightBId: {
              insightAId: Math.min(insight.id, compareInsight.id),
              insightBId: Math.max(insight.id, compareInsight.id),
            },
          },
          update: {
            polarity: "NEUTRAL",
            overlap: "WEAK",
          },
          create: {
            insightA: { connect: { id: Math.min(insight.id, compareInsight.id) } },
            insightB: { connect: { id: Math.max(insight.id, compareInsight.id) } },
            polarity: "NEUTRAL",
            overlap: "WEAK",
          },
        });
        comparisons.push(comparison);
        await prisma.insightComparisonPresentation.deleteMany({
          where: {
            insightComparisonId: comparison.id,
          }
        });

        continue;
      }

      let overlap: OverlapType = "STRONG";

      const insightAId = Math.min(insight.id, compareInsight.id);
      const insightBId = Math.max(insight.id, compareInsight.id);

      const comparison = await prisma.insightComparison.upsert({
        where: {
          insightAId_insightBId: {
            insightAId,
            insightBId,
          },
        },
        update: {
          polarity,
          overlap,
        },
        create: {
          insightA: { connect: { id: insightAId } },
          insightB: { connect: { id: insightBId } },
          polarity,
          overlap,
        },
      });
      comparisons.push(comparison);
    }

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [comparisons, completion.usage];
  } catch (error) {
    console.error('Error creating insight comparisons:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Generates insight comparisons between a target insight and all insights in a given category
 * @param insight The target insight to compare against
 * @param category The category containing insights to compare with
 * @returns Tuple containing array of created InsightComparison objects and token usage statistics
 */
export async function generateInsightCategoryComparisonByRanking(
  insight: Insight,
  category: Category
): Promise<[InsightComparison[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all insights from the specified category
  const categoryInsights = await prisma.insight.findMany({
    where: {
      categoryId: category.id,
      source: InsightSource.ANSWER,
    },
  });

  return await generateInsightBatchComparisonByRanking(insight, categoryInsights);
}

/**
 * Generates insight comparisons between a target insight and all answer insights from a specific question
 * @param insight The target insight to compare against
 * @param question The question containing answer insights to compare with
 * @returns Tuple containing array of created InsightComparison objects and token usage statistics
 */
export async function generateInsightQuestionComparisonByRanking(
  insight: Insight,
  question: Question
): Promise<[InsightComparison[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all answer insights from the specified question
  const questionAnswers = await prisma.answer.findMany({
    where: {
      questionId: question.id,
    },
    include: {
      insight: true,
    },
  });

  const questionInsights = questionAnswers.map(answer => answer.insight);
  return await generateInsightBatchComparisonByRanking(insight, questionInsights);
}

/**
 * Generates or updates the presentation details (title, concise versions) for a given InsightComparison.
 * This function assumes the InsightComparison's overlap is STRONG for active presentation generation.
 * If the overlap is not STRONG, any existing presentation will be removed, and no new one will be generated.
 * @param insightComparisonToPresent The InsightComparison record for which to generate presentation details. Its 'overlap' field determines behavior.
 * @returns Tuple containing the created/updated InsightComparisonPresentation object and token usage statistics if presentation is generated, otherwise null.
 */
export async function generateInsightComparisonPresentation(
  insightComparisonToPresent: InsightComparison
): Promise<[InsightComparisonPresentation, OpenAI.Completions.CompletionUsage] | null> {
  // Fetch the actual insight objects to get their text for the prompt
  const insightA = await prisma.insight.findUnique({
    where: { id: insightComparisonToPresent.insightAId },
  });
  const insightB = await prisma.insight.findUnique({
    where: { id: insightComparisonToPresent.insightBId },
  });

  if (!insightA || !insightB) {
    console.error(
      `Could not find one or both insights for InsightComparison ID: ${insightComparisonToPresent.id}`
    );
    return null;
  }

  // If the relationship strength is not STRONG, ensure no presentation record exists and return.
  if (insightComparisonToPresent.overlap !== OverlapType.STRONG) {
    await prisma.insightComparisonPresentation.deleteMany({
      where: {
        insightComparisonId: insightComparisonToPresent.id,
      },
    });
    // console.log(`Presentation not generated for InsightComparison ID: ${insightComparisonToPresent.id} as overlap is not STRONG.`);
    return null; // No presentation generated, no token usage to report for this specific task
  }

  // At this point, overlap is STRONG, so we proceed to generate presentation details.
  const prompt = `We are building a database of information about users of a dating app. For a pair of insights that have a STRONG relationship, we need to generate presentation details.
Provide a title to show as a header describing what links these insights. Also, provide maximally shortened versions of each insight for UI display.
Additionally, rate the importance of this compatibility factor from 1-10, where:
- 10 means it's a deal breaker/maker (e.g., core values, major life goals, fundamental lifestyle choices)
- 5 means it's moderately important but compromise is possible
- 1 means it's a minor preference that's easily adaptable (e.g., food cuisine preferences, minor hobbies)

Output JSON in the following format:
{"title":"Shared Hobby", "concise_insight_A":"Loves hiking", "concise_insight_B":"Enjoys outdoor trails", "importance":7}

User A Insight (corresponds to insightComparison.insightAId):
${insightA.insightText}
User B Insight (corresponds to insightComparison.insightBId):
${insightB.insightText}`;

  const model = ULTRA_LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "insight_presentation_details",
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          concise_insight_A: { type: "string" },
          concise_insight_B: { type: "string" },
          importance: { type: "integer" }
        },
        required: ["title", "concise_insight_A", "concise_insight_B", "importance"],
        additionalProperties: false
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

  try {
    const presentationData = (completion.choices[0].message as any).parsed as {
      title: string;
      concise_insight_A: string;
      concise_insight_B: string;
      importance: number;
    };
    if (!presentationData) {
      throw new Error("Parse error for presentation data");
    }

    // Upsert the InsightComparisonPresentation record
    const newOrUpdatedPresentation = await prisma.insightComparisonPresentation.upsert({
      where: {
        insightComparisonId: insightComparisonToPresent.id,
      },
      update: {
        presentationTitle: presentationData.title,
        conciseAText: presentationData.concise_insight_A,
        conciseBText: presentationData.concise_insight_B,
        importance: presentationData.importance,
      },
      create: {
        insightComparisonId: insightComparisonToPresent.id,
        presentationTitle: presentationData.title,
        conciseAText: presentationData.concise_insight_A,
        conciseBText: presentationData.concise_insight_B,
        importance: presentationData.importance,
      },
    });

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [newOrUpdatedPresentation, completion.usage];

  } catch (error) {
    console.error('Error in generateInsightComparisonPresentation:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Reduces redundancy in ANSWER insights by identifying and merging insights.
 * It identifies groups of insights with identical insightText, keeps one as primary,
 * relinks Answer and InsightComparison records from redundant insights to the primary one,
 * and then deletes the redundant insights. This version does not use AI and operates globally.
 * @returns Array of objects detailing each merge, with oldInsight and newInsight.
 */
export async function reduceExactRedundancyForAnswers(): Promise<{oldInsight: Insight, newInsight: Insight}[]> {
  // 1. Fetch ALL Answer insights (no category filter), ordered by ID to consistently pick a primary.
  const allAnswerInsights = await prisma.insight.findMany({
    where: {
      source: InsightSource.ANSWER,
    },
    orderBy: {
      id: 'asc',
    }
  });

  if (allAnswerInsights.length <= 1) {
    return [];
  }

  // 2. Group insights by insightText
  const insightsByText = new Map<string, Insight[]>();
  for (const insight of allAnswerInsights) {
    if (!insightsByText.has(insight.insightText)) {
      insightsByText.set(insight.insightText, []);
    }
    insightsByText.get(insight.insightText)!.push(insight);
  }

  const mergedInsightsInfo: {oldInsight: Insight, newInsight: Insight}[] = [];

  await prisma.$transaction(async (tx) => {
    for (const [_text, group] of insightsByText) {
      if (group.length < 2) {
        continue; // No redundancy in this group
      }

      // The first insight in the group is the primary (due to orderBy id: 'asc')
      const primaryInsight = group[0];

      // Create a set to track IDs of insights already compared with the current primaryInsight.
      // This set is populated initially and updated as redundant insights in THIS group are processed.
      const peersOfPrimary = new Set<number>();
      const initialPrimaryComparisons = await tx.insightComparison.findMany({
        where: {
          OR: [{ insightAId: primaryInsight.id }, { insightBId: primaryInsight.id }],
        },
        select: { insightAId: true, insightBId: true }
      });
      initialPrimaryComparisons.forEach(comp => {
        peersOfPrimary.add(comp.insightAId === primaryInsight.id ? comp.insightBId : comp.insightAId);
      });

      // Iterate over redundant insights in the current group
      for (let i = 1; i < group.length; i++) {
        const redundantInsight = group[i];

        // Should not happen given unique IDs and group[0] being primary, but as a safeguard:
        if (redundantInsight.id === primaryInsight.id) {
            console.warn(`Primary and redundant insight are the same (ID: ${primaryInsight.id}, Text: "${primaryInsight.insightText}"). Skipping merge for this item.`);
            continue;
        }

        // Relink Answer records from redundantInsight to primaryInsight
        await tx.answer.updateMany({
          where: { insightId: redundantInsight.id },
          data: { insightId: primaryInsight.id },
        });

        // Handle InsightComparison records involving the redundantInsight
        const comparisonsToRelink = await tx.insightComparison.findMany({
          where: {
            OR: [
              { insightAId: redundantInsight.id },
              { insightBId: redundantInsight.id },
            ],
          },
        });

        for (const comp of comparisonsToRelink) {
          const originalCompId = comp.id;
          let otherInsightInOriginalPair: number;

          if (comp.insightAId === redundantInsight.id) {
            otherInsightInOriginalPair = comp.insightBId;
          } else { // comp.insightBId must be redundantInsight.id
            otherInsightInOriginalPair = comp.insightAId;
          }

          // Case 1: Redundant insight was compared with the primary insight itself.
          // After relinking, this would become (primary, primary), which is invalid. So, delete.
          if (otherInsightInOriginalPair === primaryInsight.id) {
            await tx.insightComparisonPresentation.deleteMany({ where: { insightComparisonId: originalCompId } });
            await tx.insightComparison.delete({ where: { id: originalCompId } });
            continue;
          }

          // Case 2: The new pair (primaryInsight, otherInsightInOriginalPair) already exists (i.e., primary is already linked to other).
          // This means the current `comp` (which was (redundant, other)) becomes a duplicate. So, delete.
          if (peersOfPrimary.has(otherInsightInOriginalPair)) {
            await tx.insightComparisonPresentation.deleteMany({ where: { insightComparisonId: originalCompId } });
            await tx.insightComparison.delete({ where: { id: originalCompId } });
            continue;
          }

          // Case 3: This is a potentially new, valid pair: (primaryInsight, otherInsightInOriginalPair).
          // Update the current comparison `comp` to use primaryInsight, ensuring sorted IDs.
          const finalNewAId = Math.min(primaryInsight.id, otherInsightInOriginalPair);
          const finalNewBId = Math.max(primaryInsight.id, otherInsightInOriginalPair);

          try {
            await tx.insightComparison.update({
              where: { id: originalCompId },
              data: { insightAId: finalNewAId, insightBId: finalNewBId },
            });
            // Successfully updated. Add `otherInsightInOriginalPair` to `peersOfPrimary`
            // to correctly handle subsequent redundant insights in THIS group that might also point to it.
            peersOfPrimary.add(otherInsightInOriginalPair);
          } catch (e: any) {
            console.error(`Error updating InsightComparison (ID: ${originalCompId}) from (A:${comp.insightAId}, B:${comp.insightBId}) to (A:${finalNewAId}, B:${finalNewBId}). Redundant ID: ${redundantInsight.id}, Primary ID: ${primaryInsight.id}:`, e);
            throw e; // Rethrow if it's not a unique constraint error we can recover from by deleting.
          }
        }

        // Delete the redundant insight
        await tx.insight.delete({
          where: { id: redundantInsight.id },
        });
        mergedInsightsInfo.push({oldInsight: redundantInsight, newInsight: primaryInsight});
      }
    }
  },
  {
    maxWait: 10000, // default 2000
    timeout: 20000, // default 5000
  }
  ); // End of transaction

  return mergedInsightsInfo;
}

/**
 * Reduces redundancy in questions for a given category by identifying and removing equivalent questions.
 * This involves cleaning up related answers, orphaned answer insights, inspiration insights, and insight comparisons.
 * @param category The category to reduce question redundancy in
 * @param keepIdAndBelow Optional ID threshold - questions with ID equal to orbelow this will be prioritized and never deleted
 * @returns Tuple containing array of objects with details about deleted questions and token usage statistics
 */
export async function reduceRedundancyForQuestions(
  category: Category,
  keepIdAndBelow?: number
): Promise<[{oldQuestion: Question, newQuestion: Question}[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all questions for this category via their inspiration insights
  const inspirationInsights = await prisma.insight.findMany({
    where: {
      categoryId: category.id,
      source: InsightSource.INSPIRATION,
      question: {
        isNot: null,
      },
    },
    include: {
      question: {
        include: {
          answers: {
            include: {
              insight: true,
            }
          }
        }
      }
    },
  });

  if (inspirationInsights.length <= 1) {
    return [[], NO_TOKEN_USAGE];
  }

  const questions = inspirationInsights.map(insight => insight.question);

  // Build question contexts with their answers and insights for more sophisticated analysis
  const questionContexts = questions.map(question => {
    const answers = question.answers || [];
    const answerData = answers.map(answer => ({
      answer: answer.answerText,
      insight: answer.insight?.insightText
    }));
    
    return {
      question: question.questionText,
      answers: answerData,
      inspirationText: inspirationInsights.find(i => i.id === question.inspirationId)?.insightText || 'No inspiration'
    };
  });

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to identify and remove equivalent questions within a category that essentially ask the same thing, but ONLY when they truly serve the same purpose and would generate equivalent insights.

Category Classification:
Category: ${category.category}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

Here are all the questions for this category with their complete context:
${questionContexts.map((ctx) => JSON.stringify(ctx)).join('\n')}

Please analyze these questions considering their complete context - including their answers, generated insights, and inspiration. Group together only those that are truly equivalent and serve the same purpose. For each group, the first question in the list should be the clearest or most preferred representation. Don't output single questions, only groups of 2 or more. Each question can only appear in one group.

Group questions that are highly redundant and would provide multiple equivalent insights.  Consider:
- Do the questions explore the same specific aspect of the category?
- Are the answer options exploring the same dimensions of preference/behavior?
- Are multiple of the answer options going to produce the same insights as other questions?

When ordering questions in a group, list the more general/clearer questions first, then the more specific or awkwardly worded ones.

Output JSON only. Format:

{"equivalentQuestionGroups": [["What's your favorite food?", "Which food do you enjoy most?", "What food do you love eating?"], ["Do you like sports?", "Are you into athletics?"]]}`;

  const model = HIGH_MODEL; // Using o3 for better grouping analysis
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "equivalent_questions",
      schema: {
        type: "object",
        properties: {
          equivalentQuestionGroups: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "string",
                // Ensure the LLM only outputs questions that actually exist in this category
                enum: questions.map(question => question.questionText)
              },
            }
          }
        },
        required: ["equivalentQuestionGroups"],
        additionalProperties: false
      }
    }
  };

  var completion: OpenAI.Chat.ChatCompletion;
  try {
    // Skip cache as this process should always use the latest set of questions
    completion = await openai.beta.chat.completions.parse({
      messages,
      model,
      response_format: format,
    });
  } catch (e) {
    console.log(messages)
    console.log(JSON.stringify(format, null, 2))
    throw e
  }

  try {
    const redundancyData = (completion.choices[0].message as any).parsed as {
      equivalentQuestionGroups: string[][];
    };
    if (!redundancyData || !redundancyData.equivalentQuestionGroups) {
      console.error("Parse error or no equivalentQuestionGroups in response:", redundancyData);
      throw new Error("Parse error or malformed response for equivalent questions");
    }

    const questionsMap = new Map(questions.map(q => [q.questionText, q]));
    const mergedQuestionsInfo: {oldQuestion: Question, newQuestion: Question}[] = [];
    // Wrap in a transaction
    await prisma.$transaction(async (tx) => {
      for (const rawGroup of redundancyData.equivalentQuestionGroups) {
        if (rawGroup.length < 2) { // If only one question in a group, nothing to delete
          continue;
        }

        const allInGroup = rawGroup.map(questionText => questionsMap.get(questionText));
        const existing = allInGroup.filter(question => question.publishedId)
        const allGenerated  = allInGroup.filter(question => !question.publishedId)
        const generatedBefore  = allGenerated.filter(question => keepIdAndBelow === undefined ? false : question.id <= keepIdAndBelow)
        const generatedAfter  = allGenerated.filter(question => keepIdAndBelow === undefined ? true : question.id > keepIdAndBelow)
        const group = existing.concat(generatedBefore).concat(generatedAfter)

        const primaryQuestion = group[0];

        if (!primaryQuestion) {
          console.warn(`Primary question text "${primaryQuestion.questionText}" not found in category ${category.id}. Skipping group.`);
          continue;
        }

        // Delete redundant questions (all except the first one)
        for (let i = 1; i < group.length; i++) {
          const redundantQuestion = group[i];

          if (!redundantQuestion) {
            console.warn(`Redundant question text "${redundantQuestion.questionText}" not found in category ${category.id}. Skipping.`);
            continue;
          }

          if (redundantQuestion.id === primaryQuestion.id) {
            console.warn(`Primary and redundant question are the same for text "${primaryQuestion.questionText}". Skipping deletion for this item.`);
            continue;
          }

          // If keepBelowId is provided, never delete questions below the threshold
          if (keepIdAndBelow !== undefined && redundantQuestion.id <= keepIdAndBelow) {
            console.warn(`Skipping deletion of question ID ${redundantQuestion.id} (below keepBelowId threshold ${keepIdAndBelow})`);
            continue;
          }

          if (redundantQuestion.publishedId) {
            console.warn(`Redundant question text "${redundantQuestion.questionText}" is published. Skipping deletion for this item.`);
            continue;
          }

          // Get the inspiration insight for this question
          const inspirationInsight = inspirationInsights.find(insight => insight.id === redundantQuestion.inspirationId);

          // Delete the question and all its cascading relationships
          await deleteQuestionWithCascade(tx, redundantQuestion);

          // Delete the inspiration insight that generated this question
          if (inspirationInsight) {
            await tx.insight.delete({
              where: { id: inspirationInsight.id },
            });
          }

          mergedQuestionsInfo.push({oldQuestion: redundantQuestion, newQuestion: primaryQuestion});
        }
      }
    },
    {
      maxWait: 10000, // default 2000
      timeout: 20000, // default 5000
    });

    return [mergedQuestionsInfo, completion.usage];

  } catch (error) {
    console.error(`Error reducing redundancy for questions in category ${category.insightSubject}:`, error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Reduces redundancy in INSPIRATION insights by identifying and merging insights with identical text.
 * It identifies groups of insights with identical insightText, keeps one as primary,
 * handles cascading deletion of questions, answers, and orphaned answer insights,
 * and then deletes the redundant insights. This version does not use AI and operates globally.
 * @returns Array of objects detailing each merge, with oldInsight and newInsight.
 */
export async function reduceExactRedundancyForInspirations(): Promise<{oldInsight: Insight, newInsight: Insight}[]> {
  // 1. Fetch ALL Inspiration insights, ordered by ID to consistently pick a primary.
  const allInspirationInsights = await prisma.insight.findMany({
    where: {
      source: InsightSource.INSPIRATION,
    },
    include: {
      question: {
        include: {
          answers: {
            include: {
              insight: true,
            }
          }
        }
      }
    },
    orderBy: {
      id: 'asc',
    }
  });

  if (allInspirationInsights.length <= 1) {
    return [];
  }

  // 2. Group insights by insightText
  const insightsByText = new Map<string, (typeof allInspirationInsights)[0][]>();
  for (const insight of allInspirationInsights) {
    if (!insightsByText.has(insight.insightText)) {
      insightsByText.set(insight.insightText, []);
    }
    insightsByText.get(insight.insightText)!.push(insight);
  }

  const mergedInsightsInfo: {oldInsight: Insight, newInsight: Insight}[] = [];

  await prisma.$transaction(async (tx) => {
    for (const [_text, rawGroup] of insightsByText) {
      if (rawGroup.length < 2) {
        continue; // No redundancy in this group
      }

      const existing = rawGroup.filter(insight => insight.question?.publishedId)
      const proposed = rawGroup.filter(insight => insight.question?.proposedQuestion)
      const generated  = rawGroup.filter(insight => !insight.question?.publishedId && !insight.question?.proposedQuestion)
      const group = existing.concat(proposed).concat(generated)

      // Prioritize insights with questions, then by ID (ascending)
      const insightsWithQuestions = group.filter(insight => insight.question);
      const insightsWithoutQuestions = group.filter(insight => !insight.question);
      
      let primaryInsight: typeof group[0] = group[0];
      let redundantInsights: typeof group = group.slice(1);

      // Iterate over redundant insights in the current group
      for (const redundantInsight of redundantInsights) {
        // Should not happen given unique IDs and selection logic, but as a safeguard:
        if (redundantInsight.id === primaryInsight.id) {
          console.warn(`Primary and redundant insight are the same (ID: ${primaryInsight.id}, Text: "${primaryInsight.insightText}"). Skipping merge for this item.`);
          continue;
        }

        if (redundantInsight.question?.publishedId) {
          console.warn(`Redundant insight text "${redundantInsight.insightText}" is published. Skipping deletion for this item.`);
          continue;
        }

        // If the redundant insight has a question, we need to clean up  the associated data
        if (redundantInsight.question) {
          await deleteQuestionWithCascade(tx, redundantInsight.question);
        }

        // Delete the redundant inspiration insight
        await tx.insight.delete({
          where: { id: redundantInsight.id },
        });
        
        mergedInsightsInfo.push({oldInsight: redundantInsight, newInsight: primaryInsight});
      }
    }
  },
  {
    maxWait: 10000, // default 2000
    timeout: 20000, // default 5000
  }
  ); // End of transaction

  return mergedInsightsInfo;
}



/**
 * Reduces redundancy in questions by identifying and merging questions with identical text.
 * It identifies groups of questions with identical questionText, keeps one as primary,
 * handles cascading deletion of answers and orphaned answer insights,
 * and then deletes the redundant questions. This version does not use AI and operates globally.
 * @returns Array of objects detailing each merge, with oldQuestion and newQuestion.
 */
export async function reduceExactRedundancyForQuestions(): Promise<{oldQuestion: Question, newQuestion: Question}[]> {
  // 1. Fetch ALL questions, ordered by ID to consistently pick a primary.
  const allQuestions = await prisma.question.findMany({
    include: {
      answers: {
        include: {
          insight: true,
        }
      }
    },
    orderBy: {
      id: 'asc',
    }
  });

  if (allQuestions.length <= 1) {
    return [];
  }

  // 2. Group questions by questionText
  const questionsByText = new Map<string, (typeof allQuestions)[0][]>();
  for (const question of allQuestions) {
    if (!questionsByText.has(question.questionText)) {
      questionsByText.set(question.questionText, []);
    }
    questionsByText.get(question.questionText)!.push(question);
  }

  const mergedQuestionsInfo: {oldQuestion: Question, newQuestion: Question}[] = [];

  await prisma.$transaction(async (tx) => {
    for (const [_text, group] of questionsByText) {
      if (group.length < 2) {
        continue; // No redundancy in this group
      }

      // The first question in the group is the primary (due to orderBy id: 'asc')
      const primaryQuestion = group[0];

      // Iterate over redundant questions in the current group
      for (let i = 1; i < group.length; i++) {
        const redundantQuestion = group[i];

        // Should not happen given unique IDs and group[0] being primary, but as a safeguard:
        if (redundantQuestion.id === primaryQuestion.id) {
          console.warn(`Primary and redundant question are the same (ID: ${primaryQuestion.id}, Text: "${primaryQuestion.questionText}"). Skipping merge for this item.`);
          continue;
        }

        // Delete the redundant question and all its cascading relationships
        await deleteQuestionWithCascade(tx, redundantQuestion);

        mergedQuestionsInfo.push({oldQuestion: redundantQuestion, newQuestion: primaryQuestion});
      }
    }
  },
  {
    maxWait: 10000, // default 2000
    timeout: 20000, // default 5000
  }
  ); // End of transaction

  return mergedQuestionsInfo;
}

/**
 * Generates proper insight text from an imported question and answer using AI
 * @param questionText The question that was asked
 * @param answerText The answer that was given
 * @param category The category this insight belongs to
 * @returns Tuple containing the generated insight text and token usage statistics
 */
export async function generateInsightTextFromImportedQuestion(
  questionText: string,
  answerText: string,
  category: Category,
  publishedTag: string | undefined
): Promise<[string, OpenAI.Completions.CompletionUsage] | null> {
  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to generate insight statements based on how someone answered a specific question.

Based on the question and answer provided, generate a proper insight statement that captures what this answer reveals about the person. The statement should be in first person and follow these patterns:
- "I enjoy [activity]" 
- "I prefer [preference]"
- "I value [value]"
- "I want a partner who [characteristic]"
- "I am [trait/characteristic]"
- "I don't [negative preference]"
- "I seek [what they're looking for]"

Make it sound natural and concise. Focus on the underlying preference, value, or characteristic that the answer reveals about them.  Don't extend the insight to say things that are not in the answer.

Output JSON only. Format:
{"insight":"I enjoy outdoor activities and hiking"}

Category Classification:
Category: ${category.category}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

${publishedTag ? `Make the insight concisely focus on this topic: ${publishedTag}\n` : ''}Question: "${questionText}"
Answer: "${answerText}"`;

  const model = LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "insight_generation",
      schema: {
        type: "object",
        properties: {
          insight: {
            type: "string"
          }
        },
        required: ["insight"],
        additionalProperties: false
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

  try {
    const insightData = (completion.choices[0].message as any).parsed as {
      insight: string;
    };
    
    if (!insightData || !insightData.insight) {
      throw new Error("Parse error or empty insight text");
    }

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [insightData.insight, completion.usage];
  } catch (error) {
    console.error('Error generating insight text from imported question:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Predicts the most appropriate category for a proposed question text using AI
 * @param questionText The question text to categorize
 * @returns Tuple containing the predicted category object and token usage statistics
 */
export async function predictQuestionCandidateCategory(
  questionText: string
): Promise<[Category, OpenAI.Completions.CompletionUsage] | null> {
  // Get all existing categories
  const categories = await prisma.category.findMany();
  const allSubjects = []

  // Build category tree
  const categoryTree = categories.reduce((tree, cat) => {
    if (!tree[cat.category]) {
      tree[cat.category] = {};
    }
    if (!tree[cat.category][cat.subcategory]) {
      tree[cat.category][cat.subcategory] = [];
    }
    tree[cat.category][cat.subcategory].push(cat.insightSubject);
    allSubjects.push(cat.insightSubject);
    return tree;
  }, {} as Record<string, Record<string, string[]>>);

  // Convert tree to string representation
  const categoryTreeStr = Object.entries(categoryTree)
    .map(([category, subcategories]) => {
      return `${category}:\n${Object.entries(subcategories)
        .map(([subcategory, subjects]) => {
          return `  ${subcategory}:\n${subjects
            .map(subject => `    - ${subject}`)
            .join('\n')}`;
        })
        .join('\n')}`;
    })
    .join('\n');

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to determine the most appropriate category for a proposed question.

The question to categorize is:
"${questionText}"

Here is the hierarchical category structure:
${categoryTreeStr}

Please select the most appropriate leaf category (insightSubject) for this question. The category should be the most specific and relevant category that captures what this question is trying to discover about the user. Consider what kind of insights this question would generate when answered. Output JSON only. Format:

{"insightSubject":"Dietary preferences"}`;

  const model = LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "category",
      schema: {
        type: "object",
        properties: {
          insightSubject: {
            type: "string",
            enum: allSubjects
          }
        },
        required: ["insightSubject"],
        additionalProperties: false
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

  try {
    const categoryData = (completion.choices[0].message as any).parsed as {
      insightSubject: string;
    };
    if (!categoryData) {
      throw new Error("Parse error");
    }

    // Find the category
    let category = await prisma.category.findFirst({
      where: {
        insightSubject: categoryData.insightSubject,
      },
    });

    if (!category) {
      throw new Error("Unknown subject");
    }

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [category, completion.usage];
  } catch (error) {
    console.error('Error predicting question category:', error);
    console.error('Raw response:', completion.choices[0].message);
    return [null, completion.usage];
  }
}

/**
 * Generates a complete question from a proposed question text and category
 * @param category The category this question belongs to
 * @param proposedQuestionText The proposed question text to reword and improve
 * @param mustBeBinary Whether the question must be binary (true) or can be single/multiple choice (false)
 * @returns Tuple containing the created question object, array of answers, array of insights, and token usage statistics
 */
export async function generateQuestionFromProposal(
  category: Category,
  proposedQuestionText: string,
  mustBeBinary: boolean
): Promise<[Question, Answer[], Insight[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all categories to build taxonomy
  const allCategories = await prisma.category.findMany();
  
  // Build category tree for context
  const categoryTree = allCategories.reduce((tree, cat) => {
    if (!tree[cat.category]) {
      tree[cat.category] = {};
    }
    if (!tree[cat.category][cat.subcategory]) {
      tree[cat.category][cat.subcategory] = [];
    }
    tree[cat.category][cat.subcategory].push(cat.insightSubject);
    return tree;
  }, {} as Record<string, Record<string, string[]>>);

  // Convert tree to string representation
  const categoryTreeStr = Object.entries(categoryTree)
    .map(([category, subcategories]) => {
      return `${category}:\n${Object.entries(subcategories)
        .map(([subcategory, subjects]) => {
          return `  ${subcategory}:\n${subjects
            .map(subject => `    - ${subject}`)
            .join('\n')}`;
        })
        .join('\n')}`;
    })
    .join('\n');

  // Get existing questions for this category
  const existingQuestionsRaw = await prisma.question.findMany({
    where: {
      categoryId: category.id,
    },
    select: {
      questionText: true,
    },
  });
  const questions = existingQuestionsRaw.map(q => ({ text: q.questionText }));

  // Filter sample questions based on the allowed types
  const allowedSampleTypes: Array<'BINARY' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'> = mustBeBinary 
    ? ['BINARY']
    : ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'];
  const sampleQuestions = pickSampleQuestions(18, allowedSampleTypes);
  
  const questionTypePrompt = mustBeBinary 
    ? `You MUST generate a BINARY question type only which is ${TYPE_DESCRIPTIONS[QuestionType.BINARY]}`
    : `You can generate either SINGLE_CHOICE or MULTIPLE_CHOICE question types. Choose the most appropriate:
- SINGLE_CHOICE: ${TYPE_DESCRIPTIONS[QuestionType.SINGLE_CHOICE]}
- MULTIPLE_CHOICE: ${TYPE_DESCRIPTIONS[QuestionType.MULTIPLE_CHOICE]}

If the question could have parallel interesting insights, prefer a single choice or multiple choice based answer instead of a binary statement.`;

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. You are given a proposed question that needs to be reworded and improved to fit our system.

Your task is to:
1. Use the proposed question as an inspiration and write a new question suitable for our question format that targets investigating that topic.  Make it engaging and clear.
2. Generate appropriate answer options
3. Create insights that each answer would reveal about the person

${questionTypePrompt}

Make sure any question does not actually contain a chain of dependent questions. Don't make new questions that are too similar to existing questions. If the question has a huge number of possible answers, try to emphasize diversity in selecting possible answers.

Focus on generating a question that is specifically relevant to the target category and won't overlap with questions that would be better suited for other categories in the taxonomy.

Here is the complete insight taxonomy to help you understand the scope and avoid overlap:
${categoryTreeStr}

The classification for the target category is:
Category: ${category.category}	
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

The proposed question text is:
"${proposedQuestionText}"

The existing questions for this category are:
${questions.map(question => question.text).join('\n')}

Output JSON only. Follow this format and use the examples to guide how to choose tone and style:
${sampleQuestions}

If you can't generate a unique question, then output:
{"question":"","answers":[], "insights":[], "type":"DUPLICATE"}
`;

  const model = LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const allowedTypes = mustBeBinary 
    ? ["BINARY", "DUPLICATE"]
    : ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DUPLICATE"];

  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
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
            enum: allowedTypes
          }
        },
        required: ["question", "answers", "insights", "type"],
        additionalProperties: false
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

  return await processQuestionCompletion(
    completion,
    cachedCompletion,
    model,
    messages,
    format,
    category,
    null, // inspirationId (will be created from proposal)
    false, // shouldDeleteExisting
    proposedQuestionText
  );
}

/**
 * Regenerates an existing imported question to better match sample question style
 * while preserving the exact insights and question type
 * @param question The existing question to regenerate (must include answers with insights)
 * @returns Tuple containing the updated question object and token usage statistics
 */
export async function regenerateImportedQuestion(
  question: Question & {
    answers: (Answer & {
      insight: Insight;
    })[];
  }
): Promise<[Question, OpenAI.Completions.CompletionUsage] | null> {
  const category = await prisma.category.findUnique({
    where: { id: question.categoryId }
  });

  if (!category) {
    throw new Error(`Category not found for question ${question.id}`);
  }

  // Get all categories to build taxonomy
  const allCategories = await prisma.category.findMany();
  
  // Build category tree for context
  const categoryTree = allCategories.reduce((tree, cat) => {
    if (!tree[cat.category]) {
      tree[cat.category] = {};
    }
    if (!tree[cat.category][cat.subcategory]) {
      tree[cat.category][cat.subcategory] = [];
    }
    tree[cat.category][cat.subcategory].push(cat.insightSubject);
    return tree;
  }, {} as Record<string, Record<string, string[]>>);

  // Convert tree to string representation
  const categoryTreeStr = Object.entries(categoryTree)
    .map(([category, subcategories]) => {
      return `${category}:\n${Object.entries(subcategories)
        .map(([subcategory, subjects]) => {
          return `  ${subcategory}:\n${subjects
            .map(subject => `    - ${subject}`)
            .join('\n')}`;
        })
        .join('\n')}`;
    })
    .join('\n');

  // Filter sample questions to only show the same type as the existing question
  const allowedSampleTypes: Array<'BINARY' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'> = [question.questionType as 'BINARY' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'];
  const sampleQuestions = pickSampleQuestions(18, allowedSampleTypes);

  // Build current question context
  const currentAnswersAndInsights = question.answers.map(answer => ({
    answer: answer.answerText,
    insight: answer.insight.insightText
  }));

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. You have an existing question that was imported and needs to be rewritten to better match our style and format.

Your task is to:
1. Rewrite the question text to be more engaging, clear, and match our style examples
2. Rewrite the answer options to be more natural and appealing
3. PRESERVE THE EXACT INSIGHTS - each rewritten answer must still logically lead to the same insight

CRITICAL REQUIREMENTS:
- You MUST preserve the question type: ${question.questionType}
- You MUST generate exactly ${question.answers.length} answers
- Each answer must still logically conclude to its corresponding insight
- The insights themselves must NOT be changed

Question Type: ${question.questionType} - ${TYPE_DESCRIPTIONS[question.questionType as QuestionType]}

${question.questionType === 'BINARY' ? 'When making a binary statement, do not include the details in the answer, simply make the statement the user can agree or disagree with.  The answer should be a simple True or False.  Do not change the orientation of the statement, the old and new positive answers must both correlate with the same insight' : ''}

Focus on making the question specifically relevant to the target category and following the style of our sample questions.

Here is the complete insight taxonomy to help you understand the scope:
${categoryTreeStr}

The classification for the target category is:
Category: ${category.category}	
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

Current question and answer-insight pairs:
Question: "${question.questionText}"
${currentAnswersAndInsights.map((item, i) => `Answer ${i + 1}: "${item.answer}" -> Insight: "${item.insight}"`).join('\n')}

Output JSON only. Follow this format and use the examples to guide style:
${sampleQuestions}

Make sure your rewritten answers still logically lead to the same insights!`;

  const model = LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "question_regeneration",
      schema: {
        type: "object",
        properties: {
          question: {
            type: "string"
          },
          answers: {
            type: "array",
            items: {
              type: "string",
              enum: question.questionType != "BINARY" ? undefined : ["True", "False"]
            }
          },
          insights: {
            type: "array",
            items: {
              type: "string",
              enum: question.answers.map(a => a.insight.insightText)
            }
          },
          type: {
            type: "string",
            enum: [question.questionType]
          }
        },
        required: ["question", "answers", "insights", "type"],
        additionalProperties: false
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

  try {
    const regenerationData = (completion.choices[0].message as any).parsed as {
      question: string;
      answers: string[];
      insights: string[];
      type: QuestionType;
    };
    console.log(`Renegerated: ${JSON.stringify(question.answers)}`)
    console.log(`Renegerated: ${JSON.stringify(question.answers.map(a => a.insight.insightText))}`);
    console.log(`Renegerated: ${JSON.stringify(regenerationData)}`)

    if (!regenerationData) {
      throw new Error("Parse error");
    }

    if (regenerationData.answers.length !== question.answers.length) {
      throw new Error(`Answer count mismatch: expected ${question.answers.length}, got ${regenerationData.answers.length}`);
    }

    if (regenerationData.insights.length !== question.answers.length) {
      throw new Error(`Insight count mismatch: expected ${question.answers.length}, got ${regenerationData.insights.length}`);
    }

    // Update the question and answers in a transaction
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      // Update the question text
      const updatedQuestion = await tx.question.update({
        where: { id: question.id },
        data: {
          questionText: fixIllegalEnumCharacters(regenerationData.question),
        },
      });

      // Match regenerated answers to existing answers based on their insights
      // Create a map of insight text to existing answer for quick lookup
      const insightToAnswerMap = new Map(
        question.answers.map(answer => [answer.insight.insightText, answer])
      );

      // Update each answer by matching the regenerated insight to the existing answer
      for (let i = 0; i < regenerationData.insights.length; i++) {
        const regeneratedInsight = regenerationData.insights[i];
        const existingAnswer = insightToAnswerMap.get(regeneratedInsight);
        
        if (!existingAnswer) {
          throw new Error(`Could not find existing answer for regenerated insight: "${regeneratedInsight}"`);
        }
        console.log(`Updating answer ${i} from ${existingAnswer.answerText} to ${regenerationData.answers[i]}`);
        await tx.answer.update({
          where: { id: existingAnswer.id },
          data: {
            answerText: regenerationData.answers[i],
          },
        });
      }

      return updatedQuestion;
    });

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [updatedQuestion, completion.usage];
  } catch (error) {
    console.error('Error regenerating question:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Regenerates an existing question with human feedback
 * @param existingQuestion The existing question to regenerate (must include answers with insights)
 * @param feedback Human feedback for improving the question (can be empty)
 * @returns Tuple containing the updated question object, new answers, new insights, and token usage statistics
 */
export async function regenerateQuestionWithFeedback(
  existingQuestion: Question & {
    answers: (Answer & {
      insight: Insight;
    })[];
    inspiration: Insight;
  },
  feedback: string
): Promise<[Question, Answer[], Insight[], OpenAI.Completions.CompletionUsage] | null> {
  const category = await prisma.category.findUnique({
    where: { id: existingQuestion.categoryId }
  });

  if (!category) {
    throw new Error(`Category not found for question ${existingQuestion.id}`);
  }

  // Build the base prompt using the extracted function
  const [baseMessages, format, model] = await buildQuestionGenerationPrompt(
    existingQuestion.inspiration, 
    category, 
    existingQuestion.questionType === QuestionType.BINARY
  );

  // Format the existing question as an assistant response
  const existingQuestionResponse = {
    question: existingQuestion.questionText,
    answers: existingQuestion.answers.map(answer => answer.answerText),
    insights: existingQuestion.answers.map(answer => answer.insight.insightText),
    type: existingQuestion.questionType
  };

  // Create feedback prompt
  var feedbackPrompt = feedback.trim() 
    ? `The previous question generation needs improvement based on this feedback: "${feedback}". Please generate another attempt at creating a question for the same insight, incorporating this feedback while maintaining the same concept exploration but with a different style or approach.`
    : `Please generate another attempt at creating a question for the same insight. Try a different style or approach while maintaining the same concept exploration.`;

    feedbackPrompt = `${feedbackPrompt}

    You are allowed to change the question type, answers, and insights.  You must output the new question in the same JSON format as before.
    `

  // Build messages with existing question as assistant response and feedback as new system message
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...baseMessages,
    { role: "assistant", content: JSON.stringify(existingQuestionResponse) },
    { role: "system", content: feedbackPrompt }
  ];

  const completion = await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  try {
    const questionData = (completion.choices[0].message as any).parsed as {
      question: string;
      answers: string[];
      insights: string[];
      type: string;
    };

    if (!questionData) {
      throw new Error("Parse error");
    }
    if (questionData.answers.length != questionData.insights.length) {
      throw new Error("Answers and insights length mismatch");
    }
    if (questionData.type === "DUPLICATE") {
      // Return the original question unchanged if duplicate is generated
      return [existingQuestion, existingQuestion.answers, existingQuestion.answers.map(a => a.insight), completion.usage];
    }

    // Update the question and answers in a transaction
    const [updatedQuestion, newAnswers, newInsights] = await prisma.$transaction(async (tx) => {
      // Get all insights that will be affected by this change
      const oldAnswerInsightIds = new Set(existingQuestion.answers.map(answer => answer.insight.id));

      // For each old answer insight, check if it's used by other questions
      for (const insightId of oldAnswerInsightIds) {
        const otherAnswers = await tx.answer.findMany({
          where: {
            insightId: insightId,
            questionId: { not: existingQuestion.id }
          }
        });

        // If the insight is used by other questions, we can't delete it
        // Instead, we'll just unlink it from this question
        if (otherAnswers.length === 0) {
          // Delete insight comparisons involving this insight
          await tx.insightComparisonPresentation.deleteMany({
            where: {
              insightComparison: {
                OR: [
                  { insightAId: insightId },
                  { insightBId: insightId }
                ]
              }
            }
          });

          await tx.insightComparison.deleteMany({
            where: {
              OR: [
                { insightAId: insightId },
                { insightBId: insightId }
              ]
            }
          });
        }
      }

      // Delete existing answers (this will also unlink the insights)
      await tx.answer.deleteMany({
        where: { questionId: existingQuestion.id }
      });

      // Delete orphaned insights that are no longer used by any answers
      for (const insightId of oldAnswerInsightIds) {
        const remainingAnswers = await tx.answer.findMany({
          where: { insightId: insightId }
        });

        if (remainingAnswers.length === 0) {
          await tx.insight.delete({
            where: { id: insightId }
          });
        }
      }

      // Update the question
      const updatedQuestion = await tx.question.update({
        where: { id: existingQuestion.id },
        data: {
          questionText: fixIllegalEnumCharacters(questionData.question),
          questionType: questionData.type as QuestionType,
        },
      });

      const newAnswers: Answer[] = [];
      const newInsights: Insight[] = [];

      // Create new insights and answers
      for (let i = 0; i < questionData.answers.length; i++) {
        // Create new insight for each answer
        const newInsight = await tx.insight.create({
          data: {
            insightText: fixIllegalEnumCharacters(questionData.insights[i]),
            categoryId: category.id,
            source: InsightSource.ANSWER,
          },
        });
        newInsights.push(newInsight);

        // Create answer linking question to insight
        const answer = await tx.answer.create({
          data: {
            answerText: questionData.answers[i],
            questionId: updatedQuestion.id,
            insightId: newInsight.id,
          },
        });
        newAnswers.push(answer);
      }

      return [updatedQuestion, newAnswers, newInsights];
    });

    return [updatedQuestion, newAnswers, newInsights, completion.usage];
  } catch (error) {
    console.error('Error regenerating question with feedback:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Generates a short summarized version of an insight text with emojis
 * Targets 30 character limit to provide a quick preview of the insight
 * @param insight The insight to generate a short text for
 * @returns Tuple containing the short insight text and token usage statistics
 */
export async function generateShortInsightText(
  insight: Insight
): Promise<[string, OpenAI.Completions.CompletionUsage] | null> {
  const prompt = `Create an ultra-short summary of this insight that captures both the topic and emotional sentiment. Use emojis to pack more meaning into fewer characters.

Target: 30 characters maximum (including emojis)
Purpose: Quick preview that gives a sense of the topic and how the user felt when answering
Style: Use 1-2 relevant emojis + very concise keywords

Examples:
"I love hiking and outdoor adventures" → "🥾 Outdoor adventures"
"I prefer a partner who is financially stable" → "💰 Financial stability"
"I enjoy cooking Italian food" → "🍝 Italian cooking"
"I want someone who shares my faith" → "🙏 Shared faith values"
"I don't like crowded places" → "🤫 Peace & quiet"
"I value deep meaningful conversations" → "💭 Deep conversations"

Output JSON only. Format:
{"shortText":"🎵 Music lover"}

Insight to summarize: "${insight.insightText}"`;

  const model = ULTRA_LOW_MODEL;
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "short_insight_generation",
      schema: {
        type: "object",
        properties: {
          shortText: {
            type: "string"
          }
        },
        required: ["shortText"],
        additionalProperties: false
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

  try {
    const shortTextData = (completion.choices[0].message as any).parsed as {
      shortText: string;
    };
    
    if (!shortTextData || !shortTextData.shortText) {
      throw new Error("Parse error or empty short text");
    }

    // Ensure the short text doesn't exceed 30 characters
    let shortText = shortTextData.shortText;
    if (shortText.length > 30) {
      shortText = shortText.substring(0, 30).trim();
      // If we cut off mid-word, try to find a space to break at
      const lastSpace = shortText.lastIndexOf(' ');
      if (lastSpace > 15) { // Only break at space if it's not too early
        shortText = shortText.substring(0, lastSpace);
      }
    }

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [shortText, completion.usage];
  } catch (error) {
    console.error('Error generating short insight text:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}