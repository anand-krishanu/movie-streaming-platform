import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import GenreRow from "../../components/GenreRow";
import MovieCarousel from "../../components/MovieCarousel";
import movieApi from "../../api/movieApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";

export default function Home() {
  const [moviesByGenre, setMoviesByGenre] = useState({});
  const { dbUser } = useAuthStore();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Fetch all movies with a large page size to get most movies
        const response = await movieApi.fetchMovies(0, 100);
        const movies = response.content;

        // Group movies by genre on the client side
        // Each movie can appear in multiple genre rows
        const grouped = {};
        movies.forEach(movie => {
          if (movie.genre && Array.isArray(movie.genre)) {
            movie.genre.forEach(genre => {
              if (!grouped[genre]) {
                grouped[genre] = [];
              }
              grouped[genre].push(movie);
            });
          }
        });
        
        setMoviesByGenre(grouped);
      } catch (err) {
        console.error("Error fetching movies:", err);
        toast.error("Failed to load movies");
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
