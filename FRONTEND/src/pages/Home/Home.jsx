import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import GenreRow from "../../components/GenreRow";
import MovieCarousel from "../../components/MovieCarousel";
import userApi from "../../api/userApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";

export default function Home() {
  const [moviesByGenre, setMoviesByGenre] = useState({});
  const { dbUser } = useAuthStore();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Use the backend aggregation endpoint that properly handles multiple genres
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/movies/aggregate/by-genre`);
        const data = await res.json();

        // Convert aggregation result to the expected format
        const grouped = data.reduce((acc, genreGroup) => {
          acc[genreGroup._id] = genreGroup.movies;
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
      <div className="pt-20">
        {/* Featured Movies Carousel */}
        <MovieCarousel />
        
        {/* Genre Rows */}
        <div className="space-y-10">
          {Object.entries(moviesByGenre).map(([genre, movies]) => (
            <GenreRow 
              key={genre} 
              genre={genre} 
              movies={movies}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
