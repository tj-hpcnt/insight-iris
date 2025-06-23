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