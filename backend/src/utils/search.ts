import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SearchResult {
  type: 'question' | 'answer';
  questionId: number;
  questionText: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  persistentId: string; // Add persistentId field
  category: {
    id: number;
    category: string;
    subcategory: string;
    insightSubject: string;
  };
  inspirationInsight?: string; // Only for question matches
  answerText?: string; // Only for answer matches
  answerInsight?: string; // Only for answer matches
  answerInsightCategory?: {
    id: number;
    category: string;
    subcategory: string;
    insightSubject: string;
  };
  answerInsightPublishedTag?: string | null;
  explanation: string;
}

/**
 * Searches through all questions, answers, and insights using regex matching (with fallback to text matching)
 * @param searchQuery The search query text (can be a regex pattern)
 * @returns Array of search results
 */
export async function searchQuestionsAnswersInsights(searchQuery: string): Promise<SearchResult[]> {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }

  const query = searchQuery.trim();
  
  // Try to create a regex from the query, with case-insensitive flag
  let searchRegex: RegExp;
  let useRegex = false;
  
  try {
    // Attempt to compile as regex with case-insensitive flag
    searchRegex = new RegExp(query, 'i');
    useRegex = true;
  } catch (error) {
    // If regex compilation fails, fall back to simple text matching
    searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // Escape special chars
    useRegex = false;
  }
  
  // Get all questions with their answers and insights
  const allQuestions = await prisma.question.findMany({
    select: {
      id: true,
      questionText: true,
      publishedId: true,
      proposedQuestion: true,
      persistentId: true as any, // Add persistentId field
      inspiration: {
        select: {
          insightText: true,
          category: {
            select: {
              id: true,
              category: true,
              subcategory: true,
              insightSubject: true,
            },
          },
        },
      },
      answers: {
        select: {
          answerText: true,
          insight: {
            select: {
              insightText: true,
              publishedTag: true,
              category: {
                select: {
                  id: true,
                  category: true,
                  subcategory: true,
                  insightSubject: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      },
      category: {
        select: {
          id: true,
          category: true,
          subcategory: true,
          insightSubject: true,
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  const searchResults: SearchResult[] = [];

  for (const question of allQuestions) {
    // Check if question text or inspiration insight matches using regex
    const questionMatches = 
      searchRegex.test(question.questionText) ||
      searchRegex.test(question.inspiration.insightText);

    if (questionMatches) {
      searchResults.push({
        type: 'question',
        questionId: question.id,
        questionText: question.questionText,
        publishedId: question.publishedId,
        proposedQuestion: question.proposedQuestion,
        persistentId: (question as any).persistentId, // Add persistentId field
        category: question.category,
        inspirationInsight: question.inspiration.insightText,
        explanation: useRegex ? 'Regex match' : 'Text match',
      });
    }

    // Check each answer and its insight using regex
    for (const answer of question.answers) {
      const answerMatches = 
        searchRegex.test(answer.answerText) ||
        searchRegex.test(answer.insight.insightText);

      if (answerMatches) {
        searchResults.push({
          type: 'answer',
          questionId: question.id,
          questionText: question.questionText,
          publishedId: question.publishedId,
          proposedQuestion: question.proposedQuestion,
          persistentId: (question as any).persistentId, // Add persistentId field
          category: question.category,
          answerText: answer.answerText,
          answerInsight: answer.insight.insightText,
          answerInsightCategory: answer.insight.category,
          answerInsightPublishedTag: answer.insight.publishedTag,
          explanation: useRegex ? 'Regex match' : 'Text match',
        });
      }
    }
  }

  return searchResults;
} 