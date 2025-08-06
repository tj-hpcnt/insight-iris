import * as fs from 'fs';
import * as csv from 'csv-parser';
import { QuestionType, PrismaClient, InsightSource, Category, Insight, InsightDirection } from '@prisma/client';
import * as path from 'path';
import { fixIllegalEnumCharacters, generateInsightTextFromImportedQuestion, regenerateImportedQuestion } from '../src/utils/aiGenerators';
import { processInParallel } from '../src/utils/parallelProcessor';
import { AI_GENERATION_CONFIG } from '../src/config';

export interface QuestionCSVRow {
  question_id: string;
  conversation_starter_id: string;
  subcategory: string;
  insight_subject: string;
  insight_direction: string;
  question_stem: string;
  question_type: string;
  status: string;
  image_per_row: string;
  multi_select: string;
  used_for_conversation_starters: string;
  used_on_day_0: string;
  question_order_per_subcategory: string;
  [key: string]: string; // For variable answer columns
}

export interface MappingCSVRow {
  source: string;
  question_id: string;
  insight_subject: string;
  insight_direction: string;
  raw_value_stem: string;
  descriptor_interest_id: string;
  raw_value_answer_option: string;
  mapped_to_insight_tag: string;
  insight_tag_suggestions: string;
}

export interface StarterCSVRow {
  question_id: string;
  conversation_starter_id: string;
  question_type: string;
  question_stem: string;
  module_header: string;
}

export interface ExampleQuestion {
  question: string;
  answers: string[];
  insights: string[];
  type: 'BINARY' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
}

// Load example questions at script load time and cache in memory
const loadExampleQuestions = (): { [key: string]: ExampleQuestion[] } => {
  const exampleQuestions: { [key: string]: ExampleQuestion[] } = {
    BINARY: [],
    SINGLE_CHOICE: [],
    MULTIPLE_CHOICE: []
  };

  const files = [
    { path: 'example_binary.jsonl', type: 'BINARY' },
    { path: 'example_single_choice.jsonl', type: 'SINGLE_CHOICE' },
    { path: 'example_multiple_choice.jsonl', type: 'MULTIPLE_CHOICE' }
  ];

  files.forEach(({ path: fileName, type }) => {
    const filePath = path.join(__dirname, 'mvp-data', fileName);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.trim().split('\n');
      
      lines.forEach(line => {
        if (line.trim()) {
          const question = JSON.parse(line) as ExampleQuestion;
          exampleQuestions[type].push(question);
        }
      });
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
    }
  });

  return exampleQuestions;
};

// Cache the example questions at module load time
const CACHED_EXAMPLE_QUESTIONS = loadExampleQuestions();

export function pickSampleQuestions(totalCount: number, allowedTypes?: Array<'BINARY' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'>): string {
  // If no specific types are provided, use all types
  const types = allowedTypes || ['BINARY', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE'];
  
  const questionsPerType = Math.floor(totalCount / types.length);
  const remainder = totalCount % types.length;
  
  const selectedQuestions: ExampleQuestion[] = [];
  
  types.forEach((type, index) => {
    const questions = CACHED_EXAMPLE_QUESTIONS[type];
    const countForThisType = questionsPerType + (index < remainder ? 1 : 0);
    
    if (questions.length > 0) {
      // Randomly sample questions from this type
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      const sampled = shuffled.slice(0, Math.min(countForThisType, questions.length));
      selectedQuestions.push(...sampled);
    }
  });
  
  // Shuffle the final selection to mix the types
  const finalSelection = selectedQuestions.sort(() => 0.5 - Math.random());
  
  // Format as strings separated by \n
  return finalSelection.map(q => {
    const answersStr = q.answers.join(', ');
    const insightsStr = q.insights.join(' | ');
    return `${q.question}\nType: ${q.type}\nAnswers: ${answersStr}\nInsights: ${insightsStr}`;
  }).join('\n\n');
}

export async function parseQuestionsFromCSV(): Promise<QuestionCSVRow[]> {
  const csvPath = path.join(__dirname, 'mvp-data', 'questions.csv');
  return new Promise((resolve, reject) => {
    const results: QuestionCSVRow[] = [];
    fs.createReadStream(csvPath)
    .pipe(csv({ mapHeaders: ({ header, index }) => header == '' ? "h" + index : header.replace(/\s*\([^)]*\)/g, '')}))
    .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
    }).then((results : QuestionCSVRow[]) => {
      results.forEach(result => {
        result.question_stem = result.question_stem.trim()
        result.question_stem = fixIllegalEnumCharacters(result.question_stem)
      })
      return results
    });
  }

export async function parseMappingFromCSV(): Promise<MappingCSVRow[]> {
  const csvPath = path.join(__dirname, 'mvp-data', 'mapping.csv');
  return new Promise((resolve, reject) => {
    const results: MappingCSVRow[] = [];
    fs.createReadStream(csvPath)
      .pipe(csv({ mapHeaders: ({ header, index }) => header == '' ? "h" + index : header.replace(/\s*\([^)]*\)/g, '')}))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  }).then((results : MappingCSVRow[]) => {
    results.forEach(result => {
      result.raw_value_stem = result.raw_value_stem.trim()
      result.raw_value_answer_option = result.raw_value_answer_option.trim()
    })
    return results
  });
}

