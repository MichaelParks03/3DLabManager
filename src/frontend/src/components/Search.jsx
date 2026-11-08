import { useState } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import "../css/Search.css"

const ITEMS = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Orange' },
  { id: 4, name: 'Pineapple' },
];

function SearchBar({ variant = 'navbar', placeholder="Search Item Here...", show_results = true }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const filteredResults = ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (event) => event.preventDefault();

  return <form onSubmit={handleSubmit} className={`searchBar searchBar--${variant}`}>
    <input 
      type="text"
      placeholder={placeholder}
      className="searchBar-input"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setTimeout(() => setIsFocused(false), 200)}
    />
    <button type="submit" className="searchBar-btn">
      <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
    </button>

    {/* render results of query */}
    {show_results && isFocused && searchQuery && (
        <div className="results-dropdown">
          {filteredResults.length > 0 ? (
            filteredResults.map((item, index) => (
              <div 
                key={item.id}
                className="result-item"
                onClick={() => {
                  setSearchQuery(item.name);
                  setIsFocused(false);
                }}
              >
                {item.name}
              </div>
            ))
          ) : (
            <div className="no-results">No results found</div>
          )}
        </div>
      )}
  </form>
}

export default SearchBar