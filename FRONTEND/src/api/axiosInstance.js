import axios from "axios";
import { auth } from "../firebase";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
});

// Add Firebase token to all requests
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting Firebase token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;