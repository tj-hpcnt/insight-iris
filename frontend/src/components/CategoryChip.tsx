import React from 'react';
import { getInsightSubjectStyle } from '../utils/colorUtils';

interface CategoryChipProps {
  insightSubject: string;
  fontSize?: string;
  categoryId?: number;
  onClick?: (categoryId: number, insightSubject: string) => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({ 
  insightSubject, 
  fontSize = '11px', 
  categoryId,
  onClick 
}) => {
  const style = getInsightSubjectStyle(insightSubject, fontSize);
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick && categoryId) {
      e.stopPropagation(); // Prevent row click from triggering
      onClick(categoryId, insightSubject);
    }
  };
  
  return (
    <span 
      style={{
        ...style,
        marginLeft: '8px',
        flexShrink: 0,
        fontWeight: '500',
        cursor: onClick && categoryId ? 'pointer' : 'default',
        transition: 'opacity 0.2s ease',
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (onClick && categoryId) {
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && categoryId) {
          e.currentTarget.style.opacity = '1';
        }
      }}
    >
      {insightSubject}
    </span>
  );
};

export default CategoryChip; 