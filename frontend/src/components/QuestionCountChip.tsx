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
          backgroundColor: '#000',
          color: '#fff',
        };
      case 'proposed':
        return {
          backgroundColor: '#ffc0cb', // Pink background
          color: '#000', // Black text
        };
      case 'generated':
        return {
          backgroundColor: '#90EE90', // Light green background
          color: '#000', // Black text
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