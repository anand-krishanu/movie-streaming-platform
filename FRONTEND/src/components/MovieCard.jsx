import { FaClock } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState } from "react";
import useAuthStore from "../context/useAuthStore";
import { toast } from "react-toastify";

const MovieCard = ({ movie, showButtons = true }) => {
  const [watchLaterLoading, setWatchLaterLoading] = useState(false);
  const { dbUser, userData, toggleWatchLater } = useAuthStore();

  // Map backend field names to frontend
  const movieId = movie.movieId || movie._id || movie.id;
  const title = movie.movieTitle || movie.title;
  
  // Use moviePoster for movie tiles
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  let poster = movie.moviePoster;
  
  // If poster is relative path, make it absolute
  if (poster && !poster.startsWith('http')) {
    // Remove /api prefix if it exists since baseURL already includes it
    const cleanPath = poster.startsWith('/api') ? poster.substring(4) : poster;
    poster = baseURL + cleanPath;
  } else if (!poster) {
    poster = 'https://via.placeholder.com/300x450?text=No+Poster';
  }
  
  const genres = movie.genres || movie.genre || [];
  const rating = movie.imdbRating || movie.rating || 'N/A';

  const isInWatchLater = userData?.watchLaterMovieIds?.includes(movieId);

  const handleWatchLaterClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dbUser || dbUser._isFallback) {
      toast.warning("Please login to add to watch later.");
      return;
    }
    
    // Extra check: ensure user is synced with backend
    // Backend User has email as the identifier
    if (!userData || !userData.email) {
      toast.warning("Please wait, syncing user data...");
      console.log('[WARNING] User not fully synced yet, userData:', userData);
      return;
    }
    
    if (watchLaterLoading) return;
    
    setWatchLaterLoading(true);
    try {
      await toggleWatchLater(movieId);
      
      toast.success(isInWatchLater ? "Removed from watch later!" : "Added to watch later!");
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
      <Link to={`/player/${movieId}`}>
        <img
          src={poster}
          alt={title}
          className="w-full h-64 object-cover cursor-pointer"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
          }}
        />
      </Link>

      {/* Overlay (optional clickable area) */}
      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
        <Link to={`/player/${movieId}`}>
          <h3 className="text-lg font-semibold truncate hover:underline">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-gray-300">{Array.isArray(genres) ? genres.join(", ") : genres}</p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-yellow-400 font-medium">{rating}</span>

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;