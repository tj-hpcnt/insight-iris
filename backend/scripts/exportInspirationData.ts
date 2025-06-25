import { PrismaClient, InsightSource, OverlapType, Insight, Category } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { fetchCachedEmbedding, cacheEmbedding } from '../src/utils/embeddingCaching';
import { processInParallel } from '../src/utils/parallelProcessor';
import * as dotenv from 'dotenv';

dotenv.config();

const BATCH_COUNT = 10;

async function main() {
  const prisma = new PrismaClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    // compute a unique timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = path.join(process.cwd(), 'src', 'generated', 'embedding', timestamp);
    fs.mkdirSync(baseDir, { recursive: true });

    // Fetch all inspiration insights
    const insights = await prisma.insight.findMany({
      where: { source: InsightSource.ANSWER },
      include: { category: true },
    });

    // Get embeddings for insights
    const insightsOutput = await processInParallel(
      insights,
      async (ins) => {
        const text = ins.insightText;
        let embedding = await fetchCachedEmbedding('text-embedding-3-small', text);
        if (!embedding) {
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
          });
          embedding = response.data[0].embedding;
          console.log(`Cached embedding for ${text}`);
          await cacheEmbedding('text-embedding-3-small', text, embedding);
        }
        return {
          id: ins.id,
          category: ins.category.category,
          subcategory: ins.category.subcategory,
          insightSubject: ins.category.insightSubject,
          insightText: ins.insightText,
          embedding: embedding,
        };
      },
      BATCH_COUNT
    );

    fs.writeFileSync(
      path.join(baseDir, 'inspirations.json'),
      JSON.stringify(insightsOutput, null, 2)
    );
    console.log(`Wrote ${insightsOutput.length} inspirations with embeddings to ${baseDir}/inspirations.json`);

    // Fetch all STRONG comparisons between inspiration insights with presentations
    const comparisons = await prisma.insightComparison.findMany({
      where: { overlap: OverlapType.STRONG },
      include: {
        presentation: true,
        insightA: { select: { source: true } },
        insightB: { select: { source: true } },
      },
    });

    const strongInspComparisons = comparisons
      .filter(c => c.presentation && c.insightA.source === InsightSource.ANSWER && c.insightB.source === InsightSource.ANSWER)
      .map(c => ({
        insightAId: c.insightAId,
        insightBId: c.insightBId,
        importance: c.presentation!.importance,
        polarity: c.polarity == "NEGATIVE" ? -1 : 1,
        overlapTitle: c.presentation!.presentationTitle,
        overlapConciseTextA: c.presentation!.conciseAText,
        overlapConciseTextB: c.presentation!.conciseBText,
      }));

    fs.writeFileSync(
      path.join(baseDir, 'comparisons.json'),
      JSON.stringify(strongInspComparisons, null, 2)
    );
    console.log(`Wrote ${strongInspComparisons.length} comparisons to ${baseDir}/comparisons.json`);
  } catch (error) {
    console.error('Error exporting inspiration data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 