import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { fixIllegalEnumCharacters } from '../src/utils/aiGenerators';

interface InsightFromCSV {
  category: string;
  subcategory: string;
  insightSubject: string;
  insightTag: string;
}

/**
 * Parses insights from the insights.csv file
 * @returns Array of insight data from CSV
 */
export function parseInsightsFromCSV(): Promise<InsightFromCSV[]> {
  const csvPath = path.join(__dirname, 'mvp-data', 'insights.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('Insights CSV file not found, skipping import');
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    const insights: InsightFromCSV[] = [];

    fs.createReadStream(csvPath)
    .pipe(csv({ mapHeaders: ({ header, index }) => header == '' ? "h" + index : header.replace(/\s*\([^)]*\)/g, '')}))
    .on('data', (row: any) => {

        // Map CSV columns to our interface
        const insight: InsightFromCSV = {
          category: row['category'].trim() || '',
          subcategory: row['subcategory'].trim() || '',
          insightSubject: row.insight_subject?.trim() || '',
          insightTag: row.insight_tag?.trim() || '',
        };

        // Skip rows with empty essential fields
        if (insight.category && insight.subcategory && insight.insightSubject && insight.insightTag) {
          insights.push(insight);
        }
      })
      .on('end', () => {
        resolve(insights);
      })
      .on('error', (error) => {
        console.error('Error parsing insights CSV:', error);
        reject(error);
      });
    });
}