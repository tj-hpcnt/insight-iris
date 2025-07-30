import React from 'react';
import { getInsightSubjectStyle } from '../utils/colorUtils';

export interface BreadcrumbItem {
  label: string;
  onClick: () => void;
  isCurrent?: boolean;
  insightSubject?: string;
  approvalFilter?: boolean | null; // true = approved only, false = unapproved only, null/undefined = no filter
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  // Category navigation props
  onCategoryNavigation?: (direction: 'prev' | 'next') => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  items, 
  onCategoryNavigation, 
  canNavigatePrev = false, 
  canNavigateNext = false
}) => {
  const arrowButtonStyle = (enabled: boolean) => ({
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: '3px',
    padding: '2px 6px',
    cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? '#007bff' : '#ccc',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '22px',
    height: '22px',
    opacity: enabled ? 1 : 0.5,
    transition: 'all 0.2s ease',
  });



  return (
    <nav aria-label="breadcrumb">
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center' }}>
          {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && <span style={{ margin: '0 0.5em' }}>/</span>}
            
            {/* Show navigation arrows for category items (items with insightSubject) */}
            {item.insightSubject && onCategoryNavigation && (
              <>
                <button
                  onClick={() => canNavigatePrev && onCategoryNavigation('prev')}
                  disabled={!canNavigatePrev}
                  style={arrowButtonStyle(canNavigatePrev)}
                  title="Previous category"
                  onMouseEnter={(e) => {
                    if (canNavigatePrev) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#007bff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  ←
                </button>
              </>
            )}
            
            {/* Show navigation arrows for category items (items with insightSubject) */}
            {item.insightSubject && onCategoryNavigation && (
              <>
                <button
                  onClick={() => canNavigateNext && onCategoryNavigation('next')}
                  disabled={!canNavigateNext}
                  style={arrowButtonStyle(canNavigateNext)}
                  title="Next category"
                  onMouseEnter={(e) => {
                    if (canNavigateNext) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#007bff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  →
                </button>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={item.onClick}
                disabled={item.isCurrent}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: item.isCurrent ? 'default' : 'pointer',
                  textDecoration: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {item.label}
                {item.insightSubject && (
                  <span style={getInsightSubjectStyle(item.insightSubject, 'inherit')}>
                    {item.insightSubject}
                  </span>
                )}
              </button>
              
              {/* Approval Filter Indicator */}
              {item.approvalFilter !== undefined && item.approvalFilter !== null && (
                <span style={{
                  backgroundColor: item.approvalFilter ? '#28a745' : '#dc3545',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  marginLeft: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  👍 {item.approvalFilter ? 'Approved Only' : 'Unapproved Only'}
                </span>
              )}
            </div>
          </li>
        ))}
        </ol>
    </nav>
  );
};

export default Breadcrumbs; 