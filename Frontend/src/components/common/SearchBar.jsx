import React from 'react';
import { RiSearchLine } from '@remixicon/react';
import '../../styles/common.css';

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className = "",
  width = "380px"
}) => {
  return (
    <div 
      className={`search-container ${className}`}
      style={{ minWidth: width }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default SearchBar;
