import { FaHeart, FaClock } from "react-icons/fa";
import { Link } from "react-router-dom";

const MovieCard = ({ movie, onFavorite, onWatchLater }) => {
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
        <p className="text-sm text-gray-300">{movie.genre}</p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-yellow-400 font-medium">⭐ {movie.rating}</span>

          <div className="flex gap-3">
            <button
              onClick={() => onWatchLater(movie._id || movie.id)}
              className="text-white hover:text-red-500"
            >
              <FaClock />
            </button>
            <button
              onClick={() => onFavorite(movie._id || movie.id)}
              className="text-white hover:text-red-500"
            >
              <FaHeart />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;