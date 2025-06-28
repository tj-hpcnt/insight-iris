import { PrismaClient, Insight, Question, Answer } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Helper function to delete a question and all its cascading relationships within a transaction
 * @param tx The Prisma transaction context
 * @param question The question to delete (with answers and insights included)
 * @returns void
 */
export async function deleteQuestionWithCascade(
  tx: any, // Prisma transaction type
  question: {
    id: number;
    answers: Array<{
      insight: Insight | null;
    }>;
  }
): Promise<void> {
  // Get all answer insights for this question
  const answerInsights = question.answers.map(answer => answer.insight).filter(insight => insight !== null) as Insight[];
  
  // For each answer insight, check if it's referenced by other answers outside this question
  const orphanedAnswerInsights: Map<number, Insight> = new Map();
  for (const answerInsight of answerInsights) {
    const otherAnswerReferences = await tx.answer.count({
      where: {
        insightId: answerInsight.id,
        questionId: { not: question.id },
      },
    });

    if (otherAnswerReferences === 0) {
      // This answer insight is only referenced by answers from this question
      orphanedAnswerInsights.set(answerInsight.id, answerInsight);
    }
  }

  // Delete insight comparisons for orphaned answer insights
  for (const orphanedInsight of orphanedAnswerInsights.values()) {
    // Delete presentations first
    const comparisons = await tx.insightComparison.findMany({
      where: {
        OR: [
          { insightAId: orphanedInsight.id },
          { insightBId: orphanedInsight.id },
        ],
      },
    });

    for (const comparison of comparisons) {
      await tx.insightComparisonPresentation.deleteMany({
        where: { insightComparisonId: comparison.id },
      });
    }

    // Delete the comparisons themselves
    await tx.insightComparison.deleteMany({
      where: {
        OR: [
          { insightAId: orphanedInsight.id },
          { insightBId: orphanedInsight.id },
        ],
      },
    });
  }

  // Delete all answers for this question
  await tx.answer.deleteMany({
    where: { questionId: question.id },
  });

  // Delete orphaned answer insights
  for (const orphanedInsight of orphanedAnswerInsights.values()) {
    await tx.insight.delete({
      where: { id: orphanedInsight.id },
    });
  }

  // Delete the question itself
  await tx.question.delete({
    where: { id: question.id },
  });
}

/**
 * Deletes a complete question including its inspiration insight and all cascading relationships
 * @param questionId The ID of the question to delete
 * @returns void
 */
export async function deleteQuestion(questionId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get the question with its answers and insights
    const question = await tx.question.findUnique({
      where: { id: questionId },
      include: {
        answers: {
          include: {
            insight: true,
          }
        }
      }
    });

    if (!question) {
      throw new Error(`Question with ID ${questionId} not found`);
    }

    // Delete the question and its cascading relationships
    await deleteQuestionWithCascade(tx, question);

    // Delete the inspiration insight that generated this question
    if (question.inspirationId) {
      // Check if this inspiration insight is used by other questions
      const otherQuestions = await tx.question.count({
        where: {
          inspirationId: question.inspirationId,
          id: { not: questionId }
        }
      });

      if (otherQuestions === 0) {
        await tx.insight.delete({
          where: { id: question.inspirationId }
        });
      }
    }
  });
}

/**
 * Deletes a single answer and its associated insight if it becomes orphaned
 * @param answerId The ID of the answer to delete
 * @returns void
 */
