import axiosInstance from "./axiosInstance";

const userApi = {
  // Authentication - Sync user after Firebase login
  syncUser: async () => {
    const res = await axiosInstance.post(`/auth/sync`);
    return res.data;
  },

  // Get current user profile (with favorites/watchLater populated)
  getCurrentUser: async () => {
    const res = await axiosInstance.get(`/auth/user`);
    return res.data;
  },

  // Get all users (admin)
  getAllUsers: async () => {
    const res = await axiosInstance.get(`/auth`);
    return res.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const res = await axiosInstance.get(`/auth/${id}`);
    return res.data;
  },

  // Toggle favorite (add or remove)
  toggleFavorite: async (movieId) => {
    const res = await axiosInstance.post(`/user/favorite/${movieId}`);
    return res.data;
  },

  // Toggle watch later (add or remove)
  toggleWatchLater: async (movieId) => {
    const res = await axiosInstance.post(`/user/watch-later/${movieId}`);
    return res.data;
  },

  // Send progress heartbeat
  updateProgress: async (movieId, seconds, duration) => {
    const res = await axiosInstance.post(`/user/progress`, {
      movieId,
      seconds,
      duration
    });
    return res.data;
  },

  // Get progress for a specific movie
  getMovieProgress: async (movieId) => {
    try {
      console.log(`[API] Fetching progress for movie: ${movieId}`);
      const res = await axiosInstance.get(`/user/progress/${movieId}`);
      console.log(`[API] Progress response:`, res.data);
      return res.data;
    } catch (error) {
      console.warn(`[API] Error fetching progress for ${movieId}:`, error.message);
      // 404 means no progress found, which is fine
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get continue watching list
  getContinueWatching: async () => {
    const res = await axiosInstance.get(`/user/continue-watching`);
    return res.data;
  }
};

export default userApi;