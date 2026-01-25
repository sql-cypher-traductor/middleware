import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/", // Configuración de la URL de conexión al backend
});

// Interceptor: Inyectar Token automáticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
