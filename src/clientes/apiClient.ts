import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import { API_BASE_URL } from "../utils/constants";
import type { ApiError } from "../types/api";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de solicitud para JWT
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta para manejo de errores
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || "Error de servidor",
      statusCode: error.response?.status || 500,
      error: error.response?.data?.error || "Unknown error",
    };
    return Promise.reject(apiError);
  }
);

export { apiClient };
