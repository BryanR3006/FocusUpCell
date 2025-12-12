import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from 'utils/constants';
/**
 * Cliente API listo para producción para la aplicación móvil FocusUpCell
 *
 * Características:
 * - Soporte completo de TypeScript con genéricos
 * - Autenticación automática con token Bearer
 * - Tiempos de espera de solicitud con AbortController
 * - Lógica de reintento con retroceso exponencial
 * - Manejo centralizado de errores
 * - Actualización de token con cola de solicitudes
 * - Registro de depuración en desarrollo
 * - Solicitudes cancelables
 */

import {
  ApiError,
  ApiRequestOptions,
  ApiResponse,
  TokenPair,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfileResponse,
  LoginResponse,
  RegisterResponse,
  PaginatedResponse
} from '../types/api';
import { StudyMethod, Benefit } from '../types/studyMethod';
import { getAuthBridge } from './authBridge';

// Constantes de configuración
const DEFAULT_TIMEOUT = 15_000; // 15 segundos
const DEFAULT_RETRIES = 3;
const BASE_RETRY_DELAY = 300; // ms
const RETRY_MULTIPLIER = 2;

// Gestión del estado de actualización de token
interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  request: () => Promise<any>;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isRefreshing = false;

  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ resolve, reject, request });

      if (!this.isRefreshing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    this.isRefreshing = true;

    try {
      // Procesar todas las solicitudes en cola
      const promises = this.queue.map(async ({ request, resolve, reject }) => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      await Promise.allSettled(promises);
    } finally {
      this.queue = [];
      this.isRefreshing = false;
    }
  }
}

class ApiClient {
  private baseURL: string;
  private requestQueue = new RequestQueue();
  private refreshPromise: Promise<TokenPair> | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Métodos HTTP principales con soporte completo de TypeScript
  async get<T = any>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T = any>(path: string, body?: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async put<T = any>(path: string, body?: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  async patch<T = any>(path: string, body?: any, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  async delete<T = any>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  // Manejador principal de solicitudes con lógica de reintento y mapeo de errores
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      timeout = DEFAULT_TIMEOUT,
      skipAuth = false,
      retries = DEFAULT_RETRIES,
      headers = {}
    } = options;

    return this.requestWithRetry(
      () => this.makeRequest<T>(method, path, body, { timeout, skipAuth, headers }),
      method,
      retries
    );
  }

  // Ejecutar solicitud única con timeout y autenticación
  private async makeRequest<T>(
    method: string,
    path: string,
    body?: any,
    config = { timeout: DEFAULT_TIMEOUT, skipAuth: false, headers: {} as Record<string, string> }
  ): Promise<T> {
    const { timeout, skipAuth, headers } = config;
    const url = `${this.baseURL}${path}`;

    // Preparar encabezados
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Agregar encabezado de autenticación a menos que se omita
    if (!skipAuth) {
      const token = await getAuthBridge().getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Crear controlador de aborto para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      signal: controller.signal
    };

    // Agregar cuerpo para solicitudes que no sean GET
    if (body !== undefined && method !== 'GET') {
      requestConfig.body = JSON.stringify(body);
    }

    // Registro de depuración
    if (__DEV__) {
      console.log(`[API] ${method} ${url}`, {
        headers: { ...requestHeaders, Authorization: requestHeaders.Authorization ? '[REDACTED]' : undefined },
        body: body ? '[PRESENT]' : undefined
      });
    }

    try {
      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      // Manejar 401 - Flujo de actualización de token
      if (response.status === 401 && !skipAuth) {
        return this.handle401<T>(() => this.makeRequest<T>(method, path, body, config));
      }

      // Analizar respuesta
      const responseData = await this.parseResponse<T>(response);

      // Registro de depuración
      if (__DEV__) {
        console.log(`[API] ${method} ${url} -> ${response.status}`, responseData);
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw ApiError.timeout(`Request timeout after ${timeout}ms`);
        }
        throw ApiError.network(error.message, error);
      }

      throw ApiError.network('Unknown network error', error);
    }
  }

