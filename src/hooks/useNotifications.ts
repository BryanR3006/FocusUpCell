// hooks/useNotifications.ts (VERSIÓN ORIGINAL - igual que en web)
import { useState, useEffect } from 'react';
import type { NotificationSettings, UpcomingNotification, NotificationConfigUpdate } from '../types/api';
import { notificationsApi } from '../utils/notificationsApi';

/**
 * Custom hook for managing notifications state and operations
 * Provides CRUD operations and loading states for notifications
 */
export const useNotifications = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    eventos: false,
    metodosPendientes: false,
    sesionesPendientes: false,
    motivacion: false,
  });
  const [upcomingNotifications, setUpcomingNotifications] = useState<UpcomingNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notification settings
   */
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getNotificationSettings();
      setSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notification settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a specific notification setting
   */
  const updateSetting = async (config: NotificationConfigUpdate) => {
    // Optimistic update
    const previousSettings = { ...settings };
    setSettings(prev => ({ ...prev, [config.tipo]: config.enabled }));

    try {
      const updatedSettings = await notificationsApi.updateNotificationSetting(config);
      setSettings(updatedSettings);
    } catch (err) {
      // Rollback on error
      setSettings(previousSettings);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification setting';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Fetch upcoming notifications
   */
  const fetchUpcomingNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getUpcomingNotifications();
      setUpcomingNotifications(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch upcoming notifications';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize data on mount
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchSettings(), fetchUpcomingNotifications()]);
      } catch (err) {
        console.error('Error loading notification data:', err);
      }
    };
    loadData();
  }, []);

  /**
   * Clear any current error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    settings,
    upcomingNotifications,
    loading,
    error,
    fetchSettings,
    updateSetting,
    fetchUpcomingNotifications,
    clearError,
  };
};