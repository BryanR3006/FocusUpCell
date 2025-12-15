// utils/notificationsApi.ts (versión corregida para móvil)
import { API_BASE_URL, API_ENDPOINTS } from './constants';
import type { NotificationSettings, UpcomingNotification, NotificationConfigUpdate } from '../types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API integration layer for notifications operations
 * Versión móvil - Funciona igual que en web pero con AsyncStorage
 */
export const notificationsApi = {
  /**
   * Get current notification settings for the authenticated user
   */
  getNotificationSettings: async (): Promise<NotificationSettings> => {
    try {
      // Obtener token y userId de AsyncStorage (ASÍNCRONO)
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('userId'), // En móvil debería ser 'userId', no 'user_id'
      ]);

      console.log('Token from storage:', token ? 'Present' : 'Missing');
      console.log('UserID from storage:', userId ? 'Present' : 'Missing');

      if (!token || !userId) {
        throw new Error('No authentication token or user ID found');
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_PREFERENCES}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Limpiar credenciales expiradas
          await Promise.all([
            AsyncStorage.removeItem('token'),
            AsyncStorage.removeItem('userId'),
          ]);
          throw new Error('Authentication expired');
        }
        throw new Error('Failed to fetch notification settings');
      }

      const responseData = await response.json();

      // Handle both wrapped and direct response formats
      if (responseData.data) {
        return responseData.data;
      } else if (typeof responseData === 'object' && responseData !== null) {
        // Assume direct response format
        return responseData as NotificationSettings;
      } else {
        return {
          eventos: false,
          metodosPendientes: false,
          sesionesPendientes: false,
          motivacion: false,
        };
      }
    } catch (error) {
      console.error('Error in getNotificationSettings:', error);
      throw error;
    }
  },

  /**
   * Update notification settings
   */
  updateNotificationSetting: async (config: NotificationConfigUpdate): Promise<NotificationSettings> => {
    try {
      // Obtener token y userId de AsyncStorage
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('userId'),
      ]);

      if (!token || !userId) {
        throw new Error('No authentication token or user ID found');
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_PREFERENCES}/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await Promise.all([
            AsyncStorage.removeItem('token'),
            AsyncStorage.removeItem('userId'),
          ]);
          throw new Error('Authentication expired');
        }
        throw new Error('Failed to update notification settings');
      }

      const responseData = await response.json();

      // Handle both wrapped and direct response formats
      if (responseData.data) {
        return responseData.data;
      } else if (typeof responseData === 'object' && responseData !== null) {
        return responseData as NotificationSettings;
      } else {
        throw new Error('Invalid response format from update API');
      }
    } catch (error) {
      console.error('Error in updateNotificationSetting:', error);
      throw error;
    }
  },

  /**
   * Get upcoming scheduled notifications
   */
  getUpcomingNotifications: async (): Promise<UpcomingNotification[]> => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS_SCHEDULED}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('token');
          throw new Error('Authentication expired');
        }
        throw new Error('Failed to fetch upcoming notifications');
      }

      const responseData = await response.json();

      // Handle both wrapped and direct response formats
      if (responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      } else if (Array.isArray(responseData)) {
        return responseData;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error in getUpcomingNotifications:', error);
      throw error;
    }
  },

  /**
   * Función auxiliar para verificar almacenamiento
   */
  debugStorage: async (): Promise<void> => {
    try {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('userId'),
      ]);
      console.log('DEBUG Storage - Token:', token ? `Present (${token.length} chars)` : 'Missing');
      console.log('DEBUG Storage - UserID:', userId || 'Missing');
    } catch (error) {
      console.error('Debug storage error:', error);
    }
  },
};