export function parseQuestionType(typeStr: string, multi_select: string): QuestionType {
  switch (typeStr) {
    case 'BINARY_TEXT':
    case 'BINARY_IMAGE':
      return QuestionType.BINARY;
    case 'MCQ_TEXT':
    case 'MCQ_IMAGE':
      return multi_select == "TRUE" ? QuestionType.MULTIPLE_CHOICE : QuestionType.SINGLE_CHOICE;
    default:
      return multi_select == "TRUE" ? QuestionType.MULTIPLE_CHOICE : QuestionType.SINGLE_CHOICE;
  }
}

export function extractAnswersFromRow(questionRow: QuestionCSVRow): string[] {
  const answers: string[] = [];
  const keys = Object.keys(questionRow);
  const answerStartIndex = keys.indexOf('question_order_per_subcategory') + 1;

  for (let i = answerStartIndex; i < keys.length; i++) {
    const key = keys[i];
    const value = questionRow[key];
    if (value && value.trim() && value !== 'nan' && !key.includes('ondevice_model_tags')) {
      answers.push(value.trim());
    }
  }

  return answers;
}

export async function parseStartersFromCSV(): Promise<StarterCSVRow[]> {
  const csvPath = path.join(__dirname, 'mvp-data', 'starters.csv');
  return new Promise((resolve, reject) => {
    const results: StarterCSVRow[] = [];
    fs.createReadStream(csvPath)
      .pipe(csv({ mapHeaders: ({ header, index }) => header == '' ? "h" + index : header.replace(/\s*\([^)]*\)/g, '')}))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  }).then((results: StarterCSVRow[]) => {
    results.forEach(result => {
      result.question_stem = result.question_stem.trim();
      result.question_stem = fixIllegalEnumCharacters(result.question_stem);
      result.module_header = result.module_header.trim();
    });
    return results;
  });
}

export async function parseProposedQuestions(): Promise<string[]> {
  const proposedQuestionsPath = path.join(__dirname, 'mvp-data', 'proposedQuestions.txt');
  try {
    const fileContent = fs.readFileSync(proposedQuestionsPath, 'utf-8');
    const questions = fileContent
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0); // Filter out empty lines
    
    return questions;
  } catch (error) {
    console.error('Error reading proposed questions file:', error);
    return [];
  }
}

export async function handleConversationStarterImport(prisma: PrismaClient): Promise<void> {
  console.log('Importing conversation starters from CSV...');
  
  try {
    const startersData = await parseStartersFromCSV();
    console.log(`Loaded ${startersData.length} conversation starters from CSV`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const starterRow of startersData) {
      try {
        // Find the question by matching the originalQuestion field with question_stem
        const question = await prisma.question.findFirst({
          where: {
            originalQuestion: starterRow.question_stem,
            conversationStarter: false
          }
        });

        if (!question) {
          console.warn(`Question not found for starter: ${starterRow.question_id} - "${starterRow.question_stem}"`);
          errors++;
          continue;
        }

        // Check if conversation starter already exists for this question
        const existingStarter = await prisma.conversationStarter.findUnique({
          where: {
            questionId: question.id
          }
        });

        if (existingStarter) {
          console.log(`Conversation starter already exists for question: ${question.originalQuestion}`);
          skipped++;
          continue;
        }

        // Create the conversation starter with both originalModuleHeading and moduleHeading set
        await prisma.conversationStarter.create({
          data: {
            questionId: question.id,
            starterId: starterRow.conversation_starter_id,
            originalModuleHeading: starterRow.module_header,
            moduleHeading: starterRow.module_header, // Set both fields to the same value
          }
        });

        // Update the question to set the conversationStarter flag to true
        await prisma.question.update({
          where: { id: question.id },
          data: { conversationStarter: true }
        });

        console.log(`Created conversation starter for question "${starterRow.question_stem}" with module heading: "${starterRow.module_header}"`);
        imported++;

      } catch (error) {
        console.error(`Error processing starter for question ${starterRow.question_id}:`, error);
        errors++;
      }
    }

    console.log(`\nConversation starters import completed:`);
    console.log(`- Imported: ${imported}`);
    console.log(`- Skipped (already exists): ${skipped}`);
    console.log(`- Errors: ${errors}`);
    console.log(`- Total processed: ${startersData.length}`);

  } catch (error) {
    console.error('Error importing conversation starters:', error);
  }
}

// Extract configuration constants
const {
  BATCH_COUNT,
  IMPORT_QUESTIONS_FROM_CSV,
  REGENERATE_IMPORTED_QUESTIONS,
} = AI_GENERATION_CONFIG;

export async function handleQuestionImport(
  prisma: PrismaClient,
  categories: Category[], 
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
          publishedId: questionRow.question_id,
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