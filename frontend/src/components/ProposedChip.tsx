import React from 'react';

const ProposedChip: React.FC = () => {
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
      PROPOSED
    </span>
  );
};

export default ProposedChip; 