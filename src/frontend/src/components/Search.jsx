import { useState } from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import "../css/Search.css"

function SearchBar({ variant = 'navbar' }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    alert("clicked");
    setSearchQuery("");
  }

  return <form onSubmit={handleSearch} className={`searchBar searchBar--${variant}`}>
    <input 
      type="text"
      placeholder="Enter Item Here..."
      className="searchBar-input"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    <button type="submit" className="searchBar-btn">
      <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
    </button>
  </form>
}

export default SearchBar