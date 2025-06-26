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
}

const CategoryTable: React.FC<CategoryTableProps> = ({ onCategoryClick }) => {
  const [categories, setCategories] = useState<CategoryDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setCategories(displayData);
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

    fetchCategories();
  }, []);

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p>Error loading categories: {error}</p>;

  return (
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
            <td>
              {category.insightSubject && (
                <span style={getInsightSubjectStyle(category.insightSubject)}>
                  {category.insightSubject}
                </span>
              )}
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
    </table>
  );
};

export default CategoryTable; 