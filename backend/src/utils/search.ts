import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SearchResult {
  type: 'question' | 'answer';
  questionId: number;
  questionText: string;
  publishedId: string | null;
  proposedQuestion: string | null;
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
  answerInsightFirstCategory?: {
    id: number;
    category: string;
    subcategory: string;
    insightSubject: string;
  };
  answerInsightPublishedTag?: string | null;
  explanation: string;
}

/**
 * Searches through all questions, answers, and insights using simple text matching
 * @param searchQuery The search query text
 * @returns Array of search results
 */
export async function searchQuestionsAnswersInsights(searchQuery: string): Promise<SearchResult[]> {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }

  const query = searchQuery.trim().toLowerCase();
  
  // Get all questions with their answers and insights
  const allQuestions = await prisma.question.findMany({
    include: {
      inspiration: {
        include: {
          category: {
            select: {
              id: true,
              category: true,
              subcategory: true,
              insightSubject: true,
            },
          },
          firstCategory: {
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
        include: {
          insight: {
            include: {
              category: {
                select: {
                  id: true,
                  category: true,
                  subcategory: true,
                  insightSubject: true,
                },
              },
              firstCategory: {
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
    // Check if question text or inspiration insight matches
    const questionMatches = 
      question.questionText.toLowerCase().includes(query) ||
      question.inspiration.insightText.toLowerCase().includes(query);

    if (questionMatches) {
      searchResults.push({
        type: 'question',
        questionId: question.id,
        questionText: question.questionText,
        publishedId: question.publishedId,
        proposedQuestion: question.proposedQuestion,
        category: question.category,
        inspirationInsight: question.inspiration.insightText,
        explanation: '',
      });
    }

    // Check each answer and its insight
    for (const answer of question.answers) {
      const answerMatches = 
        answer.answerText.toLowerCase().includes(query) ||
        answer.insight.insightText.toLowerCase().includes(query);

      if (answerMatches) {
        searchResults.push({
          type: 'answer',
          questionId: question.id,
          questionText: question.questionText,
          publishedId: question.publishedId,
          proposedQuestion: question.proposedQuestion,
          category: question.category,
          answerText: answer.answerText,
          answerInsight: answer.insight.insightText,
          answerInsightCategory: answer.insight.category,
          answerInsightFirstCategory: answer.insight.firstCategory,
          answerInsightPublishedTag: answer.insight.publishedTag,
          explanation: '',
        });
      }
    }
  }

  return searchResults;
} 