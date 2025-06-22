import * as fs from 'fs';
import * as path from 'path';

export function parseCategoriesFromCSV(): Array<{category: string, topicHeader: string, subcategory: string, insightSubject: string, expandedHints: null}> {
  const csvPath = path.join(__dirname, 'mvp-data', 'categories.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  return lines
    .filter(line => line.trim() && !line.startsWith(',')) // Filter out empty lines
    .map(line => {
      const [category, topicHeader, subcategory, , , insightSubject] = line.split(',');
      return {
        category: category.trim(),
        topicHeader: topicHeader === '-' ? '' : topicHeader.trim(),
        subcategory: subcategory.trim(),
        insightSubject: insightSubject.trim(),
        expandedHints: null
      };
    })
    .filter(cat => cat.insightSubject); // Filter out any with empty insight subjects
}

// Extra categories that are not in the CSV or definitions of categories with expanded hints to override the CSV
export const EXTRA_CATEGORIES = [
  { category: 'Dating', topicHeader: 'Lifestyle', subcategory: 'Communication', insightSubject: 'Flirting style', expandedHints: null },
];