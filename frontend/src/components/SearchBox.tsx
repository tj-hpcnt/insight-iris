import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchBox: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      padding: '8px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search questions, answers, and insights..."
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          fontSize: '14px',
          outline: 'none',
          minWidth: '300px'
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
      <button
        onClick={handleSearch}
        disabled={!searchQuery.trim()}
        style={{
          padding: '8px 16px',
          backgroundColor: !searchQuery.trim() ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: !searchQuery.trim() ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          minWidth: '80px'
        }}
        onMouseEnter={(e) => {
          if (searchQuery.trim()) {
            e.currentTarget.style.backgroundColor = '#0056b3';
          }
        }}
        onMouseLeave={(e) => {
          if (searchQuery.trim()) {
            e.currentTarget.style.backgroundColor = '#007bff';
          }
        }}
      >
        Search
      </button>
      {searchQuery && (
        <button
          onClick={handleClear}
          style={{
            padding: '8px 12px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#545b62';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6c757d';
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default SearchBox; 