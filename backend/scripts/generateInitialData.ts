import { PrismaClient, InsightSource, Category, Insight } from '../src/generated/prisma/core';
import * as dotenv from 'dotenv';
import { generateInspirationInsights, generateBaseQuestion, generateCategoryOverlap, reassignCategory, generateInsightComparison } from '../src/utils/aiGenerators';
import { CATEGORIES } from './categories';
import { FIXED_STYLES } from './styles';
import { processInParallel } from '../src/utils/parallelProcessor';

dotenv.config();
const prisma = new PrismaClient();
const BATCH_COUNT = 10;

async function main() {
  try {
    const categories = await prisma.category.findMany();
    // Insert categories from CATEGORIES constant
    if (categories.length == 0) {
      console.log('Inserting categories...');
      for (const categoryData of CATEGORIES) {
        const category = await prisma.category.create({
          data: categoryData,
        });
        categories.push(category);
        console.log(`Created category: ${category.category} - ${category.topicHeader} - ${category.subcategory} - ${category.insightSubject}`);
      }
    }
    const styles = await prisma.style.findMany();
    // Create fixed styles
    if (styles.length == 0) {
      console.log('Creating styles...');
      for (const [name, description] of Object.entries(FIXED_STYLES) as Array<[string, string]>) {
        const style = await prisma.style.create({
          data: {
            name,
            description
          },
        });
        styles.push(style);
        console.log(`Created style ${name}: ${description.substring(0, 50)}...`);
      }
    }

    let totalUsage = {
      promptTokens: 0,
      cachedPromptTokens: 0,
      completionTokens: 0,
    };

    // Start periodic logging of token usage every 5 seconds
    const usageLogger = setInterval(() => {
      console.log(
        `accumulated tokens - in:${totalUsage.promptTokens} cached:${totalUsage.cachedPromptTokens} out:${totalUsage.completionTokens}`
      );
    }, 5000);

    const overlaps = await prisma.categoryOverlap.findMany();
    //generate the pairs of category ids to process
    const categoryPairs = [];
    for (let i = 0; i < categories.length; i++) {
      for (let j = i; j < categories.length; j++) {
        categoryPairs.push([categories[i], categories[j]]);
      }
    }
    console.log('Generating category overlaps...');
    for (const pair of categoryPairs) {
      const [categoryA, categoryB] = pair
      let existing = await prisma.categoryOverlap.findFirst({ where: { categoryAId: categoryA.id, categoryBId: categoryB.id } });
      if (existing) {
        continue;
      }
      const [overlap, usage] = await generateCategoryOverlap(categoryA, categoryB);
      overlaps.push(overlap);
      totalUsage.promptTokens += usage.prompt_tokens;
      totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
      totalUsage.completionTokens += usage.completion_tokens;
      console.log(`${categoryA.category}:${categoryA.subcategory}:${categoryA.insightSubject} - ${categoryB.category}:${categoryB.subcategory}:${categoryB.insightSubject} - ${overlap?.overlap}`);
    }

    const insights = await prisma.insight.findMany();
    // Generate insights for each category using the new utility function
    console.log('Generating insights...');
    await processInParallel<Category, void>(
      categories,
      async (category) => {
        var totalInsights = await prisma.insight.count({ where: { categoryId: category.id, source: InsightSource.INSPIRATION } });
        let done = false;
        while (!done && totalInsights < 10) {
          const [newInsights, isDone, usage] = await generateInspirationInsights(category, 5);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          insights.push(...newInsights);
          totalInsights += newInsights.length;
          done = isDone;
          console.log(`Generated ${newInsights.length} insights for category: ${category.insightSubject} (total: ${totalInsights})`);
          console.log(`${newInsights.map(i => i.insightText).join('\n')}`);
        }
      },
      BATCH_COUNT
    );

    // Generate questions for each insight and style combination
    console.log('Generating questions...');
    const style = styles.find(s => s.description.indexOf("cheeky") >= 0);
    insights.sort(() => Math.random() - 0.5);

    await processInParallel<Insight, void>(
      insights,
      async (insight) => {
        try {
          if (insight.source != InsightSource.INSPIRATION) {
            return;
          }
          if (await prisma.question.findFirst({ where: { inspirationId: insight.id } })) {
            return;
          }
          const category = categories.find(c => c.id === insight.categoryId);
          if (!category) return;

          const [question, answers, insights, usage] = await generateBaseQuestion(insight);
          totalUsage.promptTokens += usage.prompt_tokens;
          totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
          totalUsage.completionTokens += usage.completion_tokens;
          console.log(`Generated ${question.questionType} question for insight: ${insight.insightText}`);
          console.log(`${question.questionText}`);
          console.log(`${answers.map(a => a.answerText).join('|||')}`);
          console.log(`${insights.map(i => i.insightText).join('|||')}`);
        } catch (err) {
          console.error(`Error processing insight ID: ${insight.id}`, err);
        }
      },
      BATCH_COUNT
    );

    // reassign the category for the inspiration insights
    console.log('Reassigning category for inspiration insights...');
    const inspirationInsights = insights.filter(insight => insight.source === InsightSource.INSPIRATION);
    
    await processInParallel<Insight, void>(
      inspirationInsights,
      async (insight) => {
        const originalCategory = await prisma.category.findFirst({ where: { id: insight.categoryId } });
        const [category, usage] = await reassignCategory(insight);
        if (category.id == originalCategory.id) {
          return;
        }
        console.log(`Reassigned category for insight: ${insight.insightText} from ${originalCategory?.insightSubject} to ${category?.insightSubject}`);
        totalUsage.promptTokens += usage.prompt_tokens;
        totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
        totalUsage.completionTokens += usage.completion_tokens;
      },
      BATCH_COUNT
    );

    // Generate insight comparisons for pairs with strong category overlap
    console.log('Generating insight comparisons for strong category overlaps...');
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    const categoryOverlapMap = new Map(overlaps.map(o => [o.categoryAId + '_' + o.categoryBId, o]));
    
    // Get all pairs of insights in different categories, and collect strong category relations
    const insightPairs: [Insight, Insight][] = [];
    for (let i = 0; i < insights.length; i++) {
      const a = insights[i];
      if (a.source != InsightSource.INSPIRATION) continue;
      for (let j = i; j < insights.length; j++) {
        const b = insights[j];
        if (b.source != InsightSource.INSPIRATION) continue;
        const categoryAId = Math.min(a.categoryId, b.categoryId);
        const categoryBId = Math.max(a.categoryId, b.categoryId);
        const overlap = categoryOverlapMap.get(categoryAId + '_' + categoryBId) as typeof overlaps[number];
        if (overlap.overlap != 'STRONG') continue;
        insightPairs.push([a, b]);
      }
    }
    insightPairs.sort(() => Math.random() - 0.5);
    console.log(`Found ${insightPairs.length} insight pairs`);

    await processInParallel<[Insight, Insight], void>(
      insightPairs,
      async ([insightA, insightB]) => {
        //swap insight a and b if their ids are out of order to maximize caching
        if (insightA.id > insightB.id) {
          [insightA, insightB] = [insightB, insightA];
        }
        // Skip if already compared
        const existing = await prisma.insightComparison.findFirst({
          where: {
            insightAId: insightA.id,
            insightBId: insightB.id,
          },
        });
        if (existing) return;

        console.log(`Comparing ${JSON.stringify(insightA)} and ${JSON.stringify(insightB)}`);
        // Query for a strong overlap between the categories
        const overlap = await prisma.categoryOverlap.findFirst({
          where: {
            categoryAId: Math.min(insightA.categoryId, insightB.categoryId), 
            categoryBId: Math.max(insightA.categoryId, insightB.categoryId),
            overlap: 'STRONG',
          }
        });
        if (!overlap) return;

        try {
          const comparisonResult = await generateInsightComparison(insightA, insightB);
          if (comparisonResult) {
            const [comparison, usage] = comparisonResult;
            totalUsage.promptTokens += usage.prompt_tokens;
            totalUsage.cachedPromptTokens += usage.prompt_tokens_details.cached_tokens;
            totalUsage.completionTokens += usage.completion_tokens;
            console.log(`Compared: ${insightA.insightText} <-> ${insightB.insightText}`);
            if (comparison != null) {
              console.log(`${comparison.polarity} ${comparison.overlap} ${comparison.presentation}`);
              console.log(`${comparison.presentationTitle}: ${comparison.conciseAText} <-> ${comparison.conciseBText}`);
            }
          }
        } catch (err) {
          console.error(`Error comparing insights ${insightA.id} and ${insightB.id}`, err);
        }
      },
      BATCH_COUNT
    );

    clearInterval(usageLogger);
    console.log('Data generation completed successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 