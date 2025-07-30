import React from 'react';

interface ApprovedCountChipProps {
  approved: number;
  total: number;
  onClick?: () => void;
}

const ApprovedCountChip: React.FC<ApprovedCountChipProps> = ({ approved, total, onClick }) => {
  // Don't render if total is 0
  if (total === 0) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent row click
    if (onClick) {
      onClick();
    }
  };

  return (
    <span 
      onClick={handleClick}
      style={{
        backgroundColor: approved === total ? '#28a745' : approved > 0 ? '#ffc107' : '#dc3545',
        color: approved === total ? '#fff' : approved > 0 ? '#000' : '#fff',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'inline-block',
        marginLeft: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.1s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      title={onClick ? `Click to view ${approved === total ? 'all' : approved === 0 ? 'unapproved' : 'approved/unapproved'} questions` : undefined}
    >
      👍 {approved}/{total}
    </span>
  );
};

export default ApprovedCountChip;