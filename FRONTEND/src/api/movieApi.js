import axiosInstance from "./axiosInstance";

const movieApi = {
  // Get all movies with pagination
  fetchMovies: async ({ page = 0, size = 10 } = {}) => {
    const res = await axiosInstance.get(`/movies`, {
      params: { page, size }
    });
    return res.data;
  },

  // Get single movie by ID
  getMovieById: async (id) => {
    const res = await axiosInstance.get(`/movies/${id}`);
    return res.data;
  },

  // Search movies by title
  searchMovies: async (title) => {
    const res = await axiosInstance.get(`/movies/search`, {
      params: { title, page: 0, size: 50 }
    });
    return res.data;
  },

  // Filter movies by genre
  filterByGenre: async (genre, page = 0, size = 50) => {
    const res = await axiosInstance.get(`/movies/filter`, {
      params: { genre, page, size }
    });
    return res.data;
  },

  // Upload movie (admin)
  uploadMovie: async (formData) => {
    const res = await axiosInstance.post(`/movies/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },

  // Delete movie (admin)
  deleteMovie: async (id) => {
    const res = await axiosInstance.delete(`/movies/${id}`);
    return res.data;
  },

  // Get streaming URL
  getStreamUrl: (movieId) => {
    const baseURL = axiosInstance.defaults.baseURL;
    return `${baseURL}/movies/stream/${movieId}/master.m3u8`;
  },

  // Test endpoint
  hello: async () => {
    const res = await axiosInstance.get(`/movies/hello`);
    return res.data;
  }
};

export default movieApi;
