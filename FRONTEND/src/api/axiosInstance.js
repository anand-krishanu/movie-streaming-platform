import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // backend runs on port 5000 by default
  // Removed withCredentials to avoid CORS issues
});

export default axiosInstance;