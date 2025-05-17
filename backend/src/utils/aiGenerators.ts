import { PrismaClient, InsightSource, Category, Style, Insight, QuestionType, Question, Answer, CategoryOverlap, OverlapType, PolarityType, InsightComparison, InsightComparisonPresentation } from '../../src/generated/prisma/core';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { fetchCachedExecution, cachePromptExecution } from './llmCaching';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

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
          insightText,
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
            enum: ["BINARY", "SINGLE_CHOICE", "MULTIPLE_CHOICE"]
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

    // Use a transaction to ensure atomic creation of question, insights, and answers
    const [question, answers, newInsights] = await prisma.$transaction(async (tx) => {
      //if a question for this inspiration already exists delete it and the answers and insights linked to it
      await tx.question.deleteMany({
        where: {
          inspirationId: insight.id,
        },
      });
      // TODO: need to do setup for cascading

      // Create the question
      const question = await tx.question.create({
        data: {
          questionText: questionData.question,
          questionType: questionData.type,
          inspirationId: insight.id,
        },
      });

      const answers: Answer[] = [];
      const newInsights: Insight[] = [];

      for (let i = 0; i < questionData.answers.length; i++) {
        // Create new insight for each answer
        const newInsight = await tx.insight.create({
          data: {
            insightText: questionData.insights[i],
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
  //swap the two categories if their ids are out of order to maximize caching
  if (categoryA.id > categoryB.id) {
    const temp = categoryA;
    categoryA = categoryB;
    categoryB = temp;
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
      strict: true,
      name: "overlap",
      schema: {
        type: "object",
        properties: {
          overlap: {
            type: "string",
            enum: ["STRONG", "WEAK", "NONE"]
          }
        },
        required: ["overlap"],
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
    const overlapData = (completion.choices[0].message as any).parsed as {
      overlap: OverlapType;
    };
    if (!overlapData) {
      throw new Error("Parse error");
    }

    // Create or update the categoryOverlap record
    const categoryOverlap = await prisma.categoryOverlap.upsert({
      where: {
        categoryAId_categoryBId: {
          categoryAId: categoryA.id,
          categoryBId: categoryB.id,
        },
      },
      update: {
        overlap: overlapData.overlap,
      },
      create: {
        categoryAId: categoryA.id,
        categoryBId: categoryB.id,
        overlap: overlapData.overlap,
      },
    });

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

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

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [category, completion.usage];
  } catch (error) {
    console.error('Error creating category:', error);
    console.error('Raw response:', completion.choices[0].message);
    return [null, completion.usage];
  }
}

/**
 * Generates an insight comparison between two insights using AI to determine compatibility, strength, and presentation
 * @param insightA The first user's insight
 * @param insightB The second user's insight
 * @returns The created InsightComparison object and token usage statistics
 */
export async function generateInsightComparison(
  insightA: Insight,
  insightB: Insight
): Promise<[InsightComparison, InsightComparisonPresentation | undefined, OpenAI.Completions.CompletionUsage] | null> {
  // Swap the two insights if their ids are out of order to maximize caching
  if (insightA.id > insightB.id) {
    const temp = insightA;
    insightA = insightB;
    insightB = temp;
  }

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers.   We have extracted many insights, but now we need to determine if an insight for one user and an insight for another user imply compatibility.

You must analyze the insight for user A and for user B and determine how they relate. You must classify them as either compatible, unrelated, or incompatible.  You must also rank the strength of relationship as strong or weak.  If the strength relationship is strong, you need to provide a title to show as a header to describe what links these insights together since they will be presented side by side.  Also provide a maximally shortened version of the essence of the insights so it can fit cleanly in the UI.  Use n/a if it is a weak relationship.  Output JSON in the following format:

{"relation":"compatible","strength":"weak","presentation":"filler","title":"Favorite sport", "user_a":"Tennis", "user_b":"Baseball"}

User A Insight:
${insightA.insightText}
User B Insight:
${insightB.insightText}`;

  const model = "gpt-4.1";
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "insight_comparison",
      schema: {
        type: "object",
        properties: {
          relation: { type: "string", enum: ["compatible", "unrelated", "incompatible"] },
          strength: { type: "string", enum: ["strong", "weak"] },
          title: { type: "string" },
          user_a: { type: "string" },
          user_b: { type: "string" }
        },
        required: ["relation", "strength", "title", "user_a", "user_b"],
        additionalProperties: false
      }
    }
  };

  const cachedCompletion = await fetchCachedExecution(model, messages, format);
  const completion = cachedCompletion || await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

  try {
    const comparisonData = (completion.choices[0].message as any).parsed as {
      relation: string;
      strength: string;
      title: string;
      user_a: string;
      user_b: string;
    };
    if (!comparisonData) {
      throw new Error("Parse error");
    }

    let polarity: PolarityType = null;
    if (comparisonData.relation === "compatible") polarity = "POSITIVE";
    else if (comparisonData.relation === "incompatible") polarity = "NEGATIVE";
    else if (comparisonData.relation === "unrelated") polarity = "NEUTRAL";

    let overlap: OverlapType = null;
    if (comparisonData.strength === "strong") overlap = "STRONG";
    else if (comparisonData.strength === "weak") overlap = "WEAK";

    const insightComparison = await prisma.insightComparison.upsert({
      where: {
        insightAId_insightBId: {
          insightAId: insightA.id,
          insightBId: insightB.id,
        },
      },
      update: {
        polarity: polarity,
        overlap: overlap,
      },
      create: {
        insightA: {
          connect: { id: insightA.id }
        },
        insightB: {
          connect: { id: insightB.id }
        },
        polarity: polarity,
        overlap: overlap,
      },
    });

    await prisma.insightComparisonPresentation.deleteMany({
      where: {
        insightComparisonId: insightComparison.id
      }
    });
    var insightComparisonPresentation = undefined;
    if (overlap == "STRONG") {
      insightComparisonPresentation = await prisma.insightComparisonPresentation.create({
        data: {
          insightComparison: {
            connect: { id: insightComparison.id }
          },
          presentationTitle: comparisonData.title,
          conciseAText: comparisonData.user_a,
          conciseBText: comparisonData.user_b,
        }
      });
    }

    if (!cachedCompletion) {
      await cachePromptExecution(model, messages, format, completion);
    }

    return [insightComparison, insightComparisonPresentation, completion.usage];
  } catch (error) {
    console.error('Error creating insight comparison:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Reduces redundancy in inspiration insights for a given category by identifying and removing duplicate insights
 * @param category The category to reduce redundancy in
 * @returns Tuple containing array of deleted insight IDs and token usage statistics
 */
export async function reduceRedundancy(
  category: Category
): Promise<[number[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all inspiration insights for this category
  const insights = await prisma.insight.findMany({
    where: {
      categoryId: category.id,
      source: InsightSource.INSPIRATION,
    },
  });

  if (insights.length <= 1) {
    return [[], { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }];
  }

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to identify and remove redundant insights that essentially convey the same information.

Category Classification:
Category: ${category.category}
Topic: ${category.topicHeader}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

Here are all the insights for this category:
${insights.map((insight, index) => `${index + 1}. ${insight.insightText}`).join('\n')}

Please analyze these insights and identify which ones are redundant (i.e., they convey essentially the same information or meaning). Output JSON only. Format:

{"redundantInsights": [2, 7, 21]}`;

  const model = "o3";
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: "system", content: prompt }];
  const format = {
    type: "json_schema" as const,
    json_schema: {
      strict: true,
      name: "redundant_insights",
      schema: {
        type: "object",
        properties: {
          redundantInsights: {
            type: "array",
            items: {
              type: "integer"
            }
          }
        },
        required: ["redundantInsights"],
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
      redundantInsights: number[];
    };
    if (!redundancyData) {
      throw new Error("Parse error");
    }

    // Convert 1-based indices to 0-based and get unique insight IDs to delete
    const insightIndicesToDelete = new Set(
      redundancyData.redundantInsights.map(num => num - 1)
    );
    const insightsToDelete = insights.filter((_, index) => insightIndicesToDelete.has(index));

    const deletedIds = [];
    for (const insight of insightsToDelete) {
      await prisma.insight.delete({
        where: { id: insight.id }
      });
      deletedIds.push(insight.id);
    }

    // o3 costs 5x more than gpt-4.1
    const usage = {
      prompt_tokens: completion.usage.prompt_tokens * 5,
      completion_tokens: completion.usage.completion_tokens * 5,
      prompt_tokens_details: {
        cached_tokens: completion.usage.prompt_tokens_details.cached_tokens * 5,
      }
    } as OpenAI.Completions.CompletionUsage;
    return [deletedIds, usage];

  } catch (error) {
    console.error('Error reducing redundancy:', error);
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
    return [[], { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }];
  }

  // Get all valid insight subjects for validation
  const validSubjects = allCategories.map(cat => cat.insightSubject);

  // Build category tree for context
  const categoryTree = allCategories.reduce((tree, cat) => {
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

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to determine which categories of insights might have overlapping or related insights that could imply compatibility between users.

Here are all categories in the system:
${categoryTreeStr}

Please analyze the target category and identify which other categories have STRONG relationships that could imply compatibility or incompatibility between users. Output them in descending order of importance. Consider:
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
Topic: ${category.topicHeader}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}
`;

  const model = "o3";
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

    // o3 costs 5x more than gpt-4.1
    const usage = {
      prompt_tokens: completion.usage.prompt_tokens * 5,
      completion_tokens: completion.usage.completion_tokens * 5,
      prompt_tokens_details: {
        cached_tokens: completion.usage.prompt_tokens_details.cached_tokens * 5,
      }
    } as OpenAI.Completions.CompletionUsage;

    return [overlaps, usage];
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
  insight: Insight
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
    if (!tree[cat.category][cat.topicHeader]) {
      tree[cat.category][cat.topicHeader] = {};
    }
    if (!tree[cat.category][cat.topicHeader][cat.subcategory]) {
      tree[cat.category][cat.topicHeader][cat.subcategory] = [];
    }
    tree[cat.category][cat.topicHeader][cat.subcategory].push(cat.insightSubject);
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
Topic: ${insightCategory.topicHeader}
Subcategory: ${insightCategory.subcategory}
Subject: ${insightCategory.insightSubject}
`;

  const model = "gpt-4.1";
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