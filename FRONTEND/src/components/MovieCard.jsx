import { FaPlay } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function MovieCard({ movie }) {
  return (
    <div className="relative w-[180px] flex-shrink-0 group cursor-pointer">
      <img
        src={movie.thumbnail || "/poster_placeholder.jpg"}
        alt={movie.movieTitle}
        className="w-full h-[270px] object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
        <Link to={`/watch/${movie.movieId}`}>
          <FaPlay className="text-white" size={32} />
        </Link>
      </div>
      <h3 className="mt-2 text-sm text-center truncate">{movie.movieTitle}</h3>
    </div>
  );
}
