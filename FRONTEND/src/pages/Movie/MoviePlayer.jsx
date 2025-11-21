import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import MoviePlayerComponent from "../../components/MoviePlayerComponent";
import movieApi from "../../api/movieApi";

export default function MoviePlayer() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const data = await movieApi.getMovieById(id);
        setMovie(data);
      } catch (error) {
        console.error("Error fetching movie:", error);
      }
    };
    fetchMovie();
  }, [id]);

  if (!movie) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />
      <MoviePlayerComponent
        movieId={id}
        title={movie.title}
        description={movie.description}
        poster={movie.poster}
      />
    </div>
  );
}