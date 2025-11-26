import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Users
  async getUsers() {
    return this.request(API_ENDPOINTS.USERS);
  }

  async getUserProfile() {
    return this.request(API_ENDPOINTS.PROFILE);
  }

  // Study Methods
  async getStudyMethods() {
    return this.request(API_ENDPOINTS.STUDY_METHODS);
  }

  async getStudyMethodById(id: string) {
    return this.request(`${API_ENDPOINTS.STUDY_METHODS}/${id}`);
  }

  // Benefits
  async getBenefits() {
    return this.request(API_ENDPOINTS.BENEFITS);
  }

  // Events
  async getEvents() {
    return this.request(API_ENDPOINTS.EVENTS);
  }

  // Reports & Progress
  async getReports() {
    return this.request(API_ENDPOINTS.REPORTS);
  }

  async getActiveMethods() {
    return this.request(API_ENDPOINTS.ACTIVE_METHODS);
  }

  async getMethodProgress() {
    return this.request(API_ENDPOINTS.METHOD_PROGRESS);
  }

  async getSessionProgress() {
    return this.request(API_ENDPOINTS.SESSION_PROGRESS);
  }

  // Notifications
  async getNotificationPreferences() {
    return this.request(API_ENDPOINTS.NOTIFICATIONS_PREFERENCES);
  }

  async getScheduledNotifications() {
    return this.request(API_ENDPOINTS.NOTIFICATIONS_SCHEDULED);
  }
}

export const apiClient = new ApiClient();