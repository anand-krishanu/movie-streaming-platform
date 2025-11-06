import { create } from "zustand";
import axios from "../api/axiosInstance";

export const useMovieStore = create((set) => ({
  moviesByGenre: {},
  loading: false,

  fetchMovies: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/movies");
      const movies = res.data;

      const grouped = movies.reduce((acc, movie) => {
        const g = movie.genre || "Other";
        if (!acc[g]) acc[g] = [];
        acc[g].push(movie);
        return acc;
      }, {});

      set({ moviesByGenre: grouped, loading: false });
    } catch (e) {
      console.error("Failed to fetch movies:", e);
      set({ loading: false });
    }
  },
}));