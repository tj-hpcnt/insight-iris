import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const cachePrisma = new PrismaClient();

/**
 * Fetches a cached prompt execution from the database
 * @param model The model used for the completion
 * @param messages The messages sent to the model
 * @param format The response format used
 * @returns The cached completion result if found, null otherwise
 */
export async function fetchCachedExecution(
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  format: { type: string; json_schema: any }
): Promise<OpenAI.Chat.Completions.ChatCompletion | null> {
  const cached = await cachePrisma.cache.findFirst({
    where: {
      model,
      prompt: JSON.stringify(messages),
      format: JSON.stringify(format),
    },
  });

  if (!cached) {
    return null;
  }

  return JSON.parse(cached.output) as OpenAI.Chat.Completions.ChatCompletion;
}

/**
 * Caches the result of a prompt execution in the database
 * @param model The model used for the completion
 * @param messages The messages sent to the model
 * @param format The response format used
 * @param completion The completion result from OpenAI
 */
export async function cachePromptExecution(
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  format: { type: string; json_schema: any },
  completion: OpenAI.Chat.Completions.ChatCompletion
) {
  await cachePrisma.cache.create({
    data: {
      model,
      prompt: JSON.stringify(messages),
      format: JSON.stringify(format),
      output: JSON.stringify(completion),
    },
  });
} 