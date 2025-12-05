import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from 'utils/constants';

class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private logout?: () => Promise<void>;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  setLogout(logout: () => Promise<void>) {
    this.logout = logout;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;

    // Get token from AsyncStorage
    const token = await AsyncStorage.getItem('token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const config: RequestInit = {
      headers,
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (response.status === 401) {
        if (this.logout) {
          await this.logout();
        }
        throw new ApiError(401, 'Unauthorized', await response.text());
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(response.status, `HTTP error! status: ${response.status}`, errorText);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      console.error('API request failed:', error);
      throw new ApiError(0, 'Network error', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async requestWithRetry(endpoint: string, options: RequestInit = {}, retries: number = 3): Promise<any> {
    let lastError: ApiError = new ApiError(0, 'Max retries exceeded');
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        if (error instanceof ApiError) {
          lastError = error;
          // Don't retry on client errors (4xx) except 408 timeout, or auth errors
          if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 401) {
            throw error;
          }
          // Retry on server errors (5xx), network errors (0), timeout (408), or auth (401)
        } else {
          lastError = new ApiError(0, 'Unknown error');
        }
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  // Users
  async getUsers() {
    return this.requestWithRetry(API_ENDPOINTS.USERS);
  }

  async post(endpoint: string, body: any) {
    return this.requestWithRetry(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  async put(endpoint: string, body: any) {
    return this.requestWithRetry(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  async patch(endpoint: string, body: any) {
    return this.requestWithRetry(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  }

  async delete(endpoint: string) {
    return this.requestWithRetry(endpoint, { method: 'DELETE' });
  }

  async get(endpoint: string) {
    return this.requestWithRetry(endpoint);
  }

  async getUserProfile() {
    return this.requestWithRetry(API_ENDPOINTS.PROFILE);
  }

  // Study Methods
  async getStudyMethods() {
    return this.requestWithRetry(API_ENDPOINTS.STUDY_METHODS);
  }

  async getStudyMethodById(id: string) {
    return this.requestWithRetry(`${API_ENDPOINTS.STUDY_METHODS}/${id}`);
  }

  // Benefits
  async getBenefits() {
    return this.requestWithRetry(API_ENDPOINTS.BENEFITS);
  }

  // Events
  async getEvents() {
    return this.requestWithRetry(API_ENDPOINTS.EVENTS);
  }

  // Reports & Progress
  async getReports() {
    return this.requestWithRetry(API_ENDPOINTS.REPORTS);
  }

  async getActiveMethods() {
    return this.requestWithRetry(API_ENDPOINTS.ACTIVE_METHODS);
  }

  async getMethodProgress() {
    return this.requestWithRetry(API_ENDPOINTS.METHOD_PROGRESS);
  }

  async getSessionProgress() {
    return this.requestWithRetry(API_ENDPOINTS.SESSION_PROGRESS);
  }

  // Notifications
  async getNotificationPreferences() {
    return this.requestWithRetry(API_ENDPOINTS.NOTIFICATIONS_PREFERENCES);
  }

  async getScheduledNotifications() {
    return this.requestWithRetry(API_ENDPOINTS.NOTIFICATIONS_SCHEDULED);
  }

  async getInterests() {
    return this.requestWithRetry(API_ENDPOINTS.INTERESES);
  }

  async getDistractions() {
    return this.requestWithRetry(API_ENDPOINTS.DISTRACCIONES);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.requestWithRetry(API_ENDPOINTS.CHANGE_PASSWORD, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
}

export const apiClient = new ApiClient();