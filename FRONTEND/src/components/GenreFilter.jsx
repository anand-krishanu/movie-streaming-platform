import React, { useState } from "react";

const genres = [
  "All",
  "Action",
  "Comedy",
  "Drama",
  "Sci-Fi",
  "Thriller",
  "Horror",
  "Romance",
];

const GenreFilter = ({ onSelect }) => {
  const [selected, setSelected] = useState("All");

  const handleClick = (genre) => {
    setSelected(genre);
    onSelect(genre);
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => handleClick(genre)}
          className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
            selected === genre
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
};

export default GenreFilter;