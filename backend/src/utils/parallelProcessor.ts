/**
 * Processes items in parallel with controlled concurrency
 * @param items Array of items to process
 * @param processor Function that processes a single item
 * @param concurrency Maximum number of concurrent operations
 * @returns Promise that resolves when all items are processed
 */
export async function processInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  const inProgress = new Set<Promise<void>>();
  let index = 0;

  // Process items until we've handled all of them
  while (index < items.length || inProgress.size > 0) {
    // Fill up the concurrency pool
    while (inProgress.size < concurrency && index < items.length) {
      const item = items[index++];
      const promise = (async () => {
        try {
          const result = await processor(item);
          results.push(result);
        } catch (error) {
          console.error('Error processing item:', error);
          throw error;
        }
      })();
      inProgress.add(promise);
      promise.finally(() => inProgress.delete(promise));
    }

    // Wait for at least one promise to complete if we're at max concurrency
    if (inProgress.size >= concurrency || index >= items.length) {
      await Promise.race(inProgress);
    }
  }

  return results;
} 