import React, { useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import movieApi from "../api/movieApi";
import MovieCard from "./MovieCard";

export default function SimilarMoviesRow({ movieId }) {
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    if (movieId) {
      fetchSimilarMovies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  const fetchSimilarMovies = async () => {
    try {
      setLoading(true);
      const movies = await movieApi.getSimilarMovies(movieId, 10);
      setSimilarMovies(movies);
    } catch (err) {
      console.error("Failed to fetch similar movies:", err);
      // Silently fail, don't show the row
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    const container = document.getElementById(`similar-scroll-${movieId}`);
    if (container) {
      const scrollAmount = 300;
      const newPosition =
        direction === "left"
          ? scrollPosition - scrollAmount
          : scrollPosition + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
      setScrollPosition(newPosition);
    }
  };

  // Don't render if no similar movies
  if (loading || !similarMovies || similarMovies.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      {/* Header */}
      <h2 className="text-2xl font-bold text-white mb-4">More Like This</h2>

      {/* Scrollable Container */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label="Scroll left"
        >
          <FaChevronLeft className="w-6 h-6" />
        </button>

        {/* Movies Grid */}
        <div
          id={`similar-scroll-${movieId}`}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {similarMovies.map((movie) => (
            <div key={movie.movieId} className="flex-shrink-0 w-48">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-label="Scroll right"
        >
          <FaChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
