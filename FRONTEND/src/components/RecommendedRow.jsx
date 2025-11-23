import React, { useEffect, useState } from "react";
import movieApi from "../api/movieApi";
import useAuthStore from "../context/useAuthStore";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";
import MovieCard from "./MovieCard";

export default function RecommendedRow() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { authInitialized } = useAuthStore();

  useEffect(() => {
    if (authInitialized) {
      fetchRecommendations();
    }
  }, [authInitialized]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const movies = await movieApi.getRecommendations(10);
      setRecommendations(movies);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError(err.message);
      // Don't show error to user, just silently fail
      // The row simply won't appear
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    const container = document.getElementById("recommended-scroll-container");
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

  // Don't render anything if loading, error, or no recommendations
  if (loading || error || !recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="px-4 md:px-8 mb-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FaStar className="w-6 h-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Recommended for You</h2>
      </div>

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
          id="recommended-scroll-container"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {recommendations.map((movie) => (
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
