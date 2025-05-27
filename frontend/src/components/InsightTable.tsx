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
}

const InsightTable: React.FC<InsightTableProps> = ({ categoryId, insightType, onInsightClick }) => {
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

  // Determine the title based on the insightType from the prop, which is more reliable here
  const tableTitle = insightType.charAt(0).toUpperCase() + insightType.slice(1) + ' Insights';

  return (
    <div>
      <h2>{tableTitle}</h2>
      <table>
        <thead>
          <tr>
            <th>Insight Text (Title)</th>
            {/* <th>Source</th> You might want to display the source if it's useful */}
          </tr>
        </thead>
        <tbody>
          {insights.map((insight) => (
            <tr key={insight.id}>
              <td>
                <button 
                  onClick={() => onInsightClick(insight.id, insight.title)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    color: 'blue',
                    textAlign: 'left'
                  }}
                >
                  {insight.title}
                </button>
              </td>
              {/* <td>{insight.source}</td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InsightTable; 