import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

interface CategoryFromCSV {
  category: string;
  topicHeader: string;
  subcategory: string;
  insightSubject: string;
  expandedHints: null
}

export function parseCategoriesFromCSV(): Promise<CategoryFromCSV[]> {
  const csvPath = path.join(__dirname, 'mvp-data', 'categories.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('Categories CSV file not found, skipping import');
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    const categories: CategoryFromCSV[] = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: any) => {
        // Skip empty rows or rows that start with comma
        if (!row.category || row.category.trim() === '') {
          return;
        }

        const category = {
          category: row.category?.trim() || '',
          topicHeader: row.topic_header === '-' ? '' : (row.topicHeader?.trim() || ''),
          subcategory: row.subcategory?.trim() || '',
          insightSubject: row.insight_subject?.trim() || '',
          expandedHints: null
        };

        // Filter out any with empty insight subjects
        if (category.insightSubject) {
          categories.push(category);
        }
      })
      .on('end', () => {
        resolve(categories);
      })
      .on('error', (error) => {
        console.error('Error parsing categories CSV:', error);
        reject(error);
      });
  });
}

// Extra categories that are not in the CSV or definitions of categories with expanded hints to override the CSV
export const EXTRA_CATEGORIES = [
  { category: 'Dating', topicHeader: 'Lifestyle', subcategory: 'Communication', insightSubject: 'Flirting style', expandedHints: null },
];