  // Manejar respuestas 401 con actualización de token
  private async handle401<T>(originalRequest: () => Promise<T>): Promise<T> {
    // Si ya se está actualizando, poner esta solicitud en cola
    if (this.refreshPromise) {
      return this.requestQueue.enqueue(originalRequest);
    }

    try {
      // Iniciar proceso de actualización
      this.refreshPromise = this.refreshAccessToken();

      const newTokens = await this.refreshPromise;

      // Actualizar tokens almacenados
      await getAuthBridge().setTokens(newTokens);

      // Reintentar solicitud original con nuevo token
      return originalRequest();
    } catch (refreshError) {
      // Actualización fallida - cerrar sesión del usuario
      await getAuthBridge().logout();
      throw ApiError.fromResponse(401, 'Sesión expirada. Por favor inicia sesión nuevamente.');
    } finally {
      this.refreshPromise = null;
    }
  }

  // Intentar actualizar token de acceso
  private async refreshAccessToken(): Promise<TokenPair> {
    const refreshToken = await getAuthBridge().getRefreshToken();

    if (!refreshToken) {
      throw new Error('No hay token de actualización disponible');
    }

    try {
      // Nota: Ajustar endpoint según tu API backend
      const response = await this.makeRequest<{ access_token: string; refresh_token?: string }>(
        'POST',
        '/auth/refresh',
        { refresh_token: refreshToken },
        { timeout: DEFAULT_TIMEOUT, skipAuth: true, headers: {} }
      );

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token
      };
    } catch (error) {
      if (__DEV__) {
        console.log('[API] Actualización de token fallida:', error);
      }
      throw error;
    }
  }

  // Analizar respuesta HTTP con mapeo de errores apropiado
  private async parseResponse<T>(response: Response): Promise<T> {
    let responseBody: any;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    } catch (parseError) {
      responseBody = null;
    }

    if (!response.ok) {
      throw ApiError.fromResponse(response.status, responseBody?.message || response.statusText, responseBody);
    }

    return responseBody as T;
  }

  // Lógica de reintento con retroceso exponencial
  private async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    method: string,
    maxRetries: number
  ): Promise<T> {
    let lastError: ApiError = ApiError.network('Solicitud fallida');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        const apiError = error instanceof ApiError ? error : ApiError.network('Error desconocido', error);
        lastError = apiError;

        // No reintentar errores del cliente (excepto 429 Demasiadas Solicitudes)
        if (apiError.status && apiError.status >= 400 && apiError.status < 500 && apiError.status !== 429) {
          throw apiError;
        }

        // No reintentar en el último intento
        if (attempt === maxRetries) {
          break;
        }

        // Calcular retraso con retroceso exponencial
        const delay = BASE_RETRY_DELAY * Math.pow(RETRY_MULTIPLIER, attempt);

        // Para 429, respetar encabezado Retry-After si está presente
        let actualDelay = delay;
        if (apiError.status === 429) {
          // Nota: En una implementación real, analizar encabezado Retry-After
          actualDelay = Math.max(delay, 1000); // Mínimo 1 segundo para límites de tasa
        }

        if (__DEV__) {
          console.log(`[API] Reintento ${attempt + 1}/${maxRetries} en ${actualDelay}ms para ${method}`);
        }

        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }

    throw lastError;
  }

  // Métodos API específicos del dominio
  async getUserProfile(): Promise<UserProfileResponse> {
    return this.get<UserProfileResponse>(API_ENDPOINTS.PROFILE);
  }

  async updateUserProfile(updates: UpdateProfileRequest): Promise<UserProfileResponse> {
    return this.put<UserProfileResponse>(API_ENDPOINTS.PROFILE, updates);
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return this.put<{ message: string }>(API_ENDPOINTS.CHANGE_PASSWORD, data);
  }

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

  // Métodos heredados para compatibilidad hacia atrás
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

// Export singleton instance
export const api = new ApiClient();

// Legacy export for backward compatibility
export const apiClient = api;