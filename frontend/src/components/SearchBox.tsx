import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBox: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center',
      marginRight: '12px'
    }}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search..."
        style={{
          padding: '4px 8px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          fontSize: '12px',
          outline: 'none',
          width: '120px',
          height: '24px',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#007bff';
          e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#ced4da';
          e.target.style.boxShadow = 'none';
        }}
      />
    </div>
  );
};

export default SearchBox; 