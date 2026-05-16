import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || "https://gout-atop-protract.ngrok-free.dev") + "/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    'ngrok-skip-browser-warning': 'true'
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;