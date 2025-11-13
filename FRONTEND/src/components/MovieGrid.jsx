// src/components/MovieGrid.jsx
import React from "react";
import MovieCard from "./MovieCard";

const MovieGrid = ({ movies, onFavorite, onWatchLater }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onFavorite={onFavorite}
          onWatchLater={onWatchLater}
        />
      ))}
    </div>
  );
};

export default MovieGrid;
