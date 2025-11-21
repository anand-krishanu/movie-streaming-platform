import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import MovieGrid from "../../components/MovieGrid";
import movieApi from "../../api/movieApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function FavouritesPage() {
  const [loading, setLoading] = useState(true);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const { dbUser, userData, refreshUserData } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!dbUser) {
      navigate("/login");
      return;
    }

    fetchFavorites();
  }, [dbUser, navigate]);

  const fetchFavorites = async () => {
    if (!dbUser || dbUser._isFallback) {
      setLoading(false);
      return;
    }

    try {
      // Refresh user data to get latest favoriteMovieIds
      await refreshUserData();
      
      // Fetch full movie details for each favorite movie ID
      const favoriteIds = userData?.favoriteMovieIds || [];
      
      if (favoriteIds.length > 0) {
        const moviePromises = favoriteIds.map(id => movieApi.getMovieById(id));
        const movies = await Promise.all(moviePromises);
        setFavoriteMovies(movies.filter(movie => movie !== null));
      } else {
        setFavoriteMovies([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  // Refetch when userData changes (e.g., when a favorite is toggled)
  useEffect(() => {
    if (userData?.favoriteMovieIds) {
      const fetchMovieDetails = async () => {
        const favoriteIds = userData.favoriteMovieIds;
        
        if (favoriteIds.length > 0) {
          try {
            const moviePromises = favoriteIds.map(id => movieApi.getMovieById(id));
            const movies = await Promise.all(moviePromises);
            setFavoriteMovies(movies.filter(movie => movie !== null));
          } catch (error) {
            console.error("Error fetching movie details:", error);
          }
        } else {
          setFavoriteMovies([]);
        }
      };
      
      fetchMovieDetails();
    }
  }, [userData?.favoriteMovieIds]);

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
            <div className="text-6xl mb-4">❤️</div>
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
    </div>
  );
}