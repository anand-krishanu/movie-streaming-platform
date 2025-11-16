// src/components/MovieGrid.jsx
import React from "react";
import MovieCard from "./MovieCard";

const MovieGrid = ({ movies }) => {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie._id || movie.id}
          movie={movie}
        />
      ))}
    </div>
  );
};

export default MovieGrid;
