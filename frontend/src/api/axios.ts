// src/api/axios.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("🔍 DEBUG baseURL:", import.meta.env.VITE_API_URL);

// Attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error so Redux always gets a string
    if (error.response?.data?.error) {
      return Promise.reject(error.response.data.error);
    }
    return Promise.reject(error.message || "Something went wrong");
  }
);

export default axiosInstance;
