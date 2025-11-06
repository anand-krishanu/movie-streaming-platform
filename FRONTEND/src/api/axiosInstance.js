import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080/api", // adjust if backend runs elsewhere
  withCredentials: true,
});

export default axiosInstance;