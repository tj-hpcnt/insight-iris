import * as fs from 'fs';
import * as path from 'path';

interface InsightFromCSV {
  category: string;
  subcategory: string;
  insightSubject: string;
  insightTag: string;
  isUsedForExplanation: boolean;
}

/**
 * Parses insights from the insights.csv file
 * @returns Array of insight data from CSV
 */
export function parseInsightsFromCSV(): InsightFromCSV[] {
  const csvPath = path.join(__dirname, 'mvp-data', 'insights.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('Insights CSV file not found, skipping import');
    return [];
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    console.log('No data rows in insights CSV');
    return [];
  }

  const headers = lines[0].split(',');
  const insights: InsightFromCSV[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 4) continue; // Skip incomplete rows
    
    const insight: InsightFromCSV = {
      category: values[0]?.trim() || '',
      subcategory: values[1]?.trim() || '', 
      insightSubject: values[2]?.trim() || '',
      insightTag: values[3]?.trim() || '',
      isUsedForExplanation: values[4]?.trim().toUpperCase() === 'TRUE'
    };

    // Skip rows with empty essential fields
    if (insight.category && insight.subcategory && insight.insightSubject && insight.insightTag) {
      insights.push(insight);
    }
  }

  return insights;
}

