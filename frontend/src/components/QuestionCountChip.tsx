import React from 'react';

interface QuestionCountChipProps {
  count: number;
  type: 'published' | 'proposed' | 'generated';
}

const QuestionCountChip: React.FC<QuestionCountChipProps> = ({ count, type }) => {
  const getChipStyle = () => {
    switch (type) {
      case 'published':
        return {
          backgroundColor: 'transparent',
          color: '#000',
          border: '1px solid #000',
        };
      case 'proposed':
        return {
          backgroundColor: 'transparent',
          color: '#d63384', // Pink color for text and border
          border: '1px solid #d63384',
        };
      case 'generated':
        return {
          backgroundColor: 'transparent',
          color: '#198754', // Green color for text and border
          border: '1px solid #198754',
        };
      default:
        return {};
    }
  };

  const getChipText = () => {
    switch (type) {
      case 'published':
        return 'Published';
      case 'proposed':
        return 'Proposed';
      case 'generated':
        return 'Generated';
      default:
        return '';
    }
  };

  if (count === 0) return null;

  return (
    <span style={{
      ...getChipStyle(),
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'inline-block',
      marginLeft: '8px'
    }}>
      {count} {getChipText()}
    </span>
  );
};

export default QuestionCountChip; 