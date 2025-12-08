import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import MovieGrid from '../../components/MovieGrid';
import movieApi from '../../api/movieApi';
import { toast } from 'react-toastify';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    const searchMovies = async () => {
      setLoading(true);
      try {
        console.log('[SEARCH] Searching for:', query);
        // BACKEND SEARCH (paginated response from /movies/search)
        const response = await movieApi.searchMovies(query);
        console.log('[SEARCH] Raw response:', response);

        // Normalize to array of movies
        const movieList = Array.isArray(response) ? response : (response?.content || []);
        setMovies(movieList);

        if (movieList.length === 0) {
          toast.info(`No movies found for "${query}"`);
        }
      } catch (error) {
        console.error('[ERROR] Search failed:', error);
        toast.error('Failed to search movies');
      } finally {
        setLoading(false);
      }
    };

    searchMovies();
  }, [query]);

  if (!query) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Search Movies</h1>
          <p className="text-gray-400">Enter a search term to find movies</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-8 text-center">
          <div className="text-xl">Searching for "{query}"...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-20 px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Search Results</h1>
          <p className="text-gray-400">
            {movies.length} result{movies.length !== 1 ? 's' : ''} for "{query}"
          </p>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-2xl font-semibold mb-2">No movies found</h2>
            <p className="text-gray-400 mb-6">Try a different search term</p>
          </div>
        ) : (
          <MovieGrid movies={movies} />
        )}
      </div>
      <Footer />
    </div>
  );
}
