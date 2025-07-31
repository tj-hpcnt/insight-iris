import React, { useEffect, useState } from 'react';
import QuestionIdChip from './QuestionIdChip';
import PublishedTagChip from './PublishedTagChip';
import CategoryChip from './CategoryChip';
import AnswerCountChip from './AnswerCountChip';
import ShortInsightChip from './ShortInsightChip';

export type InsightType = 'inspiration' | 'answers'; // This matches the frontend logic

// Interface for category information
interface CategoryInfo {
  id: number;
  category: string;
  subcategory: string;
  insightSubject: string;
}

// Interface for the question data from the new unified API
interface QuestionFromAPI {
  id: number;
  questionText: string;
  isImageQuestion?: boolean;
  publishedId: string | null;
  proposedQuestion: string | null;
  persistentId: string; // Add persistentId field
  approved: boolean;
  firstDays: boolean;
  conversationStarter: boolean;
  category: CategoryInfo;
  inspiration: {
    id: number;
    insightText: string;
    shortInsightText: string | null | undefined;
    publishedTag: string | null;
    source: string;
    category: CategoryInfo;
  };
  answers: {
    id: number;
    answerText: string;
    insight: {
      id: number;
      insightText: string;
      shortInsightText: string | null | undefined;
      publishedTag: string | null;
      source: string;
      category: CategoryInfo;
    };
  }[];
}

// Interface for what the table will display - now unified for both tabs
interface QuestionDisplay {
  id: number; // This will be the insight ID for clicking purposes
  questionId: number; // The question ID for navigation
  questionText: string;
  isImageQuestion?: boolean;
  publishedId: string | null;
  proposedQuestion: string | null;
  persistentId: string; // Add persistentId field
  approved: boolean;
  firstDays: boolean;
  conversationStarter: boolean;
  insightText: string;
  shortInsightText: string | null | undefined;
  publishedTag: string | null;
  source: string;
  answerText?: string; // Only used for answer insights tab
  questionCategory: CategoryInfo;
  insightCategory: CategoryInfo;
}

interface InsightTableProps {
  categoryId?: number; // Made optional to support all categories view
  insightType: InsightType; // 'inspiration' or 'answers'
  approved?: boolean; // Filter for approved/unapproved questions
  firstDays?: boolean; // Filter for firstDays/not firstDays questions
  conversationStarter?: boolean; // Filter for conversation starter questions
  onInsightClick: (questionId: number) => void; // Changed to questionId
  onInsightTypeChange: (type: InsightType) => void;
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
  onRefresh?: () => void;
  refreshTrigger?: number; // Add refresh trigger prop
}

