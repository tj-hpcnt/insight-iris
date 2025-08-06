import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { handleConversationStarterImport } from './questions';

dotenv.config();
const prisma = new PrismaClient();

async function importConversationStarters() {
  try {
    console.log('Starting conversation starters import...');
    await handleConversationStarterImport(prisma);
  } catch (error) {
    console.error('Error importing conversation starters:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importConversationStarters();