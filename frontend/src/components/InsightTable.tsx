import React, { useEffect, useState } from 'react';
import PublishedIdChip from './PublishedIdChip';
import ProposedChip from './ProposedChip';
import PublishedTagChip from './PublishedTagChip';
import CategoryChip from './CategoryChip';
import AnswerCountChip from './AnswerCountChip';

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
  publishedId: string | null;
  proposedQuestion: string | null;
  category: CategoryInfo;
  inspiration: {
    id: number;
    insightText: string;
    publishedTag: string | null;
    source: string;
    category: CategoryInfo;
    firstCategory: CategoryInfo;
  };
  answers: {
    id: number;
    answerText: string;
    insight: {
      id: number;
      insightText: string;
      publishedTag: string | null;
      source: string;
      category: CategoryInfo;
      firstCategory: CategoryInfo;
    };
  }[];
}

// Interface for what the table will display - now unified for both tabs
interface QuestionDisplay {
  id: number; // This will be the insight ID for clicking purposes
  questionId: number; // The question ID for navigation
  questionText: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  insightText: string;
  publishedTag: string | null;
  source: string;
  answerText?: string; // Only used for answer insights tab
  questionCategory: CategoryInfo;
  insightCategory: CategoryInfo;
  firstInsightCategory: CategoryInfo;
}

interface InsightTableProps {
  categoryId: number;
  insightType: InsightType; // 'inspiration' or 'answers'
  onInsightClick: (questionId: number) => void; // Changed to questionId
  onInsightTypeChange: (type: InsightType) => void;
}

const InsightTable: React.FC<InsightTableProps> = ({ 
  categoryId, 
  insightType, 
  onInsightClick, 
  onInsightTypeChange 
}) => {
  const [questions, setQuestions] = useState<QuestionFromAPI[]>([]);
  const [displayData, setDisplayData] = useState<QuestionDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [insightAnswerCounts, setInsightAnswerCounts] = useState<Map<number, number>>(new Map());
  const [insightToQuestionsMap, setInsightToQuestionsMap] = useState<Map<number, Array<{ id: number; questionText: string; publishedId: string | null; proposedQuestion: string | null; category: CategoryInfo }>>>(new Map());

  useEffect(() => {
    if (!categoryId) return;

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/categories/${categoryId}/questions`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: QuestionFromAPI[] = await response.json();
        setQuestions(data);
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

    fetchQuestions();
  }, [categoryId]);

  useEffect(() => {
    // Transform the questions data based on the selected tab
    if (insightType === 'inspiration') {
      const inspirationData = questions.map(question => ({
        id: question.inspiration.id, // Use inspiration insight ID for clicking
        questionId: question.id,
        questionText: question.questionText,
        publishedId: question.publishedId,
        proposedQuestion: question.proposedQuestion,
        insightText: question.inspiration.insightText,
        publishedTag: question.inspiration.publishedTag,
        source: question.inspiration.source,
        questionCategory: question.category,
        insightCategory: question.inspiration.category,
        firstInsightCategory: question.inspiration.firstCategory,
      }));
      setDisplayData(inspirationData);
      setInsightAnswerCounts(new Map()); // Clear counts for inspiration tab
      setInsightToQuestionsMap(new Map()); // Clear questions map for inspiration tab
    } else {
      // For answers tab, create one row per answer with its insight
      const answerData: QuestionDisplay[] = [];
      const insightToQuestionsMap = new Map<number, Array<{ id: number; questionText: string; publishedId: string | null; proposedQuestion: string | null; category: CategoryInfo }>>();
      
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
              publishedId: question.publishedId,
              proposedQuestion: question.proposedQuestion,
              category: question.category
            });
          }
          
          answerData.push({
            id: answer.insight.id, // Use answer insight ID for clicking
            questionId: question.id,
            questionText: question.questionText,
            publishedId: question.publishedId,
            proposedQuestion: question.proposedQuestion,
            answerText: answer.answerText,
            insightText: answer.insight.insightText,
            publishedTag: answer.insight.publishedTag,
            source: answer.insight.source,
            questionCategory: question.category,
            insightCategory: answer.insight.category,
            firstInsightCategory: answer.insight.firstCategory,
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
  if (!categoryId) return <p>Please select a category first.</p>;

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
    // If we're navigating to a question in a different category, we need to handle it
    if (questionCategoryId !== categoryId) {
      // For now, just navigate to the question in the current category context
      // In a more complex implementation, you might want to switch categories first
      console.warn('Navigation to different category not fully implemented');
    }
    onInsightClick(questionId);
  };

  return (
    <div>
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
            {insightType === 'answers' && (
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                borderBottom: '2px solid #dee2e6',
                fontWeight: '600',
                color: '#495057'
              }}>
                Moved From
              </th>
            )}
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {item.questionText}
                  {item.publishedId && (
                    <PublishedIdChip publishedId={item.publishedId} />
                  )}
                  {item.proposedQuestion && !item.publishedId && (
                    <ProposedChip />
                  )}
                </div>
              </td>
              {insightType === 'answers' && (
                <td style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #dee2e6',
                  color: '#495057'
                }}>
                  {item.answerText}
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
                      <CategoryChip insightSubject={item.insightCategory.insightSubject} />
                    )}
                    {item.publishedTag && (
                      <PublishedTagChip publishedTag={item.publishedTag} />
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
                  {item.firstInsightCategory.id !== item.insightCategory.id && (
                    <CategoryChip insightSubject={item.firstInsightCategory.insightSubject} />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InsightTable; 