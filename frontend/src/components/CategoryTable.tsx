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
    name: string; // This will be category.category
    // You can add other fields here if you want to display them
    topicHeader?: string;
}

interface CategoryTableProps {
  onCategoryClick: (categoryId: number, categoryName: string) => void;
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
        // Map API data to display data
        const displayData = data.map(cat => ({
            id: cat.id,
            name: cat.category, // Use the 'category' field for display name
            topicHeader: cat.topicHeader
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
          {/* Add other headers as needed */}
        </tr>
      </thead>
      <tbody>
        {categories.map((category) => (
          <tr key={category.id}>
            <td>
              <button onClick={() => onCategoryClick(category.id, category.name)}
                 style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    color: 'blue',
                  }}
              >
                {category.name}
              </button>
            </td>
            <td>{category.topicHeader}</td>
            {/* Add other data cells as needed */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CategoryTable; 