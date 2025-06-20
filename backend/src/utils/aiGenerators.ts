import { PrismaClient, InsightSource, Category, Style, Insight, QuestionType, Question, Answer, CategoryOverlap, OverlapType, PolarityType, InsightComparison, InsightComparisonPresentation } from '@prisma/client';
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


  const typeDescription = {
    [QuestionType.BINARY]: "a binary question (yes/no, true/false, agree/disagree)",
    [QuestionType.SINGLE_CHOICE]: "a single-choice question with multiple options",
    [QuestionType.MULTIPLE_CHOICE]: "a multiple-choice question where multiple options can be selected"
  };

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers.  We need to generate the fun questions to answer that can explore a potential insight 

You must generate a great question to facilitate finding out if a particular insight is true of a user.  There will always be a skip option so if no choice is suitable, then you don't need to include a vague alternative, only include decisive alternatives.  Any option presented should produce a usable insight about the person answering the question.  If an insight could have parallel interesting insights, then prefer a single choice or multiple choice based answer instead of a binary statement.  When making a Yes or No / True / False type question, do not include the details in the answer.  Make sure the question does not actually contain a chain of dependent questions.  Don't make new questions that are too similar to existing questions.  If the question has a huge number of possible answers, try to emphasize diversity in selecting possible answersOutput JSON only.  Format:

{"question":"Which food do you love the most?","answers":["Pizza", "Steak", "Salad", "Noodles"], "insights":["I love pizza", "I love steak", "I love Salad", "I love Noodles"], "type":"MULTIPLE_CHOICE"}

If you can't generate a unique question, then output:
{"question":"","answers":[], "insights":[], "type":"DUPLICATE"}


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
${insight.insightText}

The existing questions for this category are:
${questions.map(question => question.text).join('\n')}`;

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
            enum: ["BINARY", "SINGLE_CHOICE", "MULTIPLE_CHOICE", "DUPLICATE"]
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
          questionType: questionData.type as QuestionType,
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
    return [[], { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }];
  }

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to identify and remove redundant inspiration insights that essentially convey the same information.

Category Classification:
Category: ${category.category}
Topic: ${category.topicHeader}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

Here are all the inspiration insights for this category:
${insights.map(insight => insight.insightText).join('\n')}

Please analyze these insights and group together those that are equivalent (i.e., they convey essentially the same information or meaning). For each group, the first insight in the list should be the clearest or most preferred representation. Don't output single insights, only groups of 2 or more. Output JSON only. Format:

{"equivalentInsightGroups": [["I love Italian food", "I enjoy pasta dishes", "Italian cuisine is my favorite"], ["I dislike sports", "I'm not a sports fan"]]}`;

  const model = "o3";
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
      for (const group of redundancyData.equivalentInsightGroups) {
        if (group.length < 2) {
          continue; // No redundancy in this group
        }

        // Get all insights in this group
        const groupInsights = group
          .map(text => insightsMap.get(text))
          .filter(insight => insight !== undefined) as (typeof insights)[0][];

        if (groupInsights.length < 2) {
          console.warn(`Not enough valid insights found for group in category ${category.id}. Skipping group.`);
          continue;
        }

        // Separate insights with and without questions
        const insightsWithQuestions = groupInsights.filter(insight => insight.question);
        const insightsWithoutQuestions = groupInsights.filter(insight => !insight.question);

        let insightsToDelete: (typeof insights)[0][] = [];

        if (insightsWithQuestions.length > 0) {
          // If any insights have questions, keep all of those and delete the ones without questions
          insightsToDelete = insightsWithoutQuestions;
          if (insightsWithQuestions.length > 1) {
            insightsToDelete = insightsToDelete.concat(insightsWithQuestions.slice(1));
            for (const insight of insightsWithQuestions.slice(1)) {
              await deleteQuestionWithCascade(tx, insight.question);
            }
          }
        } else {
          insightsToDelete = groupInsights.slice(1);
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

    // o3 costs 5x more than gpt-4.1
    const usage = {
      prompt_tokens: completion.usage.prompt_tokens * 5,
      completion_tokens: completion.usage.completion_tokens * 5,
      prompt_tokens_details: {
        cached_tokens: completion.usage.prompt_tokens_details.cached_tokens * 5,
      }
    } as OpenAI.Completions.CompletionUsage;
    
    return [deletedInsights, usage];

  } catch (error) {
    console.error('Error reducing redundancy:', error);
    console.error('Raw response:', completion.choices[0].message);
    return null;
  }
}

