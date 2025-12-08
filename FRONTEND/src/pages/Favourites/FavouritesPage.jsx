import React, { useEffect, useState, useRef } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import MovieGrid from "../../components/MovieGrid";
import movieApi from "../../api/movieApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function FavouritesPage() {
  const [loading, setLoading] = useState(true);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const { dbUser, userData, refreshUserData, authInitialized } = useAuthStore();
  const navigate = useNavigate();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (authInitialized && !dbUser) {
      navigate("/login");
      return;
    }

    if (!authInitialized) return;

    // Refresh user data on mount to ensure we have latest favorites
    if (!hasRefreshed.current && dbUser && !dbUser._isFallback) {
      hasRefreshed.current = true;
      refreshUserData().catch(err => console.error(err));
    }
  }, [dbUser, authInitialized, navigate, refreshUserData]);

  // Fetch movie details whenever the list of IDs changes
  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!dbUser) return;

      // If we don't have user data yet, or no favorites
      if (!userData?.favoriteMovieIds || userData.favoriteMovieIds.length === 0) {
        setFavoriteMovies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const favoriteIds = userData.favoriteMovieIds;
        const moviePromises = favoriteIds.map(id => movieApi.getMovieById(id));
        const movies = await Promise.all(moviePromises);
        setFavoriteMovies(movies.filter(movie => movie !== null));
      } catch (error) {
        console.error("Error fetching movie details:", error);
        toast.error("Failed to load favorites");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [userData?.favoriteMovieIds, dbUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 flex justify-center items-center">
          <div className="text-xl">Loading your favorites...</div>
        </div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 flex justify-center items-center">
          <div className="text-xl">Please login to view your favorites</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-20 px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Favorites</h1>
          <p className="text-gray-400">
            {favoriteMovies.length} movie{favoriteMovies.length !== 1 ? 's' : ''} in your favorites
          </p>
        </div>

        {favoriteMovies.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-gray-400 mb-6">Start adding movies to your favorites!</p>
            <button
              onClick={() => navigate('/home')}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <MovieGrid
            movies={favoriteMovies}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}