export async function deleteAnswer(answerId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get the answer with its insight
    const answer = await tx.answer.findUnique({
      where: { id: answerId },
      include: {
        insight: true,
        question: true
      }
    });

    if (!answer) {
      throw new Error(`Answer with ID ${answerId} not found`);
    }

    // Check if the question will have enough answers remaining
    const remainingAnswers = await tx.answer.count({
      where: {
        questionId: answer.questionId,
        id: { not: answerId }
      }
    });

    if (remainingAnswers < 2) {
      throw new Error('Cannot delete answer: question must have at least 2 answers remaining');
    }

    // Delete the answer
    await tx.answer.delete({
      where: { id: answerId }
    });

    // Check if the insight is orphaned (no other answers reference it)
    if (answer.insight) {
      const otherAnswerReferences = await tx.answer.count({
        where: {
          insightId: answer.insight.id
        }
      });

      if (otherAnswerReferences === 0) {
        // Delete insight comparisons and presentations for this orphaned insight
        const comparisons = await tx.insightComparison.findMany({
          where: {
            OR: [
              { insightAId: answer.insight.id },
              { insightBId: answer.insight.id },
            ],
          },
        });

        for (const comparison of comparisons) {
          await tx.insightComparisonPresentation.deleteMany({
            where: { insightComparisonId: comparison.id },
          });
        }

        await tx.insightComparison.deleteMany({
          where: {
            OR: [
              { insightAId: answer.insight.id },
              { insightBId: answer.insight.id },
            ],
          },
        });

        // Delete the orphaned insight
        await tx.insight.delete({
          where: { id: answer.insight.id }
        });
      }
    }
  });
}

/**
 * Checks if a question can have individual answers deleted (has more than 2 answers)
 * @param questionId The ID of the question to check
 * @returns boolean indicating if answers can be deleted individually
 */
export async function canDeleteAnswersIndividually(questionId: number): Promise<boolean> {
  const answerCount = await prisma.answer.count({
    where: { questionId }
  });
  return answerCount > 2;
}

/**
 * Gets the number of answers for a question
 * @param questionId The ID of the question
 * @returns number of answers
 */
export async function getAnswerCount(questionId: number): Promise<number> {
  return await prisma.answer.count({
    where: { questionId }
  });
}

/**
 * Deletes a category and ALL its associated relationships recursively
 * This will delete all questions, answers, and insights in the category
 * @param categoryId The ID of the category to delete
 * @returns void
 */
export async function deleteCategory(categoryId: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get the category with all its questions and insights
    const category = await tx.category.findUnique({
      where: { id: categoryId },
      include: {
        questions: {
          include: {
            answers: {
              include: {
                insight: true,
              }
            }
          }
        },
        insights: true,
      }
    });

    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    // Delete all questions in this category (this will cascade to delete answers and orphaned insights)
    for (const question of category.questions) {
      await deleteQuestionWithCascade(tx, question);
    }

    // After deleting all questions, check for any remaining insights that belong to this category
    // and are not referenced by any answers from other categories
    const remainingInsights = await tx.insight.findMany({
      where: { categoryId: categoryId },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    for (const insight of remainingInsights) {
      // Check if this insight is referenced by answers from questions in other categories
      const hasExternalReferences = insight.answers.some(answer => 
        answer.question.categoryId !== categoryId
      );

      if (!hasExternalReferences) {
        // This insight is only used within this category, safe to delete
        
        // Delete insight comparisons first
        const comparisons = await tx.insightComparison.findMany({
          where: {
            OR: [
              { insightAId: insight.id },
              { insightBId: insight.id },
            ],
          },
        });

        for (const comparison of comparisons) {
          await tx.insightComparisonPresentation.deleteMany({
            where: { insightComparisonId: comparison.id },
          });
        }

        await tx.insightComparison.deleteMany({
          where: {
            OR: [
              { insightAId: insight.id },
              { insightBId: insight.id },
            ],
          },
        });

        // Delete the insight itself
        await tx.insight.delete({
          where: { id: insight.id }
        });
      }
    }

    // Delete category overlaps that reference this category
    await tx.categoryOverlap.deleteMany({
      where: {
        OR: [
          { categoryAId: categoryId },
          { categoryBId: categoryId }
        ]
      }
    });

    // Finally, delete the category itself
    await tx.category.delete({
      where: { id: categoryId }
    });
  });
}
