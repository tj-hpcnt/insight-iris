import { PrismaClient, InsightSource, OverlapType } from '../src/generated/prisma/core';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const prisma = new PrismaClient();
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

    const insightsOutput = insights.map(ins => ({
      id: ins.id,
      category: ins.category.category,
      topic: ins.category.topicHeader,
      subcategory: ins.category.subcategory,
      insightSubject: ins.category.insightSubject,
      insightText: ins.insightText,
    }));

    fs.writeFileSync(
      path.join(baseDir, 'inspirations.json'),
      JSON.stringify(insightsOutput, null, 2)
    );
    console.log(`Wrote ${insightsOutput.length} inspirations to ${baseDir}/inspirations.json`);

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