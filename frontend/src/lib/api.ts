import axios from "axios";

const api = axios.create({
  // Configuración de la URL base del backend
  baseURL: "http://localhost:8000/api",
});

// Inyección de Token automáticamente
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
