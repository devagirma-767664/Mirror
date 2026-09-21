// src/api/axios.ts
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://127.0.0.1:5000");

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantMatch = window.location.pathname.match(/^\/s\/([^/]+)/);
    const queryShop = new URLSearchParams(window.location.search).get("shop");
    const tenant = tenantMatch ? decodeURIComponent(tenantMatch[1]) : queryShop;
    if (tenant && !config.params?.shop) {
      config.params = { ...(config.params || {}), shop: tenant };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if(error.response?.status===402) window.dispatchEvent(new Event('subscription-required'));
    if(error.response?.status===401&&!['/auth/login','/auth/signup'].includes(String(error.config?.url))) window.dispatchEvent(new Event('session-expired'));
    // Normalize error so Redux always gets a string
    if (error.response?.data?.error) {
      return Promise.reject(error.response.data.error);
    }
    return Promise.reject(error.message || "Something went wrong");
  }
);

export default axiosInstance;
