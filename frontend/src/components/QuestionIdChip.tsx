import React from 'react';

interface QuestionIdChipProps {
  persistentId: string;
  publishedId?: string | null;
  isProposed?: boolean; // Whether the question has a proposedQuestion
}

const QuestionIdChip: React.FC<QuestionIdChipProps> = ({ 
  persistentId, 
  publishedId,
  isProposed = false
}) => {
  // If publishedId exists, show it with black background (same as PublishedIdChip)
  if (publishedId) {
    return (
      <span style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-block',
        marginLeft: '8px'
      }}>
        {publishedId}
      </span>
    );
  }
  
  // If question is proposed, show persistentId with pink background (like old ProposedChip)
  if (isProposed) {
    return (
      <span style={{
        backgroundColor: '#ffc0cb', // Pink background
        color: '#000', // Black text
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-block',
        marginLeft: '8px'
      }}>
        {persistentId}
      </span>
    );
  }
  
  // If question is NOT proposed, show persistentId with dark green background
  return (
    <span style={{
      backgroundColor: '#1a5d1a', // Very dark green
      color: '#fff', // White text
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'inline-block',
      marginLeft: '8px'
    }}>
      {persistentId}
    </span>
  );
};

export default QuestionIdChip;