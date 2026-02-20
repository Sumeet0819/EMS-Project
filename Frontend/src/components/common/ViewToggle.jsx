import React from 'react';
import { RiLayoutGridLine, RiListCheck } from '@remixicon/react';
import '../../styles/common.css';

const ViewToggle = ({ viewMode, setViewMode, className = "" }) => {
  return (
    <div className={`view-toggle ${className}`}>
      <button 
        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => setViewMode('list')}
        title="List View"
      >
        <RiListCheck size={18} />
      </button>
      <button 
        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => setViewMode('grid')}
        title="Grid View"
      >
        <RiLayoutGridLine size={18} />
      </button>
    </div>
  );
};

export default ViewToggle;
