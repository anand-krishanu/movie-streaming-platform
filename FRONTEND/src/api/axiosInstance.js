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
        console.log('[AUTH] Token attached to request:', config.url);
        console.log('[TOKEN] Token (first 20 chars):', token.substring(0, 20) + '...');
      } else {
        console.warn('[WARNING] No Firebase user found, request will be sent without token:', config.url);
      }
    } catch (error) {
      console.error('[ERROR] Error getting Firebase token:', error);
    }
    return config;
  },
  (error) => {
    console.error('[ERROR] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to log errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('[ERROR] API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('[ERROR] API No Response:', error.request);
    } else {
      console.error('[ERROR] API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;