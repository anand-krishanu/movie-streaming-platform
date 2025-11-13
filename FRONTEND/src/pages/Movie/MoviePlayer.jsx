import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import MoviePlayerComponent from "../../components/MoviePlayerComponent";

export default function MoviePlayer() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/movies/${id}`);
      const data = await res.json();
      setMovie(data);
    };
    fetchMovie();
  }, [id]);

  if (!movie) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <MoviePlayerComponent
        title={movie.title}
        description={movie.description}
        videoUrl={movie.videoUrl}
        poster={movie.poster}
      />
    </div>
  );
}