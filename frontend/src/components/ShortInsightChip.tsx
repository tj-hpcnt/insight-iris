import React from 'react';

interface ShortInsightChipProps {
  shortInsightText: string | null | undefined;
}

const ShortInsightChip: React.FC<ShortInsightChipProps> = ({ shortInsightText }) => {
  if (!shortInsightText) {
    return null;
  }

  return (
    <span style={{
      backgroundColor: '#f5deb3', // Light tan background
      color: '#8b4513', // Dark brown text for good contrast
      fontSize: '11px',
      padding: '3px 8px',
      borderRadius: '12px',
      display: 'inline-block',
      fontWeight: '500',
      maxWidth: '100%',
      wordWrap: 'break-word',
      lineHeight: '1.2',
      border: '1px solid #deb887', // Slightly darker tan border
    }}>
      {shortInsightText}
    </span>
  );
};

export default ShortInsightChip;