const InsightTable: React.FC<InsightTableProps> = ({ 
  categoryId, 
  insightType,
  approved,
  firstDays,
  conversationStarter,
  onInsightClick, 
  onInsightTypeChange, 
  onCategoryClick,
  onRefresh,
  refreshTrigger
}) => {
  const [questions, setQuestions] = useState<QuestionFromAPI[]>([]);
  const [displayData, setDisplayData] = useState<QuestionDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [insightAnswerCounts, setInsightAnswerCounts] = useState<Map<number, number>>(new Map());
  const [insightToQuestionsMap, setInsightToQuestionsMap] = useState<Map<number, Array<{ id: number; questionText: string; publishedId: string | null; proposedQuestion: string | null; category: CategoryInfo; isImageQuestion?: boolean }>>>(new Map());
  const [answerCounts, setAnswerCounts] = useState<Map<number, number>>(new Map());
  const [deleting, setDeleting] = useState<{ type: 'question' | 'answer'; id: number } | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear existing data to prevent mixing old and new results
      setQuestions([]);
      setDisplayData([]);
      setInsightAnswerCounts(new Map());
      setInsightToQuestionsMap(new Map());
      setAnswerCounts(new Map());
      
      if (categoryId) {
        // Fetch questions for a specific category
        let url = `/api/categories/${categoryId}/questions`;
        const params = new URLSearchParams();
        if (approved !== undefined) {
          params.append('approved', approved.toString());
        }
        if (firstDays !== undefined) {
          params.append('firstDays', firstDays.toString());
        }
        if (conversationStarter !== undefined) {
          params.append('conversationStarter', conversationStarter.toString());
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: QuestionFromAPI[] = await response.json();
        setQuestions(data);
      } else {
        // Fetch questions from all categories
        const categoriesResponse = await fetch('/api/categories');
        if (!categoriesResponse.ok) {
          throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
        }
        
        const categories = await categoriesResponse.json();
        const allQuestions: QuestionFromAPI[] = [];
        
        for (const category of categories) {
          try {
            let url = `/api/categories/${category.id}/questions`;
            const params = new URLSearchParams();
            if (approved !== undefined) {
              params.append('approved', approved.toString());
            }
            if (firstDays !== undefined) {
              params.append('firstDays', firstDays.toString());
            }
            if (conversationStarter !== undefined) {
              params.append('conversationStarter', conversationStarter.toString());
            }
            if (params.toString()) {
              url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
              console.warn(`Failed to fetch questions for category ${category.id}: ${response.status}`);
              continue;
            }
            
            const questions: QuestionFromAPI[] = await response.json();
            allQuestions.push(...questions);
          } catch (error) {
            console.warn(`Error fetching questions for category ${category.id}:`, error);
          }
        }
        
        setQuestions(allQuestions);
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [categoryId, approved, firstDays, conversationStarter]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger === undefined) return;
    fetchQuestions();
  }, [refreshTrigger]);

  // Fetch answer counts for questions when questions change
  useEffect(() => {
    const fetchAnswerCounts = async () => {
      if (questions.length === 0) {
        setAnswerCounts(new Map());
        return;
      }
      
      console.log('Fetching answer counts for', questions.length, 'questions');
      
      const countPromises = questions.map(async (question) => {
        try {
          const response = await fetch(`/api/questions/${question.id}/answer-count`);
          if (response.ok) {
            const data = await response.json();
            console.log(`Question ${question.id} has ${data.count} answers`);
            return { questionId: question.id, count: data.count };
          } else {
            console.warn(`Failed to fetch answer count for question ${question.id}: ${response.status}`);
          }
        } catch (error) {
          console.warn(`Failed to fetch answer count for question ${question.id}:`, error);
        }
        // Default to the number of answers we already have in the data
        const fallbackCount = question.answers?.length || 0;
        console.log(`Using fallback count ${fallbackCount} for question ${question.id}`);
        return { questionId: question.id, count: fallbackCount };
      });
      
      const results = await Promise.all(countPromises);
      const newAnswerCounts = new Map();
      results.forEach(({ questionId, count }) => {
        newAnswerCounts.set(questionId, count);
      });
      console.log('Answer counts:', Array.from(newAnswerCounts.entries()));
      setAnswerCounts(newAnswerCounts);
    };
    
    fetchAnswerCounts();
  }, [questions]);

  useEffect(() => {
    // Transform the questions data based on the selected tab
    if (insightType === 'inspiration') {
      const inspirationData = questions.map(question => ({
        id: question.inspiration.id, // Use inspiration insight ID for clicking
        questionId: question.id,
        questionText: question.questionText,
        isImageQuestion: question.isImageQuestion,
        publishedId: question.publishedId,
        proposedQuestion: question.proposedQuestion,
        persistentId: question.persistentId, // Add persistentId field
        approved: question.approved,
        firstDays: question.firstDays,
        conversationStarter: question.conversationStarter,
        insightText: question.inspiration.insightText,
        shortInsightText: question.inspiration.shortInsightText,
        publishedTag: question.inspiration.publishedTag,
        source: question.inspiration.source,
        questionCategory: question.category,
        insightCategory: question.inspiration.category,
      }));
      setDisplayData(inspirationData);
      setInsightAnswerCounts(new Map()); // Clear counts for inspiration tab
      setInsightToQuestionsMap(new Map()); // Clear questions map for inspiration tab
    } else {
      // For answers tab, create one row per answer with its insight
      const answerData: QuestionDisplay[] = [];
      const insightToQuestionsMap = new Map<number, Array<{ id: number; questionText: string; publishedId: string | null; proposedQuestion: string | null; category: CategoryInfo; isImageQuestion?: boolean }>>();
      
      questions.forEach(question => {
        question.answers.forEach(answer => {
          // Track which questions reference each insight
          const insightId = answer.insight.id;
          if (!insightToQuestionsMap.has(insightId)) {
            insightToQuestionsMap.set(insightId, []);
          }
          
          // Add question info if it's not already there
          const existingQuestions = insightToQuestionsMap.get(insightId)!;
          if (!existingQuestions.find(q => q.id === question.id)) {
            existingQuestions.push({
              id: question.id,
              questionText: question.questionText,
              isImageQuestion: question.isImageQuestion,
              publishedId: question.publishedId,
              proposedQuestion: question.proposedQuestion,
              category: question.category
            });
          }
          
          answerData.push({
            id: answer.insight.id, // Use answer insight ID for clicking
            questionId: question.id,
            questionText: question.questionText,
            isImageQuestion: question.isImageQuestion,
            publishedId: question.publishedId,
            proposedQuestion: question.proposedQuestion,
            persistentId: question.persistentId, // Add persistentId field
            approved: question.approved,
            firstDays: question.firstDays,
            conversationStarter: question.conversationStarter,
            answerText: answer.answerText,
            insightText: answer.insight.insightText,
            shortInsightText: answer.insight.shortInsightText,
            publishedTag: answer.insight.publishedTag,
            source: answer.insight.source,
            questionCategory: question.category,
            insightCategory: answer.insight.category,
          });
        });
      });
      
      // Convert question arrays to counts
      const insightCounts = new Map<number, number>();
      insightToQuestionsMap.forEach((questionArray, insightId) => {
        insightCounts.set(insightId, questionArray.length);
      });
      
      setDisplayData(answerData);
      setInsightAnswerCounts(insightCounts);
      setInsightToQuestionsMap(insightToQuestionsMap);
    }
  }, [questions, insightType]);

  if (loading) return <p>Loading questions...</p>;
  if (error) return <p>Error loading questions: {error}</p>;

  const tabStyle = {
    display: 'flex',
    borderBottom: '2px solid #e0e0e0',
    marginBottom: '10px',
    backgroundColor: '#f8f9fa'
  };

  const tabButtonStyle = (isActive: boolean) => ({
    flex: 1,
    padding: '12px 24px',
    border: 'none',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: isActive ? '#007bff' : '#6c757d',
    fontWeight: isActive ? '600' : '400',
    fontSize: '16px',
    cursor: 'pointer',
    borderBottom: isActive ? '3px solid #007bff' : '3px solid transparent',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    top: isActive ? '2px' : '0px'
  });

  const tabButtonHoverStyle = {
    backgroundColor: '#e9ecef',
    color: '#495057'
  };

  const handleQuestionNavigation = (questionId: number, questionCategoryId: number) => {
    // If we're in a specific category view and navigating to a question in a different category
    if (categoryId && questionCategoryId !== categoryId) {
      // For now, just navigate to the question in the current category context
      // In a more complex implementation, you might want to switch categories first
      console.warn('Navigation to different category not fully implemented');
    }
    onInsightClick(questionId);
  };

  // Add delete functions
  const handleDeleteQuestion = async (questionId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    if (deleting) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this question? This will also delete the inspiration insight and cannot be undone.');
    if (!confirmed) return;
    
    try {
      setDeleting({ type: 'question', id: questionId });
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the data
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question: ' + (error as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAnswer = async (answerId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    if (deleting) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this answer? This will also delete the associated insight and cannot be undone.');
    if (!confirmed) return;
    
    try {
      setDeleting({ type: 'answer', id: answerId });
      const response = await fetch(`/api/answers/${answerId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      // Refresh the data
      if (onRefresh) {
        onRefresh();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to delete answer:', error);
      alert('Failed to delete answer: ' + (error as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ paddingBottom: '50vh' }}>
      {/* Tabbed Header */}
      <div style={tabStyle}>
        <button
          style={tabButtonStyle(insightType === 'answers')}
          onClick={() => onInsightTypeChange('answers')}
          onMouseEnter={(e) => {
            if (insightType !== 'answers') {
              Object.assign(e.currentTarget.style, tabButtonHoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (insightType !== 'answers') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6c757d';
            }
          }}
        >
          💬 Answer Insights
        </button>
        <button
          style={tabButtonStyle(insightType === 'inspiration')}
          onClick={() => onInsightTypeChange('inspiration')}
          onMouseEnter={(e) => {
            if (insightType !== 'inspiration') {
              Object.assign(e.currentTarget.style, tabButtonHoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (insightType !== 'inspiration') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6c757d';
            }
          }}
        >
          💡 Inspiration Insights
        </button>
      </div>

      {/* Table Content */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              borderBottom: '2px solid #dee2e6',
              fontWeight: '600',
              color: '#495057'
            }}>
              Question
            </th>
            {insightType === 'answers' && (
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                borderBottom: '2px solid #dee2e6',
                fontWeight: '600',
                color: '#495057'
              }}>
                Answer
              </th>
            )}
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              borderBottom: '2px solid #dee2e6',
              fontWeight: '600',
              color: '#495057'
            }}>
              Insight
            </th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((item) => (
                          <tr 
                key={`${item.id}-${item.answerText || 'inspiration'}`} // Unique key for answer insights
                onClick={() => handleQuestionNavigation(item.questionId, item.questionCategory.id)}
              style={{ 
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <td style={{ 
                padding: '12px', 
                borderBottom: '1px solid #dee2e6',
                color: '#495057'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <span style={{ marginRight: '4px' }}>{item.isImageQuestion ? '🖼️' : '💬'}</span>
                    {item.questionText}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <QuestionIdChip 
                      persistentId={item.persistentId}
                      publishedId={item.publishedId}
                      isProposed={!!item.proposedQuestion}
                    />
                    {item.firstDays && (
                      <div
                        style={{
                          backgroundColor: '#495057',
                          color: 'white',
                          fontSize: '12px',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600'
                        }}
                        title="First days question"
                      >
                        d0
                      </div>
                    )}
                    {item.conversationStarter && (
                      <div
                        style={{
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          fontSize: '12px',
                          padding: '4px 6px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600'
                        }}
                        title="Conversation starter question"
                      >
                        🗣️
                      </div>
                    )}
                    {item.approved ? (
                    <div
                      style={{
                        background: 'none',
                        border: '2px solid #28a745',
                        color: '#007bff',
                        fontSize: '10px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#28a745',
                        fontWeight: '600'
                      }}
                      title="Question is approved"
                    >
                      👍
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleDeleteQuestion(item.questionId, e)}
                      disabled={deleting?.type === 'question' && deleting?.id === item.questionId}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        fontSize: '14px',
                        cursor: deleting?.type === 'question' && deleting?.id === item.questionId ? 'not-allowed' : 'pointer',
                        padding: '4px',
                        borderRadius: '3px',
                        opacity: deleting?.type === 'question' && deleting?.id === item.questionId ? 0.5 : 0.7,
                        transition: 'opacity 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!(deleting?.type === 'question' && deleting?.id === item.questionId)) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(deleting?.type === 'question' && deleting?.id === item.questionId)) {
                          e.currentTarget.style.opacity = '0.7';
                        }
                      }}
                      title="Delete question"
                    >
                      {deleting?.type === 'question' && deleting?.id === item.questionId ? '⏳' : '✕'}
                    </button>
                  )}
                  </div>
                </div>
              </td>

              {insightType === 'answers' && (
                <td style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #dee2e6',
                  color: '#495057'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ flex: 1 }}>{item.answerText}</span>
                    {(() => {
                      const count = answerCounts.get(item.questionId) ?? 0;
                      const shouldShow = count > 2 && !item.approved;
                      console.log(`Answer for question ${item.questionId}: count=${count}, approved=${item.approved}, shouldShowDeleteAnswer=${shouldShow}`);
                      return shouldShow;
                    })() && (
                      <button
                        onClick={(e) => {
                          // Find the answer ID by matching the question and answer text
                          const question = questions.find(q => q.id === item.questionId);
                          const answer = question?.answers.find(a => a.answerText === item.answerText);
                          if (answer) {
                            handleDeleteAnswer(answer.id, e);
                          }
                        }}
                        disabled={deleting?.type === 'answer'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          fontSize: '14px',
                          cursor: deleting?.type === 'answer' ? 'not-allowed' : 'pointer',
                          padding: '4px',
                          borderRadius: '3px',
                          opacity: deleting?.type === 'answer' ? 0.5 : 0.7,
                          transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (deleting?.type !== 'answer') {
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (deleting?.type !== 'answer') {
                            e.currentTarget.style.opacity = '0.7';
                          }
                        }}
                        title="Delete answer (question has more than 2 answers)"
                      >
                        {deleting?.type === 'answer' ? '⏳' : '✕'}
                      </button>
                    )}
                  </div>
                </td>
              )}
              <td style={{ 
                padding: '12px', 
                borderBottom: '1px solid #dee2e6',
                color: '#495057'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                    <AnswerCountChip 
                      count={insightAnswerCounts.get(item.id) || 0}
                      relatedQuestions={insightToQuestionsMap.get(item.id) || []}
                      onQuestionClick={handleQuestionNavigation}
                    />
                    <span style={{ flex: 1, marginRight: '8px' }}>{item.insightText}</span>
                  </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      {item.insightCategory.id !== item.questionCategory.id && (
                        <CategoryChip 
                          insightSubject={item.insightCategory.insightSubject} 
                          categoryId={item.insightCategory.id}
                          onClick={onCategoryClick} 
                        />
                      )}
                      {item.publishedTag && (
                        <PublishedTagChip publishedTag={item.publishedTag} />
                      )}
                      <ShortInsightChip shortInsightText={item.shortInsightText} />
                    </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InsightTable; 