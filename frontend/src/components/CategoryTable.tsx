import React, { useEffect, useState } from 'react';
import { getInsightSubjectStyle } from '../utils/colorUtils';
import QuestionCountChip from './QuestionCountChip';

interface CategoryFromAPI { // Reflects Prisma model
  id: number;
  category: string; // Main display name
  subcategory: string;
  insightSubject: string;
  expandedHints?: string | null;
  questionCounts: {
    published: number;
    proposed: number;
    generated: number;
  };
  // insights: any[]; // Not fetching insights here
  // categoryOverlapA: any[];
  // categoryOverlapB: any[];
}

interface CategoryDisplay {
    id: number;
    name: string; 
    subcategory?: string; 
    insightSubject?: string; 
    questionCounts?: {
      published: number;
      proposed: number;
      generated: number;
    };
}

interface CategoryTableProps {
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

interface Totals {
  published: number;
  proposed: number;
  generated: number;
  absoluteTotal: number;
  newQuestions: number;
}

const CategoryTable: React.FC<CategoryTableProps> = ({ onCategoryClick, onRefresh, refreshTrigger }) => {
  const [categories, setCategories] = useState<CategoryDisplay[]>([]);
  const [totals, setTotals] = useState<Totals>({
    published: 0,
    proposed: 0,
    generated: 0,
    absoluteTotal: 0,
    newQuestions: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Extract fetchCategories as a reusable function
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/categories'); 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CategoryFromAPI[] = await response.json();
      
      const displayData = data.map(cat => ({
          id: cat.id,
          name: cat.category, 
          subcategory: cat.subcategory, 
          insightSubject: cat.insightSubject,
          questionCounts: cat.questionCounts
      }));
      
      // Calculate totals
      const calculatedTotals = displayData.reduce((acc, category) => {
        if (category.questionCounts) {
          acc.published += category.questionCounts.published;
          acc.proposed += category.questionCounts.proposed;
          acc.generated += category.questionCounts.generated;
        }
        return acc;
      }, {
        published: 0,
        proposed: 0,
        generated: 0,
        absoluteTotal: 0,
        newQuestions: 0
      });
      
      calculatedTotals.absoluteTotal = calculatedTotals.published + calculatedTotals.proposed + calculatedTotals.generated;
      calculatedTotals.newQuestions = calculatedTotals.proposed + calculatedTotals.generated;
      
      setCategories(displayData);
      setTotals(calculatedTotals);
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

  // Add delete function
  const handleDeleteCategory = async (categoryId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    if (deleting) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this category? This will permanently delete ALL questions, answers, and insights in this category. This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      setDeleting(categoryId);
      const response = await fetch(`/api/categories/${categoryId}`, {
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
        // Manually refresh if no onRefresh callback
        await fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category: ' + (error as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      fetchCategories();
    }
  }, [refreshTrigger]);

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p>Error loading categories: {error}</p>;

  return (
    <div style={{ paddingBottom: '50vh' }}>
      <table>
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Subcategory</th>
            <th>Insight Subject</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr 
              key={category.id} 
              onClick={() => category.insightSubject && onCategoryClick(category.id, category.insightSubject)}
              style={{ cursor: 'pointer' }} 
            >
              <td>{category.name}</td>
              <td>{category.subcategory}</td>
              <td style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    {category.insightSubject && (
                      <span style={getInsightSubjectStyle(category.insightSubject)}>
                        {category.insightSubject}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteCategory(category.id, e)}
                    disabled={deleting === category.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      fontSize: '14px',
                      cursor: deleting === category.id ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      borderRadius: '3px',
                      opacity: deleting === category.id ? 0.5 : 0.7,
                      transition: 'opacity 0.2s ease',
                      marginLeft: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (deleting !== category.id) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (deleting !== category.id) {
                        e.currentTarget.style.opacity = '0.7';
                      }
                    }}
                    title="Delete category and all its contents (questions, answers, insights)"
                  >
                    {deleting === category.id ? '⏳' : '✕'}
                  </button>
                </div>
              </td>
              <td>
                {category.questionCounts && (
                  <>
                    <QuestionCountChip count={category.questionCounts.published} type="published" />
                    <QuestionCountChip count={category.questionCounts.proposed} type="proposed" />
                    <QuestionCountChip count={category.questionCounts.generated} type="generated" />
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ 
            fontWeight: 'bold', 
            borderTop: '2px solid #ddd', 
            backgroundColor: '#f8f9fa' 
          }}>
            <td colSpan={3}>
              Total
              <span style={{ 
                marginLeft: '8px', 
                padding: '4px 8px', 
                backgroundColor: '#e9ecef', 
                borderRadius: '4px',
                fontSize: '0.85em'
              }}>
                Total: {totals.absoluteTotal}
              </span>
              <span style={{ 
                marginLeft: '4px', 
                padding: '4px 8px', 
                backgroundColor: '#d4edda', 
                borderRadius: '4px',
                fontSize: '0.85em'
              }}>
                New: {totals.newQuestions}
              </span>
            </td>
            <td>
              <QuestionCountChip count={totals.published} type="published" />
              <QuestionCountChip count={totals.proposed} type="proposed" />
              <QuestionCountChip count={totals.generated} type="generated" />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default CategoryTable; 