/**
 * Reduces redundancy in ANSWER insights for a given category by identifying and merging equivalent insights.
 * It identifies groups of equivalent insights, keeps the clearest one,
 * relinks Answer records from redundant insights to the primary one, and then deletes the redundant insights.
 * @param category The category to reduce redundancy in
 * @returns Tuple containing array of deleted insight IDs and token usage statistics
 */
export async function reduceRedundancyForAnswers(
  category: Category
): Promise<[{oldInsight: Insight, newInsight: Insight}[], OpenAI.Completions.CompletionUsage] | null> {
  // Get all ANSWER insights for this category
  const insights = await prisma.insight.findMany({
    where: {
      categoryId: category.id,
      source: InsightSource.ANSWER,
    },
  });

  if (insights.length <= 1) {
    return [[], { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }];
  }

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to identify and merge equivalent insights within a category that essentially convey the same information.

Category Classification:
Category: ${category.category}
Topic: ${category.topicHeader}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

Here are all the ANSWER insights for this category:
${insights.map((insight) => `"${insight.insightText}"`).join('\n')}

Please analyze these insights and group together those that are equivalent. For each group, the first insight in the list should be the clearest or most preferred representation. Don't output single insights, only groups. Output JSON only. Format:

{"equivalentInsightGroups": [["I love Italian food", "I enjoy pasta dishes", "Italian cuisine is my favorite"], ["I dislike sports", "I'm not a sports fan"]]}`;

  const model = "o3"; // Using o3 as it's good for classification and structuring
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
      for (const group of redundancyData.equivalentInsightGroups) {
        if (group.length < 2) { // If only one insight in a group, nothing to merge
          continue;
        }

        const primaryInsightText = group[0];
        const primaryInsight = insightsMap.get(primaryInsightText);

        if (!primaryInsight) {
          console.warn(`Primary insight text "${primaryInsightText}" not found in category ${category.id}. Skipping group.`);
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
          const redundantInsightText = group[i];
          const redundantInsight = insightsMap.get(redundantInsightText);

          if (!redundantInsight) {
            console.warn(`Redundant insight text "${redundantInsightText}" not found in category ${category.id}. Skipping.`);
            continue;
          }

          if (redundantInsight.id === primaryInsight.id) {
            console.warn(`Primary and redundant insight are the same for text "${primaryInsightText}". Skipping merge for this item.`);
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

    // o3 costs 5x more than gpt-4.1
    const usage = {
      prompt_tokens: (completion.usage?.prompt_tokens || 0) * 5,
      completion_tokens: (completion.usage?.completion_tokens || 0) * 5,
      prompt_tokens_details: { // Assuming prompt_tokens_details might be null
        cached_tokens: (completion.usage?.prompt_tokens_details?.cached_tokens || 0) * 5,
      }
    } as OpenAI.Completions.CompletionUsage;

    return [mergedInsights, usage];

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

  if (categoryInsights.length === 0) {
    return [[], { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }];
  }

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to determine how a specific insight relates to other insights in a category.

  You are provided a lists of insights from an specific category.  Your job is to compare each one with the single target insight.  For each of the categories insights, you need to determine if that would indicate compatiblity or incompatiblility with the target insight. You will output a list of insights that are compatible and one list of insights that are incompatible.  Only include ones where the relationship is strong, e.g. it would strongly impact the compatibility of the two users. List the most important one first.  Do not include weak or unrelated relationships.

  Output JSON only. Format:
  {"compatible": ["I love Italian food", "Pizza is my favorite food"], "incompatible": ["I'm a vegetarian"]}

  Category Insights to Compare Against:
  ${categoryInsights.map((catInsight) => `"${catInsight.insightText}"`).join('\n')}

  Target Insight:
  "${insight.insightText}"
  `;

  const model = "gpt-4.1";
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
              type: "string"
            }
          },
          incompatible: {
            type: "array",
            items: {
              type: "string"
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

    for (const catInsight of categoryInsights) {
      let polarity: PolarityType = null;
      if (strongCompatible.has(catInsight.insightText)) polarity = "POSITIVE";
      else if (strongIncompatible.has(catInsight.insightText)) polarity = "NEGATIVE";

      if (!polarity) {
        const comparison = await prisma.insightComparison.upsert({
          where: {
            insightAId_insightBId: {
              insightAId: Math.min(insight.id, catInsight.id),
              insightBId: Math.max(insight.id, catInsight.id),
            },
          },
          update: {
            polarity: "NEUTRAL",
            overlap: "WEAK",
          },
          create: {
            insightA: { connect: { id: Math.min(insight.id, catInsight.id) } },
            insightB: { connect: { id: Math.max(insight.id, catInsight.id) } },
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

      const insightAId = Math.min(insight.id, catInsight.id);
      const insightBId = Math.max(insight.id, catInsight.id);

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

  const model = "gpt-4.1";
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
 * @returns Tuple containing array of objects with details about deleted questions and token usage statistics
 */
export async function reduceRedundancyForQuestions(
  category: Category
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
    return [[], { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }];
  }

  const questions = inspirationInsights.map(insight => insight.question);

  const prompt = `We are building a database of information about users of a dating app by asking them questions and extracting insights from their answers. We need to identify and remove equivalent questions within a category that essentially ask the same thing.

Category Classification:
Category: ${category.category}
Topic: ${category.topicHeader}
Subcategory: ${category.subcategory}
Subject: ${category.insightSubject}

Here are all the questions for this category:
${questions.map((question) => `"${question.questionText}"`).join('\n')}

Please analyze these questions and group together those that are equivalent or ask essentially the same thing. For each group, the first question in the list should be the clearest or most preferred representation. Don't output single questions, only groups of 2 or more. Output JSON only. Format:

{"equivalentQuestionGroups": [["What's your favorite food?", "Which food do you enjoy most?", "What food do you love eating?"], ["Do you like sports?", "Are you into athletics?"]]}`;

  const model = "o3"; // Using o3 for better grouping analysis
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

  // Skip cache as this process should always use the latest set of questions
  const completion = await openai.beta.chat.completions.parse({
    messages,
    model,
    response_format: format,
  });

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
      for (const group of redundancyData.equivalentQuestionGroups) {
        if (group.length < 2) { // If only one question in a group, nothing to delete
          continue;
        }

        const primaryQuestionText = group[0];
        const primaryQuestion = questionsMap.get(primaryQuestionText);

        if (!primaryQuestion) {
          console.warn(`Primary question text "${primaryQuestionText}" not found in category ${category.id}. Skipping group.`);
          continue;
        }

        // Delete redundant questions (all except the first one)
        for (let i = 1; i < group.length; i++) {
          const redundantQuestionText = group[i];
          const redundantQuestion = questionsMap.get(redundantQuestionText);

          if (!redundantQuestion) {
            console.warn(`Redundant question text "${redundantQuestionText}" not found in category ${category.id}. Skipping.`);
            continue;
          }

          if (redundantQuestion.id === primaryQuestion.id) {
            console.warn(`Primary and redundant question are the same for text "${primaryQuestionText}". Skipping deletion for this item.`);
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

    // o3 costs 5x more than gpt-4.1
    const usage = {
      prompt_tokens: (completion.usage?.prompt_tokens || 0) * 5,
      completion_tokens: (completion.usage?.completion_tokens || 0) * 5,
      prompt_tokens_details: {
        cached_tokens: (completion.usage?.prompt_tokens_details?.cached_tokens || 0) * 5,
      }
    } as OpenAI.Completions.CompletionUsage;

    return [mergedQuestionsInfo, usage];

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
    for (const [_text, group] of insightsByText) {
      if (group.length < 2) {
        continue; // No redundancy in this group
      }

      // Prioritize insights with questions, then by ID (ascending)
      const insightsWithQuestions = group.filter(insight => insight.question);
      const insightsWithoutQuestions = group.filter(insight => !insight.question);
      
      let primaryInsight: typeof group[0];
      let redundantInsights: typeof group;

      if (insightsWithQuestions.length > 0) {
        // If any insights have questions, keep the first one with a question and delete the rest
        primaryInsight = insightsWithQuestions[0];
        redundantInsights = [...insightsWithQuestions.slice(1), ...insightsWithoutQuestions];
      } else {
        // If none have questions, keep the first one by ID
        primaryInsight = group[0];
        redundantInsights = group.slice(1);
      }

      // Iterate over redundant insights in the current group
      for (const redundantInsight of redundantInsights) {
        // Should not happen given unique IDs and selection logic, but as a safeguard:
        if (redundantInsight.id === primaryInsight.id) {
          console.warn(`Primary and redundant insight are the same (ID: ${primaryInsight.id}, Text: "${primaryInsight.insightText}"). Skipping merge for this item.`);
          continue;
        }

        // If the redundant insight has a question, we need to clean up the associated data
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
 * Helper function to delete a question and all its cascading relationships within a transaction
 * @param tx The Prisma transaction context
 * @param question The question to delete (with answers and insights included)
 * @returns void
 */
async function deleteQuestionWithCascade(
  tx: any, // Prisma transaction type
  question: {
    id: number;
    answers: Array<{
      insight: Insight | null;
    }>;
  }
): Promise<void> {
  // Get all answer insights for this question
  const answerInsights = question.answers.map(answer => answer.insight).filter(insight => insight !== null) as Insight[];
  
  // For each answer insight, check if it's referenced by other answers outside this question
  const orphanedAnswerInsights: Map<number, Insight> = new Map();
  for (const answerInsight of answerInsights) {
    const otherAnswerReferences = await tx.answer.count({
      where: {
        insightId: answerInsight.id,
        questionId: { not: question.id },
      },
    });

    if (otherAnswerReferences === 0) {
      // This answer insight is only referenced by answers from this question
      orphanedAnswerInsights.set(answerInsight.id, answerInsight);
    }
  }

  // Delete insight comparisons for orphaned answer insights
  for (const orphanedInsight of orphanedAnswerInsights.values()) {
    // Delete presentations first
    const comparisons = await tx.insightComparison.findMany({
      where: {
        OR: [
          { insightAId: orphanedInsight.id },
          { insightBId: orphanedInsight.id },
        ],
      },
    });

    for (const comparison of comparisons) {
      await tx.insightComparisonPresentation.deleteMany({
        where: { insightComparisonId: comparison.id },
      });
    }

    // Delete the comparisons themselves
    await tx.insightComparison.deleteMany({
      where: {
        OR: [
          { insightAId: orphanedInsight.id },
          { insightBId: orphanedInsight.id },
        ],
      },
    });
  }

  // Delete all answers for this question
  await tx.answer.deleteMany({
    where: { questionId: question.id },
  });

  // Delete orphaned answer insights
  for (const orphanedInsight of orphanedAnswerInsights.values()) {
    await tx.insight.delete({
      where: { id: orphanedInsight.id },
    });
  }

  // Delete the question itself
  await tx.question.delete({
    where: { id: question.id },
  });
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