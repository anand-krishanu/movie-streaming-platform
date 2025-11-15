import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import GenreRow from "../../components/GenreRow";
import userApi from "../../api/userApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";

export default function Home() {
  const [moviesByGenre, setMoviesByGenre] = useState({});
  const { dbUser } = useAuthStore();

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

  const handleAddToFavorites = async (movieId) => {
    if (!dbUser) {
      toast.error("Please login to add favorites");
      return;
    }

    // If still using fallback after retry attempt
    if (dbUser._isFallback) {
      toast.warning("Please refresh the page to reconnect to the database.");
      return;
    }

    try {
      await userApi.addFavorite(dbUser._id, movieId);
      toast.success("Added to favorites! ❤️");
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast.error("Failed to add to favorites. Please try again.");
    }
  };

  const handleAddToWatchLater = async (movieId) => {
    if (!dbUser) {
      toast.error("Please login to add to watch later");
      return;
    }

    // If still using fallback after retry attempt
    if (dbUser._isFallback) {
      toast.warning("Please refresh the page to reconnect to the database.");
      return;
    }

    try {
      await userApi.addWatchLater(dbUser._id, movieId);
      toast.success("Added to watch later! 🕒");
    } catch (error) {
      console.error("Error adding to watch later:", error);
      toast.error("Failed to add to watch later. Please try again.");
    }
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <div className="pt-20 space-y-10">
        {Object.entries(moviesByGenre).map(([genre, movies]) => (
          <GenreRow 
            key={genre} 
            genre={genre} 
            movies={movies}
            onFavorite={handleAddToFavorites}
            onWatchLater={handleAddToWatchLater}
          />
        ))}
      </div>
    </div>
  );
}
