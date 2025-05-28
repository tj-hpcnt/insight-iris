import React, { useEffect, useState } from 'react';

export type InsightType = 'inspiration' | 'answers'; // This matches the frontend logic

// Interface for data coming from the API (matches Prisma Insight model)
interface InsightFromAPI {
  id: number;
  categoryId: number;
  insightText: string;
  source: string; // Should be 'INSPIRATION' or 'ANSWER' from InsightSource enum
  generationOrder?: number | null;
  // category: any; // Not fetching category details here
  // answers: any[]; // Not fetching related answers here for this table
  // insightCompareA: any[];
  // insightCompareB: any[];
}

// Interface for what the table will display
interface InsightDisplay {
    id: number;
    title: string; // This will be insightText from the API
    source: string;
}

interface InsightTableProps {
  categoryId: number;
  insightType: InsightType; // 'inspiration' or 'answers'
  onInsightClick: (insightId: number, insightTitle: string) => void;
  onInsightTypeChange: (type: InsightType) => void; // New prop for handling tab changes
}

const InsightTable: React.FC<InsightTableProps> = ({ 
  categoryId, 
  insightType, 
  onInsightClick, 
  onInsightTypeChange 
}) => {
  const [insights, setInsights] = useState<InsightDisplay[]>([]);
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
        const data: InsightFromAPI[] = await response.json();
        // Map API data to display data
        const displayData = data.map(ins => ({
            id: ins.id,
            title: ins.insightText, // Use insightText as the title for display
            source: ins.source,
        }));
        setInsights(displayData);
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
              Insight Text
            </th>
          </tr>
        </thead>
        <tbody>
          {insights.map((insight) => (
            <tr 
              key={insight.id}
              onClick={() => onInsightClick(insight.id, insight.title)}
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
                {insight.title}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InsightTable; 