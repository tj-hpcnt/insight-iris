import { PrismaClient as CachePrismaClient } from '../../src/generated/prisma/cache';

const cachePrisma = new CachePrismaClient();

/**
 * Fetches a cached embedding from the database
 * @param model The model used for the embedding
 * @param text The text that was embedded
 * @returns The cached embedding if found, null otherwise
 */
export async function fetchCachedEmbedding(
  model: string,
  text: string
): Promise<number[] | null> {
  const cached = await cachePrisma.cache.findFirst({
    where: {
      model,
      prompt: text,
    },
  });

  if (!cached) {
    return null;
  }

  return JSON.parse(cached.output) as number[];
}

/**
 * Caches an embedding in the database
 * @param model The model used for the embedding
 * @param text The text that was embedded
 * @param embedding The embedding result from OpenAI
 */
export async function cacheEmbedding(
  model: string,
  text: string,
  embedding: number[]
) {
  await cachePrisma.cache.create({
    data: {
      model,
      prompt: text,
      format: JSON.stringify({ type: 'embedding' }),
      output: JSON.stringify(embedding),
    },
  });
} 