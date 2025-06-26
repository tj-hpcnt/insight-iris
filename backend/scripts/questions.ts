import * as fs from 'fs';
import * as csv from 'csv-parser';
import { QuestionType } from '@prisma/client';
import * as path from 'path';
import { fixIllegalEnumCharacters } from '../src/utils/aiGenerators';

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
    return `[${q.type}] ${q.question}\nAnswers: ${answersStr}\nInsights: ${insightsStr}`;
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