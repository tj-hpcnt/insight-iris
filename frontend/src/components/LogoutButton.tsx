import React, { useState, useRef } from 'react';

interface User {
  username: string;
  role: string;
}

interface LogoutButtonProps {
  user: User;
  onLogout: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ user, onLogout }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Start hover timer for tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 500); // Show tooltip after 0.5 second (reduced from 1 second)

    // Button hover effect
    e.currentTarget.style.backgroundColor = '#c82333';
    e.currentTarget.style.borderColor = '#bd2130';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Clear hover timer and hide tooltip
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowTooltip(false);

    // Button hover effect
    e.currentTarget.style.backgroundColor = '#dc3545';
    e.currentTarget.style.borderColor = '#dc3545';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onLogout}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          background: '#dc3545',
          border: '1px solid #dc3545',
          borderRadius: '4px',
          padding: '4px',
          cursor: 'pointer',
          color: 'white',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          transition: 'all 0.2s ease',
        }}
        title="Logout"
      >
        ⏻
      </button>
      
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '32px',
            right: '0',
            backgroundColor: '#333',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {user.username} ({user.role === 'read' ? 'read-only' : 'full access'})
          {/* Tooltip arrow pointing up */}
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              right: '12px',
              width: '0',
              height: '0',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '5px solid #333',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default LogoutButton; 