import React from 'react';

interface BreadcrumbItem {
  label: string;
  onClick: () => void;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="breadcrumb">
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex' }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && <span style={{ margin: '0 0.5em' }}>/</span>}
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
              }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 