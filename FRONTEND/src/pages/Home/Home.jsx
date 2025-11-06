import { useEffect } from "react";
import { useMovieStore } from "../../context/useMovieStore";
import GenreRow from "../../components/GenreRow";
import Navbar from "../../components/Navbar";

export default function Home() {
  const { moviesByGenre, fetchMovies, loading } = useMovieStore();

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  if (loading) return <div className="text-center mt-20">Loading movies...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-20 px-10">
      <Navbar />
      {Object.keys(moviesByGenre).map((genre) => (
        <GenreRow key={genre} genre={genre} movies={moviesByGenre[genre]} />
      ))}
    </div>
  );
}