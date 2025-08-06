import { PrismaClient, InsightSource, Category, Insight, InsightDirection } from '@prisma/client';
import * as dotenv from 'dotenv';
import { 
  generateInspirationInsights, generateBaseQuestion, generateInsightTextFromImportedQuestion,
  generateCategoryOverlapByRanking, generateInsightCategoryComparisonByRanking, 
  generateInsightQuestionComparisonByRanking, generateInsightCategoryOverlap, generateInsightComparisonPresentation,
  reduceExactRedundancyForQuestions, reduceExactRedundancyForInspirations, reduceExactRedundancyForAnswers, 
  reduceRedundancyForQuestions, reduceRedundancyForInspirations, reduceRedundancyForAnswers,
  predictQuestionCandidateCategory, generateQuestionFromProposal, regenerateImportedQuestion,
  generateShortInsightText, generateSelfInsightComparisons, computeQuestionRedundancyGroups,
  } from '../src/utils/aiGenerators';
import { EXTRA_CATEGORIES, parseCategoriesFromCSV } from './categories';
import { FIXED_STYLES } from './styles';
import { processInParallel } from '../src/utils/parallelProcessor';
import { parseQuestionsFromCSV, parseMappingFromCSV, parseQuestionType, extractAnswersFromRow, parseProposedQuestions, handleConversationStarterImport } from './questions';
import { AI_GENERATION_CONFIG } from '../src/config';
dotenv.config();
const prisma = new PrismaClient();

// Extract configuration constants
const {
  BATCH_COUNT,
  MINIMUM_TARGET_INSIGHTS,
  MAX_NEW_INSIGHTS_PER_GENERATION,
  MIN_NEW_INSIGHTS_PER_GENERATION,
  BINARY_PROBABILITY,
  GENERATE_ALL_COMPARISONS,
  GENERATE_SELF_COMPARISONS,
  REGENERATE_IMPORTED_QUESTIONS,
  IMPORT_QUESTIONS_FROM_CSV,
  IMPORT_AFTER_GENERATE,
  REDUCE_ANSWER_INSIGHT_REDUNDANCY,
} = AI_GENERATION_CONFIG;

