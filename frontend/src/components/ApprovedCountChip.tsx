import React from 'react';

interface ApprovedCountChipProps {
  approved: number;
  total: number;
}

const ApprovedCountChip: React.FC<ApprovedCountChipProps> = ({ approved, total }) => {
  // Don't render if total is 0
  if (total === 0) return null;

  return (
    <span style={{
      backgroundColor: approved === total ? '#28a745' : approved > 0 ? '#ffc107' : '#dc3545',
      color: approved === total ? '#fff' : approved > 0 ? '#000' : '#fff',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'inline-block',
      marginLeft: '8px'
    }}>
      👍 {approved}/{total}
    </span>
  );
};

export default ApprovedCountChip;