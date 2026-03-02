import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import './SearchBar.css';

const SearchBar = ({ onSearch, placeholder = 'Search products...' }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim() || query === '') {
        onSearch(query);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={`search-bar-container ${isSearching ? 'searching' : ''}`}>
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsSearching(true)}
          onBlur={() => setIsSearching(false)}
        />
        {query && (
          <button className="clear-search" onClick={handleClear}>
            <FaTimes />
          </button>
        )}
      </div>
      
      {query && (
        <div className="search-status">
          Searching for: <strong>"{query}"</strong>
        </div>
      )}
    </div>
  );
};

export default SearchBar;