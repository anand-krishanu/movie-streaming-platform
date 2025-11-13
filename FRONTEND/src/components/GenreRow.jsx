import React, { useRef } from "react";
import MovieCard from "./MovieCard";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function GenreRow({ genre, movies }) {
  const rowRef = useRef();

  const scroll = (direction) => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    const scrollTo =
      direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
    rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
  };

  return (
    <div className="relative px-8">
      <h2 className="text-2xl font-bold mb-3">{genre}</h2>

      {/* Left scroll button */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-70 p-3 rounded-full z-10"
      >
        <FaChevronLeft size={20} />
      </button>

      {/* Movie list */}
      <div
        ref={rowRef}
        className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 space-x-4 pb-4"
      >
        {Array.isArray(movies) &&
          movies.map((movie) => (
            <div key={movie.id} className="min-w-[180px]">
              <MovieCard movie={movie} />
            </div>
          ))}
      </div>

      {/* Right scroll button */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 hover:bg-opacity-70 p-3 rounded-full z-10"
      >
        <FaChevronRight size={20} />
      </button>
    </div>
  );
}