import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import MovieGrid from "../../components/MovieGrid";
import movieApi from "../../api/movieApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Watchlist() {
  const [loading, setLoading] = useState(true);
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const { dbUser, userData, refreshUserData } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!dbUser) {
      navigate("/login");
      return;
    }

    fetchWatchLater();
  }, [dbUser, navigate]);

  const fetchWatchLater = async () => {
    if (!dbUser || dbUser._isFallback) {
      setLoading(false);
      return;
    }

    try {
      // Refresh user data to get latest watchLaterMovieIds
      await refreshUserData();
      
      // Fetch full movie details for each watch later movie ID
      const watchLaterIds = userData?.watchLaterMovieIds || [];
      
      if (watchLaterIds.length > 0) {
        const moviePromises = watchLaterIds.map(id => movieApi.getMovieById(id));
        const movies = await Promise.all(moviePromises);
        setWatchLaterMovies(movies.filter(movie => movie !== null));
      } else {
        setWatchLaterMovies([]);
      }
    } catch (error) {
      console.error("Error fetching watch later:", error);
      toast.error("Failed to load watch later list");
    } finally {
      setLoading(false);
    }
  };

  // Refetch when userData changes (e.g., when watch later is toggled)
  useEffect(() => {
    if (userData?.watchLaterMovieIds) {
      const fetchMovieDetails = async () => {
        const watchLaterIds = userData.watchLaterMovieIds;
        
        if (watchLaterIds.length > 0) {
          try {
            const moviePromises = watchLaterIds.map(id => movieApi.getMovieById(id));
            const movies = await Promise.all(moviePromises);
            setWatchLaterMovies(movies.filter(movie => movie !== null));
          } catch (error) {
            console.error("Error fetching movie details:", error);
          }
        } else {
          setWatchLaterMovies([]);
        }
      };
      
      fetchMovieDetails();
    }
  }, [userData?.watchLaterMovieIds]);

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
      <div className="pt-20 px-8">
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
    </div>
  );
}
