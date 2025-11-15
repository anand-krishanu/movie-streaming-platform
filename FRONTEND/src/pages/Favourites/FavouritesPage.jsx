import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import MovieGrid from "../../components/MovieGrid";
import userApi from "../../api/userApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function FavouritesPage() {
  const [loading, setLoading] = useState(true);
  const { dbUser, userData, refreshUserData, updateFavorites } = useAuthStore();
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
      await refreshUserData();
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (movieId) => {
    if (!dbUser || dbUser._isFallback) {
      toast.warning("Please refresh the page to reconnect to the database.");
      return;
    }

    try {
      await userApi.removeFavorite(dbUser._id, movieId);
      updateFavorites(movieId, false); // Update local state immediately
      toast.success("Removed from favorites! 💔");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error("Failed to remove from favorites");
      // Refresh data on error to sync with backend
      await refreshUserData();
    }
  };

  const handleAddToWatchLater = async (movieId) => {
    if (!dbUser || dbUser._isFallback) {
      toast.warning("Please refresh the page to reconnect to the database.");
      return;
    }

    try {
      await userApi.addWatchLater(dbUser._id, movieId);
      toast.success("Added to watch later! 🕒");
    } catch (error) {
      console.error("Error adding to watch later:", error);
      toast.error("Failed to add to watch later");
    }
  };

  const favoriteMovies = userData?.favorites || [];

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
            onFavorite={handleRemoveFavorite}
            onWatchLater={handleAddToWatchLater}
          />
        )}
      </div>
    </div>
  );
}