async function handleQuestionImport(
  categories: any[], 
  totalUsage: { promptTokens: number; cachedPromptTokens: number; completionTokens: number }
) {
  if (IMPORT_QUESTIONS_FROM_CSV) {
    console.log('Importing questions from CSV...');
    const [questionsData, mappingData] = await Promise.all([
      parseQuestionsFromCSV(),
      parseMappingFromCSV()
    ]);

    console.log(`Loaded ${questionsData.length} questions and ${mappingData.length} mappings`);

    // Create a mapping from question_id + answer_option to insight_tag
    const answerToInsightMap = new Map<string, { tag: string, direction: string }>();
    for (const mapping of mappingData) {
      if (mapping.source === 'question' && mapping.mapped_to_insight_tag && mapping.insight_direction) {
        const key = `${mapping.question_id}:::${mapping.raw_value_answer_option}`;
        answerToInsightMap.set(key, { tag: mapping.mapped_to_insight_tag, direction: mapping.insight_direction });
      }
    }
    console.log(`Created ${answerToInsightMap.size} answer-to-insight mappings`);

    // Process each question
    for (const questionRow of questionsData) {
      if (questionRow.status !== 'ACTIVE') {
        console.log(`Skipping inactive question: ${questionRow.question_stem}`);
        continue;
      }

      const existingQuestion = await prisma.question.findFirst({
        where: { 
          originalQuestion: questionRow.question_stem
        },
      });

      if (existingQuestion) {
        console.log(`Question already exists: ${questionRow.question_stem}`);
        continue;
      }

      // Extract answers from the row
      const answers = extractAnswersFromRow(questionRow).
        filter(x => x != 'None of the above' && x != 'Prefer not to say');

      // Determine if the question is an image-based question
      const isImageQuestion = questionRow.question_type.endsWith('_IMAGE');
      
      if (answers.length === 0) {
        console.warn(`No answers found for question: ${questionRow.question_stem}`);
        continue;
      }

      console.log(`Processing question: ${questionRow.question_stem} : ${answers}`);

      // Find matching category for the question's insights
      const matchingCategory = categories.find(c => 
        c.insightSubject === questionRow.insight_subject
      );

      if (!matchingCategory) {
        console.warn(`No matching category found for question: ${questionRow.question_id} (${questionRow.insight_subject})`);
        continue;
      }

      const inspirationInsight = await prisma.insight.create({
        data: {
          categoryId: matchingCategory.id,
          insightText: `Question imported: ${questionRow.question_stem}`,
          source: InsightSource.INSPIRATION,
        },
      });      
      
      // Create the question linked to the inspiration insight
      const question = await prisma.question.create({
        data: {
          inspirationId: inspirationInsight.id,
          categoryId: matchingCategory.id,
          questionText: questionRow.question_stem,
          originalQuestion: questionRow.question_stem, // Preserve the exact imported text
          questionType: parseQuestionType(questionRow.question_type, questionRow.multi_select),
          publishedId: questionRow.question_id,
          persistentId: questionRow.question_id, // Use original question ID as persistent ID for imported questions
          isImageQuestion: isImageQuestion,
          imagesPerRow: isImageQuestion ? parseInt(questionRow.image_per_row) : undefined,
        } as any,
      });

      // Create answers and link to insights
      for (let i = 0; i < answers.length; i++) {
        const answerText = answers[i];
        const mapKey = `${questionRow.question_id}:::${answerText}`;
        const insightTag : { tag: string, direction: string } = answerToInsightMap.get(mapKey);

        if (!insightTag) {
          console.error(`failed to find answer insight: ${insightTag}`);
          continue
        }

        // Find or create the insight for this answer
        var insight = await prisma.insight.findFirst({
          where: { 
            publishedTag: insightTag.tag,
            legacyDirection: insightTag.direction as InsightDirection
          }
        });

        if (!insight) {
          // Create new insight with placeholder text
          insight = await prisma.insight.create({
            data: {
              categoryId: matchingCategory.id,
              insightText: "IMPORTED",
              source: InsightSource.ANSWER,
              publishedTag: insightTag.tag == 'nan' ? undefined : insightTag.tag,
              legacyDirection: insightTag.direction as InsightDirection 
            },
          });
          console.log(`Created new insight: ${insightTag.tag} ${insightTag.direction}`);
        } 

        // Create the answer
        await prisma.answer.create({
          data: {
            questionId: question.id,
            answerText: answerText,
            originalAnswer: answerText, // Preserve original imported answer text
            insightId: insight.id,
          } as any,
        });
      }
    }

    console.log('Questions import completed successfully!');

    // Phase: Generate proper insight text for insights that need it
    console.log('Generating insight text for imported insights...');
    const insightsNeedingGeneration = await prisma.insight.findMany({
      where: {
        insightText: "IMPORTED",
      }
    });
    
    if (insightsNeedingGeneration.length > 0) {
      console.log(`Generating insight text for ${insightsNeedingGeneration.length} insights`);
      
      await processInParallel<Insight, void>(
        insightsNeedingGeneration,
        async (insight) => {
          try {
            const category = categories.find(c => c.id === insight.categoryId);
            if (!category) {
              console.error(`Category not found for insight ${insight.id}`);
              return;
            }
            const answer = await prisma.answer.findFirst({ where: { insightId: insight.id } });
            if (!answer) {
              console.error(`Answer not found for insight ${insight.id}`);
              return;
            }
            const question = await prisma.question.findFirst({ where: { id: answer.questionId } });
            if (!question) {
              console.error(`Question not found for answer ${answer.id}`);
              return;
            }

            const result = await generateInsightTextFromImportedQuestion(question.questionText, answer.answerText, category, insight.publishedTag);
            if (result) {
              const [generatedText, usage] = result;
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
              totalUsage.completionTokens += usage.completion_tokens;

              // Update the insight with the generated text
              await prisma.insight.update({
                where: { id: insight.id },
                data: { insightText: generatedText },
              });

              console.log(`Generated insight text for "${insight.publishedTag}": ${generatedText}`);
            } else {
              console.error(`Failed to generate insight text for "${insight.publishedTag}"`);
            }
          } catch (error) {
            console.error(`Error processing insight ${insight.id}:`, error);
          }
        },
        BATCH_COUNT
      );
    } else {
      console.log('No insights need text generation, skipping generation phase');
    }

    // Phase: Update inspiration insights to use answer insight text
    console.log('Updating inspiration insights with answer insight text...');
    const inspirationInsightsNeedingUpdate = await prisma.insight.findMany({
      where: {
        source: InsightSource.INSPIRATION,
        insightText: {
          startsWith: "Question imported: "
        }
      }
    });
    
    if (inspirationInsightsNeedingUpdate.length > 0) {
      console.log(`Updating ${inspirationInsightsNeedingUpdate.length} inspiration insights`);
      
      for (const inspirationInsight of inspirationInsightsNeedingUpdate) {
        try {
          // Find the question associated with this inspiration insight
          const question = await prisma.question.findFirst({
            where: { inspirationId: inspirationInsight.id }
          });
          
          if (!question) {
            console.error(`No question found for inspiration insight ${inspirationInsight.id}`);
            continue;
          }
          
          // Find the first answer for this question and get its insight
          const answer = await prisma.answer.findFirst({
            where: { questionId: question.id },
            include: { insight: true }
          });
          
          if (!answer || !answer.insight) {
            console.error(`No answer with insight found for question ${question.id}`);
            continue;
          }
          
          // Update the inspiration insight text to match the answer insight text
          await prisma.insight.update({
            where: { id: inspirationInsight.id },
            data: { insightText: answer.insight.insightText }
          });
          
          console.log(`Updated inspiration insight for question "${question.questionText}" with text: "${answer.insight.insightText}"`);
        } catch (error) {
          console.error(`Error updating inspiration insight ${inspirationInsight.id}:`, error);
        }
      }
    } else {
      console.log('No inspiration insights need text updates');
    }
  }

  if (REGENERATE_IMPORTED_QUESTIONS) {
    console.log('Regenerating imported questions to match style guidelines...');
    const publishedQuestions = await prisma.question.findMany({
      where: {
        publishedId: {
          not: null,
        },
      },
      include: {
        answers: {
          include: {
            insight: true,
          },
        },
      },
    });

    if (publishedQuestions.length > 0) {
      console.log(`Regenerating ${publishedQuestions.length} published questions`);
      
      await processInParallel<typeof publishedQuestions[0], void>(
        publishedQuestions,
        async (question) => {
          try {
            if (question.questionText !== question.originalQuestion) {
              return
            }
            if (question.isImageQuestion) {
              return;
            }
            const result = await regenerateImportedQuestion(question);
            if (result) {
              const [updatedQuestion, usage] = result;
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
              totalUsage.completionTokens += usage.completion_tokens;

              console.log(`Regenerated question "${question.questionText}" -> "${updatedQuestion.questionText}"`);
            } else {
              console.error(`Failed to regenerate question: ${question.questionText}`);
            }
          } catch (error) {
            console.error(`Error regenerating question ${question.id}:`, error);
          }
        },
        BATCH_COUNT
      );
    } else {
      console.log('No published questions found, skipping regeneration phase');
    }
  }
}



