import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // backend runs on port 5000 by default
  withCredentials: true,
});

export default axiosInstance;