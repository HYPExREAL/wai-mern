import axios from "axios";

// This URL will be your Render backend URL after deployment
// For local development, it defaults to http://localhost:5000
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to add the JWT token to every request if it exists in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
