import React, { useEffect, useState } from 'react';

interface CategoryFromAPI { // Reflects Prisma model
  id: number;
  category: string; // Main display name
  topicHeader: string;
  subcategory: string;
  insightSubject: string;
  expandedHints?: string | null;
  // insights: any[]; // Not fetching insights here
  // categoryOverlapA: any[];
  // categoryOverlapB: any[];
}

interface CategoryDisplay {
    id: number;
    name: string; 
    topicHeader?: string;
    subcategory?: string; 
    insightSubject?: string; 
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
            topicHeader: cat.topicHeader,
            subcategory: cat.subcategory, 
            insightSubject: cat.insightSubject 
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
          <th>Topic</th>
          <th>Subcategory</th>
          <th>Insight Subject</th>
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
            <td>{category.topicHeader}</td>
            <td>{category.subcategory}</td>
            <td>{category.insightSubject}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CategoryTable; 