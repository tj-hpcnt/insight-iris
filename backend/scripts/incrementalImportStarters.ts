import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { handleConversationStarterImport, handleQuestionImport } from './questions';
import { parseCategoriesFromCSV } from './categories';

dotenv.config();
const prisma = new PrismaClient();

async function importConversationStarters() {
  try {
    console.log('Starting import process...');
    
    // First, load categories needed for question import
    console.log('Loading categories...');
    let categories = await prisma.category.findMany();
    console.log(`Loaded ${categories.length} categories`);
    
    // Initialize usage tracking
    let totalUsage = {
      promptTokens: 0,
      cachedPromptTokens: 0,
      completionTokens: 0,
    };
    
    // First, import any missing questions (this handles duplicate question stems)
    console.log('Starting question import to handle any missing questions...');
    await handleQuestionImport(prisma, categories, totalUsage);
    
    // Then, import conversation starters
    console.log('Starting conversation starters import...');
    await handleConversationStarterImport(prisma);
    
    console.log('Import process completed successfully!');
    console.log(`Total usage: ${totalUsage.promptTokens} prompt tokens, ${totalUsage.completionTokens} completion tokens`);
    
  } catch (error) {
    console.error('Error during import process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importConversationStarters();