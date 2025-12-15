import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FocusModeConfig } from '../types/focusMode';

interface FocusModeContextType {
  isActive: boolean;
  currentConfig: FocusModeConfig | null;
  startFocusMode: (config: FocusModeConfig) => Promise<void>;
  stopFocusMode: () => Promise<void>;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<FocusModeConfig | null>(null);

  useEffect(() => {
    loadFocusModeConfig();
  }, []);

  const loadFocusModeConfig = async () => {
    try {
      const configStr = await AsyncStorage.getItem('focusModeConfig');
      if (configStr) {
        const config: FocusModeConfig = JSON.parse(configStr);
        // Check if still active (endTime not passed)
        if (Date.now() < config.endTime) {
          setIsActive(true);
          setCurrentConfig(config);
          // TODO: Enable native services
        } else {
          // Expired, clean up
          await AsyncStorage.removeItem('focusModeConfig');
        }
      }
    } catch (error) {
      console.error('Error loading focus mode config:', error);
    }
  };

  const startFocusMode = async (config: FocusModeConfig) => {
    try {
      setIsActive(true);
      setCurrentConfig(config);
      await AsyncStorage.setItem('focusModeConfig', JSON.stringify(config));
      // TODO: Enable native services based on config
      if (config.blockApps) {
        // enableAppBlocking(config.blockedApps)
      }
      if (config.muteNotifications) {
        // enableNotificationBlocking(config.blockedApps)
      }
    } catch (error) {
      console.error('Error starting focus mode:', error);
      throw error;
    }
  };

  const stopFocusMode = async () => {
    try {
      setIsActive(false);
      setCurrentConfig(null);
      await AsyncStorage.removeItem('focusModeConfig');
      // TODO: Disable native services
      // disableAppBlocking()
      // disableNotificationBlocking()
    } catch (error) {
      console.error('Error stopping focus mode:', error);
      throw error;
    }
  };

  const value: FocusModeContextType = {
    isActive,
    currentConfig,
    startFocusMode,
    stopFocusMode,
  };

  return (
    <FocusModeContext.Provider value={value}>
      {children}
    </FocusModeContext.Provider>
  );
};

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (context === undefined) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

export default FocusModeContext;