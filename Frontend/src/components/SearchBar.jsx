import './SearchBar.css'

function SearchBar({ value, onChange, placeholder = "Szukaj..." }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      <span className="search-icon">🔍</span>
    </div>
  )
}

export default SearchBar

