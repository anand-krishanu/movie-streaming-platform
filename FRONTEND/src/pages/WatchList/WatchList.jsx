import React, { useEffect, useState, useRef } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import MovieGrid from "../../components/MovieGrid";
import movieApi from "../../api/movieApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Watchlist() {
  const [loading, setLoading] = useState(true);
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const { dbUser, userData, refreshUserData, authInitialized } = useAuthStore();
  const navigate = useNavigate();
  const hasRefreshed = useRef(false);

  useEffect(() => {
    if (authInitialized && !dbUser) {
      navigate("/login");
      return;
    }

    if (!authInitialized) return;

    // Refresh user data on mount to ensure we have latest watch later list
    if (!hasRefreshed.current && dbUser && !dbUser._isFallback) {
      hasRefreshed.current = true;
      refreshUserData().catch(err => console.error(err));
    }
  }, [dbUser, authInitialized, navigate, refreshUserData]);

  // Fetch movie details whenever the list of IDs changes
  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!dbUser) return;

      // If we don't have user data yet, or no watch later movies
      if (!userData?.watchLaterMovieIds || userData.watchLaterMovieIds.length === 0) {
        setWatchLaterMovies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const watchLaterIds = userData.watchLaterMovieIds;
        const moviePromises = watchLaterIds.map(id => movieApi.getMovieById(id));
        const movies = await Promise.all(moviePromises);
        setWatchLaterMovies(movies.filter(movie => movie !== null));
      } catch (error) {
        console.error("Error fetching movie details:", error);
        toast.error("Failed to load watch later list");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [userData?.watchLaterMovieIds, dbUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 flex justify-center items-center">
          <div className="text-xl">Loading your watch later list...</div>
        </div>
      </div>
    );
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 flex justify-center items-center">
          <div className="text-xl">Please login to view your watch later list</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-20 px-8 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Watch Later</h1>
          <p className="text-gray-400">
            {watchLaterMovies.length} movie{watchLaterMovies.length !== 1 ? 's' : ''} in your watch later list
          </p>
        </div>

        {watchLaterMovies.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">No movies to watch later</h2>
            <p className="text-gray-400 mb-6">Add movies you want to watch later!</p>
            <button
              onClick={() => navigate('/home')}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors"
            >
              Browse Movies
            </button>
          </div>
        ) : (
          <MovieGrid
            movies={watchLaterMovies}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
