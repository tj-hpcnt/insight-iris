import React from 'react';

interface PublishedTagChipProps {
  publishedTag: string;
}

const PublishedTagChip: React.FC<PublishedTagChipProps> = ({ publishedTag }) => {
  return (
    <span style={{
      backgroundColor: '#e5e5e5',
      color: '#000',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '400',
      display: 'inline-block',
      marginLeft: '8px',
      flexShrink: 0
    }}>
      {publishedTag}
    </span>
  );
};

export default PublishedTagChip; 