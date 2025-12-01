import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center bg-zinc-800 rounded-lg overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
          className="bg-transparent px-4 py-2 text-white placeholder-gray-400 focus:outline-none w-64"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors"
          aria-label="Search"
        >
          <FaSearch />
        </button>
      </div>
    </form>
  );
}
