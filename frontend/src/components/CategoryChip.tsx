import React from 'react';
import { getInsightSubjectStyle } from '../utils/colorUtils';

interface CategoryChipProps {
  insightSubject: string;
  fontSize?: string;
}

const CategoryChip: React.FC<CategoryChipProps> = ({ insightSubject, fontSize = '11px' }) => {
  const style = getInsightSubjectStyle(insightSubject, fontSize);
  
  return (
    <span 
      style={{
        ...style,
        marginLeft: '8px',
        flexShrink: 0,
        fontWeight: '500',
      }}
    >
      {insightSubject}
    </span>
  );
};

export default CategoryChip; 