import React, { useState, useRef, useCallback } from 'react';
import PublishedIdChip from './PublishedIdChip';
import ProposedChip from './ProposedChip';

interface CategoryInfo {
  id: number;
  category: string;
  subcategory: string;
  insightSubject: string;
}

interface RelatedQuestion {
  id: number;
  questionText: string;
  publishedId: string | null;
  proposedQuestion: string | null;
  category: CategoryInfo;
}

interface AnswerCountChipProps {
  count: number;
  relatedQuestions?: RelatedQuestion[];
  onQuestionClick?: (questionId: number, categoryId: number) => void;
}

const AnswerCountChip: React.FC<AnswerCountChipProps> = ({ 
  count, 
  relatedQuestions = [], 
  onQuestionClick 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 150); // Small delay to allow moving to tooltip
  }, []);

  if (count <= 1) {
    return null; // Don't show chip if count is 1 or less
  }

  const handleQuestionNavigation = (e: React.MouseEvent, questionId: number, categoryId: number) => {
    e.stopPropagation(); // Prevent event bubbling
    if (onQuestionClick) {
      onQuestionClick(questionId, categoryId);
    }
  };

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span style={{
        backgroundColor: '#dc3545', // Red background
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        padding: '4px 8px',
        borderRadius: '12px',
        marginRight: '8px',
        display: 'inline-block',
        minWidth: '20px',
        textAlign: 'center',
        cursor: 'pointer'
      }}>
        {count}
      </span>
      
      {showTooltip && relatedQuestions.length > 0 && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            padding: '12px',
            zIndex: 1000,
            minWidth: '300px',
            maxWidth: '500px',
            marginTop: '4px'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#495057'
          }}>
            Questions using this insight:
          </div>
          {relatedQuestions.map((question) => (
            <div 
              key={question.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #eee',
                gap: '8px'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  color: '#495057',
                  lineHeight: '1.4'
                }}>
                  {question.questionText}
                </div>
              </div>
              <button
                onClick={(e) => handleQuestionNavigation(e, question.id, question.category.id)}
                style={{
                  backgroundColor: '#e5e5e5', // Light gray like PublishedTagChip
                  color: 'black',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d6d6d6'; // Slightly darker on hover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e5e5';
                }}
              >
                Go →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnswerCountChip; 