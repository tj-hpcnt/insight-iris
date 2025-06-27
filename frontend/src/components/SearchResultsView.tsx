import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PublishedIdChip from './PublishedIdChip';
import ProposedChip from './ProposedChip';
import PublishedTagChip from './PublishedTagChip';
import CategoryChip from './CategoryChip';

export interface SearchResult {
  type: 'question' | 'answer';
  questionId: number;
  questionText: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  category: {
    id: number;
    category: string;
    subcategory: string;
    insightSubject: string;
  };
  inspirationInsight?: string; // Only for question matches
  answerText?: string; // Only for answer matches
  answerInsight?: string; // Only for answer matches
  answerInsightCategory?: {
    id: number;
    category: string;
    subcategory: string;
    insightSubject: string;
  };
  answerInsightFirstCategory?: {
    id: number;
    category: string;
    subcategory: string;
    insightSubject: string;
  };
  answerInsightPublishedTag?: string | null;
  explanation: string;
}

interface SearchResultsViewProps {
  onQuestionClick: (questionId: number) => void;
  onCategoryClick: (categoryId: number, insightSubject: string) => void;
}

const SearchResultsView: React.FC<SearchResultsViewProps> = ({ onQuestionClick, onCategoryClick }) => {
  const location = useLocation();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Function to highlight matches of search query in text (supports regex)
  const highlightText = (text: string, searchQuery: string): React.ReactNode => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return text;
    }

    const query = searchQuery.trim();
    let searchRegex: RegExp;
    
    try {
      // Try to create a regex from the query with global and case-insensitive flags
      searchRegex = new RegExp(`(${query})`, 'gi');
    } catch (error) {
      // If regex compilation fails, fall back to escaped text matching
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchRegex = new RegExp(`(${escapedQuery})`, 'gi');
    }

    const parts = text.split(searchRegex);

    return parts.map((part, index) => {
      // Check if this part matches the original regex pattern
      try {
        const testRegex = new RegExp(query, 'i');
        if (testRegex.test(part)) {
          return <strong key={index}>{part}</strong>;
        }
      } catch (error) {
        // For escaped patterns, do simple case-insensitive comparison
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const testRegex = new RegExp(escapedQuery, 'i');
        if (testRegex.test(part)) {
          return <strong key={index}>{part}</strong>;
        }
      }
      return part;
    });
  };

  // Extract search query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    
    if (query && query !== searchQuery) {
      setSearchQuery(query);
      performSearch(query);
    } else if (!query) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [location.search]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results: SearchResult[] = await response.json();
      setSearchResults(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Searching...</p>;
  if (error) return <p>Search error: {error}</p>;
  if (!searchQuery) return <p>Please enter a search query.</p>;
  if (searchResults.length === 0 && searchQuery) return <p>No search results found for "{searchQuery}".</p>;

  return (
    <div>
      <div style={{ marginBottom: '10px', padding: '8px 12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ margin: '0 0 4px 0', color: '#495057' }}>
          Search Results for "{searchQuery}"
        </h2>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
          Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
        </p>
      </div>

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
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              borderBottom: '2px solid #dee2e6',
              fontWeight: '600',
              color: '#495057'
            }}>
              Answer
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              borderBottom: '2px solid #dee2e6',
              fontWeight: '600',
              color: '#495057'
            }}>
              Insight
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              borderBottom: '2px solid #dee2e6',
              fontWeight: '600',
              color: '#495057'
            }}>
              Moved From
            </th>
          </tr>
        </thead>
        <tbody>
          {searchResults.map((result, index) => (
            <tr 
              key={`${result.questionId}-${result.type}-${index}`}
              onClick={() => onQuestionClick(result.questionId)}
              style={{ 
                transition: 'background-color 0.2s ease',
                cursor: 'pointer'
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
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ marginRight: '8px' }}>
                    {highlightText(result.questionText, searchQuery)}
                  </span>
                  {result.publishedId && (
                    <PublishedIdChip publishedId={result.publishedId} />
                  )}
                  {result.proposedQuestion && !result.publishedId && (
                    <ProposedChip />
                  )}
                  <CategoryChip 
                    insightSubject={result.category.insightSubject} 
                    categoryId={result.category.id}
                    onClick={onCategoryClick} 
                  />
                </div>
              </td>
              <td style={{ 
                padding: '12px', 
                borderBottom: '1px solid #dee2e6',
                color: '#495057'
              }}>
                {result.type === 'answer' && result.answerText && (
                  <span>{highlightText(result.answerText, searchQuery)}</span>
                )}
                {result.type === 'question' && (
                  <span style={{ fontStyle: 'italic', color: '#6c757d' }}>
                    (Question Match)
                  </span>
                )}
              </td>
              <td style={{ 
                padding: '12px', 
                borderBottom: '1px solid #dee2e6',
                color: '#495057'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, marginRight: '8px' }}>
                    {result.type === 'answer' && result.answerInsight && (
                      <span>{highlightText(result.answerInsight, searchQuery)}</span>
                    )}
                    {result.type === 'question' && result.inspirationInsight && (
                      <span>{highlightText(result.inspirationInsight, searchQuery)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                          {result.type === 'answer' && result.answerInsightCategory && 
                       result.answerInsightCategory.id !== result.category.id && (
                        <CategoryChip 
                          insightSubject={result.answerInsightCategory.insightSubject} 
                          categoryId={result.answerInsightCategory.id}
                          onClick={onCategoryClick} 
                        />
                      )}
                    {result.type === 'answer' && result.answerInsightPublishedTag && (
                      <PublishedTagChip publishedTag={result.answerInsightPublishedTag} />
                    )}
                  </div>
                </div>
              </td>
              <td style={{ 
                padding: '12px', 
                borderBottom: '1px solid #dee2e6',
                color: '#495057'
              }}>
                                  {result.type === 'answer' && result.answerInsightFirstCategory && 
                   result.answerInsightFirstCategory.id !== (result.answerInsightCategory?.id || 0) && (
                    <CategoryChip 
                      insightSubject={result.answerInsightFirstCategory.insightSubject} 
                      categoryId={result.answerInsightFirstCategory.id}
                      onClick={onCategoryClick} 
                    />
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SearchResultsView; 