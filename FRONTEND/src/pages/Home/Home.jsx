import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import GenreRow from "../../components/GenreRow";

export default function Home() {
  const [moviesByGenre, setMoviesByGenre] = useState({});

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/movies`);
        const data = await res.json();

        // Group by genre
        const grouped = data.movies.reduce((acc, movie) => {
          const genre = Array.isArray(movie.genre)
            ? movie.genre[0]
            : movie.genre || "Other";
          if (!acc[genre]) acc[genre] = [];
          acc[genre].push(movie);
          return acc;
        }, {});
        setMoviesByGenre(grouped);
      } catch (err) {
        console.error("Error fetching movies:", err);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <div className="pt-20 space-y-10">
        {Object.entries(moviesByGenre).map(([genre, movies]) => (
          <GenreRow key={genre} genre={genre} movies={movies} />
        ))}
      </div>
    </div>
  );
}
