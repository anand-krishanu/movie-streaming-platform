import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import GenreRow from "../../components/GenreRow";
import MovieCarousel from "../../components/MovieCarousel";
import RecommendedRow from "../../components/RecommendedRow";
import movieApi from "../../api/movieApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [moviesByGenre, setMoviesByGenre] = useState({});
  const [loading, setLoading] = useState(true);
  const { user, authInitialized } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authInitialized && !user) {
      toast.info("Please login to browse movies");
      navigate("/login");
    }
  }, [user, authInitialized, navigate]);

  useEffect(() => {
    if (!user || !authInitialized) {
      return;
    }

    const fetchMovies = async () => {
      try {
        // Fetch all movies with a large page size to get most movies
        const response = await movieApi.fetchMovies({ page: 0, size: 100 });
        const movies = response.content;

        // Group movies by genre on the client side
        // Each movie can appear in multiple genre rows
        const grouped = {};
        movies.forEach(movie => {
          if (movie.genres && Array.isArray(movie.genres)) {
            movie.genres.forEach(genre => {
              if (!grouped[genre]) {
                grouped[genre] = [];
              }
              grouped[genre].push(movie);
            });
          }
        });
        
        setMoviesByGenre(grouped);
      } catch (err) {
        toast.error("Failed to load movies. Please try logging in again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [user, authInitialized]);

  if (!user || loading) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <div className="pt-20 pb-20">
        {/* Featured Movies Carousel */}
        <MovieCarousel />
        
        {/* Personalized Recommendations - Show first if user is logged in */}
        {user && <RecommendedRow />}
        
        {/* Genre Rows */}
        <div className="space-y-10">
          {Object.entries(moviesByGenre).map(([genre, movies]) => (
            <GenreRow 
              key={genre} 
              genre={genre} 
              movies={movies}
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
