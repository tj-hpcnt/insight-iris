import React from 'react';
import { getInsightSubjectStyle } from '../utils/colorUtils';

export interface BreadcrumbItem {
  label: string;
  onClick: () => void;
  isCurrent?: boolean;
  insightSubject?: string;
  approvalFilter?: boolean | null; // true = approved only, false = unapproved only, null/undefined = no filter
  firstDaysFilter?: boolean | null; // true = firstDays only, false = not firstDays, null/undefined = no filter
  conversationStarterFilter?: boolean | null; // true = conversation starters only, false = not conversation starters, null/undefined = no filter
  onClearApprovalFilter?: () => void; // Callback to cycle through approval filter states
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
              {item.onClearApprovalFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the main breadcrumb click
                    item.onClearApprovalFilter?.();
                  }}
                  style={{
                    backgroundColor: item.approvalFilter === true 
                      ? '#28a745' 
                      : item.approvalFilter === false 
                        ? '#dc3545' 
                        : item.firstDaysFilter === true
                          ? '#495057'
                          : item.firstDaysFilter === false
                            ? '#ffc107'
                            : item.conversationStarterFilter === true
                              ? '#17a2b8'
                              : '#6c757d',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginLeft: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  title={`Click to switch to ${
                    item.approvalFilter === false && item.firstDaysFilter === null && item.conversationStarterFilter === null
                      ? 'approved only' 
                      : item.approvalFilter === true && item.firstDaysFilter === null && item.conversationStarterFilter === null
                        ? 'all questions'
                        : item.approvalFilter === null && item.firstDaysFilter === null && item.conversationStarterFilter === null
                          ? 'd0 only'
                          : item.approvalFilter === null && item.firstDaysFilter === true && item.conversationStarterFilter === null
                            ? 'not d0'
                            : item.approvalFilter === null && item.firstDaysFilter === false && item.conversationStarterFilter === null
                              ? 'conversation starters'
                              : 'unapproved only'
                  }`}
                >
                  {item.approvalFilter === true 
                    ? '👍 Approved Only' 
                    : item.approvalFilter === false 
                      ? '👍 Unapproved Only' 
                      : item.firstDaysFilter === true
                        ? 'd0 Only'
                        : item.firstDaysFilter === false
                          ? 'Not d0'
                          : item.conversationStarterFilter === true
                            ? '🗣️ Convo Starters'
                            : '👍 All Questions'} ↻
                </button>
              )}
            </div>
          </li>
        ))}
        </ol>
    </nav>
  );
};

export default Breadcrumbs; 