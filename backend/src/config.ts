// Configuration constants for AI generation processes

export const AI_GENERATION_CONFIG = {
  // Batch processing
  BATCH_COUNT: 20, // Default batch size for parallel processing
  
  // Insight generation targets
  MINIMUM_TARGET_INSIGHTS: 10,
  MAX_NEW_INSIGHTS_PER_GENERATION: 30,
  MIN_NEW_INSIGHTS_PER_GENERATION: 5,
  
  // Question generation probabilities
  BINARY_PROBABILITY: 0.65, // Default probability for generating binary questions
  
  // Feature flags for data generation
  GENERATE_ALL_COMPARISONS: false,
  GENERATE_SELF_COMPARISONS: false,
  REGENERATE_IMPORTED_QUESTIONS: true,
  IMPORT_QUESTIONS_FROM_CSV: true,
  IMPORT_AFTER_GENERATE: true,
  REDUCE_ANSWER_INSIGHT_REDUNDANCY: false,
} as const;