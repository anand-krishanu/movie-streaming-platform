import { FaClock, FaPlay, FaPlus, FaThumbsUp, FaChevronDown } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import useAuthStore from "../context/useAuthStore";
import { toast } from "react-toastify";

const MovieCard = ({ movie }) => {
  const [watchLaterLoading, setWatchLaterLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState(null);
  const cardRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const { dbUser, userData, toggleWatchLater } = useAuthStore();

  // Map backend field names to frontend
  const movieId = movie.movieId || movie._id || movie.id;
  const title = movie.movieTitle || movie.title;
  
  // Use moviePoster for movie tiles
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  let poster = movie.moviePoster;
  
  // If poster is relative path, make it absolute
  if (poster && !poster.startsWith('http')) {
    const cleanPath = poster.startsWith('/api') ? poster.substring(4) : poster;
    poster = baseURL + cleanPath;
  } else if (!poster) {
    poster = 'https://via.placeholder.com/300x450?text=No+Poster';
  }

  const gifUrl = movie.videoDetails?.previewGifUrl;
  const genres = movie.genres || movie.genre || [];
  const rating = movie.imdbRating || movie.rating || 'N/A';
  const duration = movie.videoDetails?.durationSeconds 
    ? `${Math.floor(movie.videoDetails.durationSeconds / 60)}m` 
    : 'N/A';
  
  const releaseYear = movie.releaseYear || (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : (movie.year || 'N/A'));
  const matchPercentage = rating !== 'N/A' ? `${Math.round(parseFloat(rating) * 10)}% Match` : 'New';

  const isInWatchLater = userData?.watchLaterMovieIds?.includes(movieId);

  // Close popup on scroll
  useEffect(() => {
    const handleScroll = () => setIsHovered(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const handleWatchLaterClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dbUser || dbUser._isFallback) {
      toast.warning("Please login to add to watch later.");
      return;
    }
    
    if (!userData || !userData.email) {
      toast.warning("Please wait, syncing user data...");
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

  // If no GIF is available, use the simple hover effect (Old Style)
  if (!gifUrl) {
    return (
      <div className="relative bg-zinc-900 rounded-xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-200">
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

        <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
          <Link to={`/player/${movieId}`}>
            <h3 className="text-lg font-semibold truncate hover:underline">{title}</h3>
          </Link>
          <p className="text-sm text-gray-300">{Array.isArray(genres) ? genres.join(", ") : genres}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-yellow-400 font-medium">{rating}</span>
            <div className="flex gap-3">
              <button
                onClick={handleWatchLaterClick}
                className={`transition-colors ${isInWatchLater ? "text-blue-400" : "text-white hover:text-blue-400"}`}
                title={isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
              >
                <FaClock />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle Hover Logic for Popup Card
  const handleMouseEnter = () => {
    // Cancel any pending leave (e.g. coming back from popup or flickering)
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    // If already showing, we don't need to do anything else
    if (isHovered) return;

    hoverTimeoutRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        // Calculate position to center the popup over the card but larger
        const scale = 1.3; // Reduced scale slightly for better look
        const width = rect.width * scale;
        
        // Center it
        const top = rect.top - (width * 0.56 - rect.height) / 2; // Maintain aspect ratio approx
        const left = rect.left - (width - rect.width) / 2;

        // Boundary checks (keep within viewport)
        let finalLeft = left;
        if (left < 10) finalLeft = 10;
        if (left + width > window.innerWidth - 10) finalLeft = window.innerWidth - width - 10;

        setHoverPos({ top, left: finalLeft, width, originalRect: rect });
        setIsHovered(true);
      }
    }, 500); // 500ms delay before popup
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Delay hiding to allow moving to popup
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300); // 300ms grace period
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    navigate(`/player/${movieId}`);
  };

  return (
    <>
      {/* Placeholder Card */}
      <div 
        ref={cardRef}
        className={`relative bg-zinc-900 rounded-md overflow-hidden shadow-md transition-opacity duration-200 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link to={`/player/${movieId}`}>
          <img
            src={poster}
            alt={title}
            className="w-full h-40 sm:h-64 object-cover cursor-pointer rounded-md"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
            }}
          />
        </Link>
      </div>

      {/* Portal Popup Card */}
      {isHovered && hoverPos && createPortal(
        <div 
          className="fixed z-50 bg-zinc-900 rounded-lg shadow-2xl overflow-hidden flex flex-col animate-fadeIn border border-zinc-700"
          style={{
            top: hoverPos.top,
            left: hoverPos.left,
            width: hoverPos.width,
            transformOrigin: 'center center',
            animation: 'scaleIn 0.2s ease-out forwards'
          }}
          onMouseEnter={() => {
            if (leaveTimeoutRef.current) {
              clearTimeout(leaveTimeoutRef.current);
              leaveTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Media Area */}
          <div className="relative w-full aspect-video bg-black cursor-pointer" onClick={handlePlayClick}>
            <img 
              src={gifUrl} 
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = poster; }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-zinc-900 to-transparent"></div>
          </div>

          {/* Info Area */}
          <div className="p-4 bg-zinc-900">
            {/* Action Buttons */}
            <div className="flex items-center gap-2 mb-3">
              <button 
                onClick={handlePlayClick}
                className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors"
                title="Play"
              >
                <FaPlay size={12} />
              </button>
              
              <button 
                onClick={handleWatchLaterClick}
                className="border-2 border-gray-500 text-white rounded-full p-2 hover:border-white transition-colors"
                title="Watch Later"
              >
                {isInWatchLater ? <FaPlus className="rotate-45" size={12} /> : <FaPlus size={12} />}
              </button>

              <button className="border-2 border-gray-500 text-white rounded-full p-2 hover:border-white transition-colors">
                <FaThumbsUp size={12} />
              </button>
              
              <button className="ml-auto border-2 border-gray-500 text-white rounded-full p-2 hover:border-white transition-colors">
                <FaChevronDown size={12} />
              </button>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold">
              <span className="text-green-400">{matchPercentage}</span>
              <span className="border border-gray-500 px-1 rounded text-gray-300">{releaseYear}</span>
              <span className="text-gray-300">{duration}</span>
              <span className="border border-gray-500 px-1 rounded text-xs text-gray-300">HD</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              {Array.isArray(genres) && genres.slice(0, 3).map((g, i) => (
                <span key={i}>
                  {g}{i < genres.slice(0, 3).length - 1 ? ' •' : ''}
                </span>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MovieCard;