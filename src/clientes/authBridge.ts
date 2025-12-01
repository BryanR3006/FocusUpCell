/**
 * Puente de Autenticación - Maneja la comunicación entre el cliente API y AuthContext
 * Proporciona una interfaz limpia para operaciones de gestión de tokens y cierre de sesión
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenPair } from '../types/api';

export interface AuthBridge {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: TokenPair): Promise<void>;
  clearTokens(): Promise<void>;
  logout(): Promise<void>;
}

// Claves de almacenamiento
const ACCESS_TOKEN_KEY = 'token'; // Mantener clave existente por compatibilidad
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Implementación por defecto de AuthBridge
 * Se puede inyectar con implementación personalizada si es necesario
 */
class DefaultAuthBridge implements AuthBridge {
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error obteniendo token de acceso:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error obteniendo token de actualización:', error);
      return null;
    }
  }

  async setTokens(tokens: TokenPair): Promise<void> {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } catch (error) {
      console.error('Error configurando tokens:', error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    } catch (error) {
      console.error('Error limpiando tokens:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Limpiar todos los datos relacionados con autenticación
      await this.clearTokens();
      await AsyncStorage.removeItem('userData');

      // Nota: La lógica real de cierre de sesión (navegación, actualizaciones de estado)
      // debe ser manejada por AuthContext. Este puente solo maneja la limpieza de tokens.
      // El cliente API activará el cierre de sesión de AuthContext por separado.
    } catch (error) {
      console.error('Error durante cierre de sesión:', error);
      throw error;
    }
  }
}

// Instancia singleton
let authBridgeInstance: AuthBridge = new DefaultAuthBridge();

/**
 * Obtener la instancia actual del puente de autenticación
 */
export function getAuthBridge(): AuthBridge {
  return authBridgeInstance;
}

/**
 * Establecer una implementación personalizada del puente de autenticación
 * Útil para pruebas o flujos de autenticación personalizados
 */
export function setAuthBridge(bridge: AuthBridge): void {
  authBridgeInstance = bridge;
}

/**
 * Restablecer al puente de autenticación por defecto
 */
export function resetAuthBridge(): void {
  authBridgeInstance = new DefaultAuthBridge();
}