import React, { useEffect, useState } from 'react';
import PublishedIdChip from './PublishedIdChip';
import PublishedTagChip from './PublishedTagChip';

export type InsightType = 'inspiration' | 'answers'; // This matches the frontend logic

// Interface for inspiration insights from the API (matches Prisma Insight model with question)
interface InspirationInsightFromAPI {
  id: number;
  categoryId: number;
  insightText: string;
  source: string; // Should be 'INSPIRATION' from InsightSource enum
  generationOrder?: number | null;
  publishedTag?: string | null;
  question?: {
    questionText: string;
    publishedId: string | null;
  } | null;
}

// Interface for answer insights from the API - now returns Answer records with included data
interface AnswerInsightFromAPI {
  id: number; // This is the Answer ID
  answerText: string;
  question: {
    questionText: string;
    publishedId: string | null;
  };
  insight: {
    id: number; // This is the Insight ID
    insightText: string;
    source: string;
    publishedTag: string | null;
  } | null;
}

// Interface for what the table will display - inspiration insights
interface InspirationInsightDisplay {
    id: number;
    questionText: string;
    publishedId: string | null;
    insightText: string;
    publishedTag: string | null;
    source: string;
}

// Interface for what the table will display - answer insights
interface AnswerInsightDisplay {
    id: number;
    questionText: string;
    publishedId: string | null;
    answerText: string;
    insightText: string;
    publishedTag: string | null;
    source: string;
}

interface InsightTableProps {
  categoryId: number;
  insightType: InsightType; // 'inspiration' or 'answers'
  onInsightClick: (insightId: number) => void;
  onInsightTypeChange: (type: InsightType) => void; // New prop for handling tab changes
}

const InsightTable: React.FC<InsightTableProps> = ({ 
  categoryId, 
  insightType, 
  onInsightClick, 
  onInsightTypeChange 
}) => {
  const [inspirationInsights, setInspirationInsights] = useState<InspirationInsightDisplay[]>([]);
  const [answerInsights, setAnswerInsights] = useState<AnswerInsightDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiPath = insightType === 'inspiration' ? 
          `/api/categories/${categoryId}/inspiration-insights` :
          `/api/categories/${categoryId}/answer-insights`;
        
        const response = await fetch(apiPath);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (insightType === 'inspiration') {
          const data: InspirationInsightFromAPI[] = await response.json();
          // Map API data to display data for inspiration insights
          const displayData = data.map(ins => ({
            id: ins.id,
            questionText: ins.question?.questionText || 'No question generated',
            publishedId: ins.question?.publishedId || null,
            insightText: ins.insightText,
            publishedTag: ins.publishedTag || null,
            source: ins.source,
          }));
          setInspirationInsights(displayData);
        } else {
          const data: AnswerInsightFromAPI[] = await response.json();
          // Map API data to display data for answer insights
          const displayData = data
            .filter(answer => answer.insight) // Only include answers that have insights
            .map(answer => ({
              id: answer.insight!.id, // Use the insight ID for the click handler
              questionText: answer.question?.questionText || 'No question found',
              publishedId: answer.question?.publishedId || null,
              answerText: answer.answerText,
              insightText: answer.insight!.insightText,
              publishedTag: answer.insight!.publishedTag || null,
              source: answer.insight!.source,
            }));
          setAnswerInsights(displayData);
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

    fetchInsights();
  }, [categoryId, insightType]);

  if (loading) return <p>Loading insights...</p>;
  if (error) return <p>Error loading insights: {error}</p>;
  if (!categoryId) return <p>Please select a category first.</p>;

  const tabStyle = {
    display: 'flex',
    borderBottom: '2px solid #e0e0e0',
    marginBottom: '20px',
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

  return (
    <div>
      {/* Tabbed Header */}
      <div style={tabStyle}>
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
          {insightType === 'inspiration' ? (
            inspirationInsights.map((insight) => (
              <tr 
                key={insight.id}
                onClick={() => onInsightClick(insight.id)}
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
                    {insight.questionText}
                    {insight.publishedId && (
                      <PublishedIdChip publishedId={insight.publishedId} />
                    )}
                  </div>
                </td>
                <td style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #dee2e6',
                  color: '#495057'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{insight.insightText}</span>
                    {insight.publishedTag && (
                      <PublishedTagChip publishedTag={insight.publishedTag} />
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            answerInsights.map((insight) => (
              <tr 
                key={insight.id}
                onClick={() => onInsightClick(insight.id)}
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
                    {insight.questionText}
                    {insight.publishedId && (
                      <PublishedIdChip publishedId={insight.publishedId} />
                    )}
                  </div>
                </td>
                <td style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #dee2e6',
                  color: '#495057'
                }}>
                  {insight.answerText}
                </td>
                <td style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #dee2e6',
                  color: '#495057'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{insight.insightText}</span>
                    {insight.publishedTag && (
                      <PublishedTagChip publishedTag={insight.publishedTag} />
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InsightTable; 