async function main() {
  try {
    let totalUsage = {
      promptTokens: 0,
      cachedPromptTokens: 0,
      completionTokens: 0,
    };

    // Start periodic logging of token usage every 5 seconds
    const usageLogger = setInterval(() => {
      console.log(`accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`);
    }, 5000);

    let categories = await prisma.category.findMany();
    
    // Combine categories from CSV and extra categories
    const csvCategories = await parseCategoriesFromCSV();
    const allCategoryData = [...csvCategories, ...EXTRA_CATEGORIES];
    
    // Upsert categories (create or update)
    console.log('Upserting categories...');
    for (const categoryData of allCategoryData) {
      // Check if category already exists
      const existingCategory = categories.find(c => 
        c.category === categoryData.category &&
        c.subcategory === categoryData.subcategory &&
        c.insightSubject === categoryData.insightSubject
      );

      let category;
      if (existingCategory) {
        // Update existing category
        category = await prisma.category.update({
          where: { id: existingCategory.id },
          data: { expandedHints: categoryData.expandedHints },
        });
        console.log(`Updated category: ${category.category} - ${category.subcategory} - ${category.insightSubject}`);
      } else {
        // Create new category
        category = await prisma.category.create({
          data: categoryData,
        });
        categories.push(category);
        console.log(`Created category: ${category.category} - ${category.subcategory} - ${category.insightSubject}`);
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

    // Handle question import based on timing preference
    if (!IMPORT_AFTER_GENERATE) {
      await handleQuestionImport(categories, totalUsage);
    }

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

    console.log('Generating insights...');
    await processInParallel<Category, void>(
      categories,
      async (category) => {
        var totalInsights = await prisma.insight.count({ where: { categoryId: category.id, source: InsightSource.INSPIRATION } });
        // This is not a perfect check to see if we already did the correct job
        if (totalInsights > MINIMUM_TARGET_INSIGHTS) return;
        let done = false;
        let round_fails = 0;
        totalInsights = -1; // first pass is never a failure
        while (!done && totalInsights < MINIMUM_TARGET_INSIGHTS) {
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
          const target = Math.max(MIN_NEW_INSIGHTS_PER_GENERATION, Math.min(MAX_NEW_INSIGHTS_PER_GENERATION, MINIMUM_TARGET_INSIGHTS - totalInsights));
          const [newInsights, isDone, usage] = await generateInspirationInsights(category, target);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          done = isDone;
          console.log(`Generated ${newInsights.length} insights for category: ${category.insightSubject} (total: ${totalInsights})`);
          console.log(`${newInsights.map(i => i.insightText).join('\n')}`);

        }
        totalInsights = await prisma.insight.count({ where: { categoryId: category.id, source: InsightSource.INSPIRATION } });

        console.log(`Reducing redundancy for category: ${category.insightSubject}`);
        const [deletedIds, usage] = await reduceRedundancyForInspirations(category);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
        console.log(`Reduced redundancy for category: ${category.insightSubject} - ${deletedIds.length} insights deleted of ${totalInsights}`);

      },
      BATCH_COUNT
    );

    console.log('Reducing redundancy for INSPIRATION insights exact matches...');
    const inspirationInsightExactDupes = await reduceExactRedundancyForInspirations();
    for (const mergedInsight of inspirationInsightExactDupes) {
      console.log(`Merged insight: ${mergedInsight.oldInsight.insightText} -> ${mergedInsight.newInsight.insightText}`);
    }

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

          const preferBinary = Math.random() < BINARY_PROBABILITY;
          const [question, answers, insights, usage] = await generateBaseQuestion(insight, preferBinary);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          if (question) {
            console.log(`Generated ${question.questionType} question for insight: ${insight.insightText}`);
            console.log(`${question.questionText}`);
            console.log(`${answers.map(a => a.answerText).join('|||')}`);
            console.log(`${insights.map(i => i.insightText).join('|||')}`);
          } else {
            console.error(`No question generated for insight: ${insight.insightText}`);
            //TODO: delete insight
          }
        } catch (err) {
          console.error(`Error processing insight ID: ${insight.id}`, err);
        }
      },
      BATCH_COUNT
    );



    console.log('Reducing redundancy for QUESTION exact matches...');
    const questionExactDupes = await reduceExactRedundancyForQuestions();
    for (const mergedQuestion of questionExactDupes) {
      console.log(`Merged question: "${mergedQuestion.oldQuestion.questionText}" -> "${mergedQuestion.newQuestion.questionText}"`);
    }
     
    console.log('Reducing redundancy for questions...');
    await processInParallel<Category, void>(
      categories,
      async (category) => {
        const result = await reduceRedundancyForQuestions(category);
        if (result) {
          const [mergedQuestions, usage] = result;
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          for (const mergedQuestion of mergedQuestions) {
            console.log(`Merged question: "${mergedQuestion.oldQuestion.questionText}" -> "${mergedQuestion.newQuestion.questionText}"`);
          }
        }
      },
      BATCH_COUNT
    );

    console.log('Generating questions from proposed concepts...');
    const proposedQuestions = await parseProposedQuestions();
    
    if (proposedQuestions.length > 0) {
      console.log(`Processing ${proposedQuestions.length} proposed questions`);
      
      await processInParallel<string, void>(
        proposedQuestions,
        async (proposedQuestionText) => {
          try {
            // Check if a question with this exact text already exists
            const existingQuestion = await prisma.question.findFirst({
              where: { 
                proposedQuestion: proposedQuestionText
              },
            });

            if (existingQuestion) {
              console.log(`Question already exists: ${proposedQuestionText}`);
              return;
            }

            // First, predict the category for this proposed question
            const categoryResult = await predictQuestionCandidateCategory(proposedQuestionText);
            if (!categoryResult) {
              console.error(`Failed to predict category for proposed question: ${proposedQuestionText}`);
              return;
            }

            const [category, categoryUsage] = categoryResult;
            totalUsage.promptTokens += categoryUsage.prompt_tokens;
            totalUsage.cachedPromptTokens += categoryUsage.prompt_tokens_details?.cached_tokens || 0;
            totalUsage.completionTokens += categoryUsage.completion_tokens;

            // Generate the complete question from the proposal
            // For proposed questions, we'll make them binary by default for simplicity
            const questionResult = await generateQuestionFromProposal(category, proposedQuestionText, false);
            if (!questionResult) {
              console.error(`Failed to generate question from proposal: ${proposedQuestionText}`);
              return;
            }

            const [question, answers, insights, questionUsage] = questionResult;
            totalUsage.promptTokens += questionUsage.prompt_tokens;
            totalUsage.cachedPromptTokens += questionUsage.prompt_tokens_details?.cached_tokens || 0;
            totalUsage.completionTokens += questionUsage.completion_tokens;

            if (question) {
              console.log(`Generated ${question.questionType} question from proposal: ${proposedQuestionText}`);
              console.log(`Generated question: ${question.questionText}`);
              console.log(`Generated answers: ${answers.map(a => a.answerText).join('|||')}`);
              console.log(`Generated insights: ${insights.map(i => i.insightText).join('|||')}`);
            } else {
              console.log(`No question generated from proposal (likely duplicate): ${proposedQuestionText}`);
            }
          } catch (err) {
            console.error(`Error processing proposed question: ${proposedQuestionText}`, err);
          }
        },
        BATCH_COUNT
      );
    } else {
      console.log('No proposed questions found, skipping proposed question generation phase');
    }

    // Handle question import after generation if configured
    if (IMPORT_AFTER_GENERATE) {
      await handleQuestionImport(categories, totalUsage);
    }

    console.log('Computing question redundancy groups for all categories...');
    await processInParallel<Category, void>(
      categories,
      async (category) => {
        try {
          const usage = await computeQuestionRedundancyGroups(category);
          if (usage) {
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
            totalUsage.completionTokens += usage.completion_tokens;
            console.log(`Computed question redundancy groups for category: ${category.insightSubject}`);
          } else {
            console.log(`No redundancy groups computed for category: ${category.insightSubject} (insufficient questions)`);
          }
        } catch (err) {
          console.error(`Error computing question redundancy groups for category ${category.insightSubject}:`, err);
        }
      },
      BATCH_COUNT
    );

    console.log('Reducing redundancy for ANSWER insights exact matches...');
    const answerInsightExactDupes = await reduceExactRedundancyForAnswers();
    for (const mergedInsight of answerInsightExactDupes) {
      console.log(`Merged insight: ${mergedInsight.oldInsight.insightText} -> ${mergedInsight.newInsight.insightText}`);
    }
    if (REDUCE_ANSWER_INSIGHT_REDUNDANCY) {
      console.log('Reducing redundancy for ANSWER insights AI matches...');
      await processInParallel<Category, void>(
        categories,
        async (category) => {
          const result = await reduceRedundancyForAnswers(category);
          if (result) {
            const [mergedInsights, usage] = result;
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
            totalUsage.completionTokens += usage.completion_tokens;
            for (const mergedInsight of mergedInsights) {
              console.log(`Merged insight: ${mergedInsight.oldInsight.insightText} -> ${mergedInsight.newInsight.insightText}`);
            }
          }
        },
        BATCH_COUNT
      );
    }

    console.log('Generating short insight text for all insights...');
    const allInsights = await prisma.insight.findMany({
      where: {
        source: InsightSource.ANSWER,
        shortInsightText: null, // Only process insights that don't have short text yet
      },
    });
    
    if (allInsights.length > 0) {
      console.log(`Generating short text for ${allInsights.length} insights`);
      
      await processInParallel<Insight, void>(
        allInsights,
        async (insight) => {
          try {
            const result = await generateShortInsightText(insight);
            if (result) {
              const [shortText, usage] = result;
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
              totalUsage.completionTokens += usage.completion_tokens;

              // Update the insight with the generated short text
              await prisma.insight.update({
                where: { id: insight.id },
                data: { shortInsightText: shortText },
              });

              console.log(`Generated short text for insight ${insight.id}: "${shortText}" (from "${insight.insightText}")`);
            } else {
              console.error(`Failed to generate short text for insight ${insight.id}: "${insight.insightText}"`);
            }
          } catch (error) {
            console.error(`Error processing insight ${insight.id}:`, error);
          }
        },
        BATCH_COUNT
      );
    } else {
      console.log('No insights need short text generation, skipping short text generation phase');
    }
    if (GENERATE_SELF_COMPARISONS) {
      console.log('Generating insight comparisons within each question\'s answers...');
      
      // Get all questions that have multiple answer insights to compare
      const questionsToProcess = await prisma.question.findMany({
        include: {
          answers: {
            include: {
              insight: true,
            },
          },
        },
      });

      console.log(`Processing ${questionsToProcess.length} questions for self-comparisons`);

      await processInParallel<typeof questionsToProcess[0], void>(
        questionsToProcess,
        async (question) => {
          try {
            const result = await generateSelfInsightComparisons(question.id, (msg: string) => console.log(msg));
            if (result) {
              const [usage, strongComparisonCount] = result;
              totalUsage.promptTokens += usage.prompt_tokens;
              totalUsage.cachedPromptTokens += usage.prompt_tokens_details?.cached_tokens || 0;
              totalUsage.completionTokens += usage.completion_tokens;
            }
          } catch (err) {
            console.error(`Error processing question ${question.id} for self-comparisons:`, err);
          }
        },
        BATCH_COUNT
      );
    }
    if (GENERATE_ALL_COMPARISONS) {
      console.log('Generating insight comparisons for strong category overlaps (by relevant categories)...');

      const answerInsights = await prisma.insight.findMany({ where: { source: InsightSource.ANSWER } });
      await processInParallel<Insight, void>(
        answerInsights,
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
                      console.log(`Presentation: ${presentation.presentationTitle}: ${presentation.conciseAText} <-> ${presentation.conciseBText} (Importance: ${presentation.importance})`);
                    }
                  } catch (err) {
                    console.error(`Error generating presentation for comparison ${comparison.id}`, err);
                  }
                } else {
                  //console.log(`Compared: ${comparison.insightAId} <-> ${comparison.insightBId} | ${comparison.polarity} ${comparison.overlap}`);
                }
              }
            }
          } catch (err) {
            console.error(`Error processing insight ID: ${insight.id} for category overlap comparisons`, err);
          }
        },
        BATCH_COUNT
      );
    }

    // Import conversation starters
    await handleConversationStarterImport(prisma);

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