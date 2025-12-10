import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import { API_BASE_URL } from "../utils/constants";
import type { ApiError } from "../types/api";

import { API_ENDPOINTS } from "../utils/endpoints";
import type {
  PaginatedResponse,
  StudyMethod,
  Benefit,
} from "../types/api-responses";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de solicitud para JWT
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

// Interceptor de respuesta para manejo de errores
axiosInstance.interceptors.response.use(
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

class ApiClient {
  private http = axiosInstance;

  private get<T>(url: string) {
    return this.http.get<T>(url);
  }

  private post<T>(url: string, data?: any) {
    return this.http.post<T>(url, data);
  }

  private put<T>(url: string, data?: any) {
    return this.http.put<T>(url, data);
  }

  private delete<T>(url: string) {
    return this.http.delete<T>(url);
  }

  // ============================
  // Métodos de Features/Erickson
  // ============================

  async deleteAccount(): Promise<{ message: string }> {
    return this.delete<{ message: string }>(API_ENDPOINTS.PROFILE);
  }

  async getStudyMethods(): Promise<PaginatedResponse<StudyMethod>> {
    return this.get<PaginatedResponse<StudyMethod>>(API_ENDPOINTS.STUDY_METHODS);
  }

  async getStudyMethodById(id: string): Promise<StudyMethod> {
    return this.get<StudyMethod>(`${API_ENDPOINTS.STUDY_METHODS}/${id}`);
  }

  async getBenefits(): Promise<Benefit[]> {
    return this.get<Benefit[]>(API_ENDPOINTS.BENEFITS);
  }

  // Métodos legacy
  async getUsers() {
    return this.get(API_ENDPOINTS.USERS);
  }

  async getEvents() {
    return this.get(API_ENDPOINTS.EVENTS);
  }

  async getReports() {
    return this.get(API_ENDPOINTS.REPORTS);
  }

  async getActiveMethods() {
    return this.get(API_ENDPOINTS.ACTIVE_METHODS);
  }

  async getMethodProgress() {
    return this.get(API_ENDPOINTS.METHOD_PROGRESS);
  }

  async getSessionProgress() {
    return this.get(API_ENDPOINTS.SESSION_PROGRESS);
  }

  async getNotificationPreferences() {
    return this.get(API_ENDPOINTS.NOTIFICATIONS_PREFERENCES);
  }

  async getScheduledNotifications() {
    return this.get(API_ENDPOINTS.NOTIFICATIONS_SCHEDULED);
  }
}

// Export unificada
export const api = new ApiClient();

// Exporta el axiosInstance como "apiClient" para compatibilidad con Brayitan
export { axiosInstance as apiClient };
