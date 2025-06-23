import React from 'react';

interface PublishedIdChipProps {
  publishedId: string;
}

const PublishedIdChip: React.FC<PublishedIdChipProps> = ({ publishedId }) => {
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
};

export default PublishedIdChip; 