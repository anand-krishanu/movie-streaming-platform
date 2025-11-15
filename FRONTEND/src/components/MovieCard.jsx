import { FaHeart, FaClock } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState } from "react";
import useAuthStore from "../context/useAuthStore";
import userApi from "../api/userApi";
import { toast } from "react-toastify";

const MovieCard = ({ movie, onFavorite, onWatchLater, showButtons = true }) => {
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [watchLaterLoading, setWatchLaterLoading] = useState(false);
  const { dbUser, userData, updateFavorites, updateWatchLater } = useAuthStore();

  const isInFavorites = userData?.favorites?.some(fav => fav._id === (movie._id || movie.id));
  const isInWatchLater = userData?.watchLater?.some(wl => wl._id === (movie._id || movie.id));

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dbUser || dbUser._isFallback) {
      toast.warning("Please refresh the page to reconnect to the database.");
      return;
    }
    
    if (favoriteLoading) return;
    
    setFavoriteLoading(true);
    try {
      const movieId = movie._id || movie.id;
      
      if (isInFavorites) {
        await userApi.removeFavorite(dbUser._id, movieId);
        updateFavorites(movieId, false);
        toast.success("Removed from favorites! 💔");
      } else {
        await userApi.addFavorite(dbUser._id, movieId);
        updateFavorites(movieId, true);
        toast.success("Added to favorites! ❤️");
      }
      
      // Call parent callback if provided
      if (onFavorite) {
        await onFavorite(movieId);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleWatchLaterClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dbUser || dbUser._isFallback) {
      toast.warning("Please refresh the page to reconnect to the database.");
      return;
    }
    
    if (watchLaterLoading) return;
    
    setWatchLaterLoading(true);
    try {
      const movieId = movie._id || movie.id;
      
      if (isInWatchLater) {
        await userApi.removeWatchLater(dbUser._id, movieId);
        updateWatchLater(movieId, false);
        toast.success("Removed from watch later! 🗑️");
      } else {
        await userApi.addWatchLater(dbUser._id, movieId);
        updateWatchLater(movieId, true);
        toast.success("Added to watch later! 🕒");
      }
      
      // Call parent callback if provided
      if (onWatchLater) {
        await onWatchLater(movieId);
      }
    } catch (error) {
      console.error("Error toggling watch later:", error);
      toast.error("Failed to update watch later");
    } finally {
      setWatchLaterLoading(false);
    }
  };

  return (
    <div className="relative bg-zinc-900 rounded-xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-200">
      {/* Wrap image with Link */}
      <Link to={`/player/${movie._id || movie.id}`}>
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-64 object-cover cursor-pointer"
        />
      </Link>

      {/* Overlay (optional clickable area) */}
      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
        <Link to={`/player/${movie._id || movie.id}`}>
          <h3 className="text-lg font-semibold truncate hover:underline">
            {movie.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-300">{Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre}</p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-yellow-400 font-medium">⭐ {movie.rating}</span>

          {showButtons && (
            <div className="flex gap-3">
              <button
                onClick={handleWatchLaterClick}
                disabled={watchLaterLoading || !dbUser || dbUser._isFallback}
                className={`transition-colors ${
                  watchLaterLoading ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  isInWatchLater ? "text-blue-400" : "text-white hover:text-blue-400"
                }`}
                title={isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
              >
                <FaClock />
              </button>
              <button
                onClick={handleFavoriteClick}
                disabled={favoriteLoading || !dbUser || dbUser._isFallback}
                className={`transition-colors ${
                  favoriteLoading ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  isInFavorites ? "text-red-400" : "text-white hover:text-red-500"
                }`}
                title={isInFavorites ? "Remove from Favorites" : "Add to Favorites"}
              >
                <FaHeart />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;