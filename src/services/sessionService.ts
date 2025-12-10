/**
 * Servicio de API para operaciones de sesiones de concentración - Versión móvil
 * Adaptado para React Native/Expo con AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type {
  SessionDto,
  SessionCreateDto,
  SessionFilters,
  ActiveSession
} from '../types/api';
import { mapServerSession, mapClientToServerStatus } from '../utils/sessionMappers';

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async (): Promise<string> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

// Función auxiliar para hacer peticiones con manejo de errores
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado - limpiar almacenamiento
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userId');
        throw new Error('Authentication expired. Please login again.');
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request error:', error);
    throw error;
  }
};

/**
 * Servicio principal para operaciones de sesiones
 */
class SessionService {
  /**
   * Obtiene los detalles de una sesión específica
   *
   * @param sessionId - ID de la sesión
   * @returns DTO de la sesión con datos expandidos
   */
  async getSession(sessionId: string): Promise<SessionDto> {
    try {
      console.log('[SESSION SERVICE] Obteniendo sesión:', sessionId);
      
      const responseData = await makeRequest(`${API_ENDPOINTS.SESSIONS}/${sessionId}`, {
        method: 'GET',
      });

      const sessionData = responseData.data || responseData;
      
      // Mapear campos snake_case a camelCase si es necesario
      if (sessionData && typeof sessionData === 'object') {
        return this.mapSnakeToCamel(sessionData);
      }

      return sessionData;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      throw error;
    }
  }

  /**
   * Pausa una sesión activa usando el endpoint de reportes
   *
   * @param sessionId - ID de la sesión a pausar
   * @param elapsedMs - Tiempo transcurrido en milisegundos
   */
  async pauseSession(sessionId: string, elapsedMs: number): Promise<void> {
    try {
      console.log('[SESSION SERVICE] Pausando sesión:', sessionId);
      
      // Convertir milisegundos a segundos
      const duracion = Math.floor(elapsedMs / 1000);
      
      await makeRequest(`/reports/sessions/${sessionId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'pending',
          estado: 'pending',
          elapsedMs: elapsedMs,
          duracion: duracion
        }),
      });

      console.log('Sesión pausada exitosamente');
    } catch (error) {
      console.error('Error pausando sesión:', error);
      throw error;
    }
  }

  /**
   * Marca una sesión como "terminar más tarde"
   *
   * @param sessionId - ID de la sesión
   * @param elapsedMs - Tiempo transcurrido en milisegundos
   * @param notes - Notas adicionales para marcar como aplazada
   */
  async finishLater(sessionId: string, elapsedMs: number, notes?: string): Promise<void> {
    try {
      console.log('[SESSION SERVICE] Marcando sesión como "terminar más tarde":', sessionId);
      
      const duracion = Math.floor(elapsedMs / 1000);
      const payload: any = {
        status: 'pending',
        estado: 'pending',
        elapsedMs: elapsedMs,
        duracion: duracion
      };
      
      if (notes) {
        payload.notes = notes;
      }
      
      await makeRequest(`/reports/sessions/${sessionId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      console.log('Sesión marcada como "terminar más tarde" exitosamente');
    } catch (error) {
      console.error('Error marcando finish-later:', error);
      throw error;
    }
  }

  /**
   * Completa una sesión usando el endpoint de reportes
   *
   * @param sessionId - ID de la sesión a completar
   * @param elapsedMs - Tiempo transcurrido en milisegundos
   * @param notes - Notas adicionales para la sesión completada
   */
  async completeSession(sessionId: string, elapsedMs: number, notes?: string): Promise<void> {
    try {
      console.log('[SESSION SERVICE] Completando sesión:', sessionId);
      
      const duracion = Math.floor(elapsedMs / 1000);
      const payload: any = {
        status: 'completed',
        estado: 'completed',
        elapsedMs: elapsedMs,
        duracion: duracion
      };
      
      if (notes) {
        payload.notes = notes;
      }
      
      await makeRequest(`/reports/sessions/${sessionId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      console.log('Sesión completada exitosamente');
      
      // Limpiar sesión activa del almacenamiento
      await AsyncStorage.removeItem('focusup:activeSession');
      await AsyncStorage.removeItem('focusup:directResume');
    } catch (error) {
      console.error('Error completando sesión:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva sesión de concentración
   *
   * @param payload - Datos para crear la sesión
   * @returns DTO de la sesión creada
   */
  async startSession(payload: SessionCreateDto): Promise<SessionDto> {
    try {
      console.log('[SESSION SERVICE] Creando nueva sesión');
      
      const responseData = await makeRequest(API_ENDPOINTS.SESSIONS, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const sessionData = responseData.data || responseData;
      
      // Guardar en AsyncStorage como sesión activa
      if (sessionData && sessionData.sessionId) {
        const activeSession: ActiveSession = {
          sessionId: sessionData.sessionId,
          title: sessionData.title || 'Sesión de concentración',
          description: sessionData.description || '',
          type: sessionData.type || 'focus',
          eventId: sessionData.eventId,
          methodId: sessionData.methodId,
          albumId: sessionData.albumId,
          startTime: new Date().toISOString(),
          pausedAt: undefined,
          accumulatedMs: 0,
          isRunning: true,
          status: 'active',
          serverEstado: 'pending',
          elapsedMs: 0,
          persistedAt: new Date().toISOString(),
        };
        
        await AsyncStorage.setItem('focusup:activeSession', JSON.stringify(activeSession));
        console.log('Sesión activa guardada en AsyncStorage');
      }

      return this.mapSnakeToCamel(sessionData);
    } catch (error) {
      console.error('Error creando sesión:', error);
      throw error;
    }
  }

  /**
   * Crea o recupera una sesión desde un evento programado
   *
   * @param eventId - ID del evento programado
   * @returns DTO de la sesión creada/recuperada
   */
  async getSessionFromEvent(eventId: string): Promise<SessionDto> {
    try {
      console.log('[SESSION SERVICE] Obteniendo sesión desde evento:', eventId);
      
      const responseData = await makeRequest(`${API_ENDPOINTS.SESSIONS}/from-event/${eventId}`, {
        method: 'GET',
      });

      const sessionData = responseData.data || responseData;
      return this.mapSnakeToCamel(sessionData);
    } catch (error) {
      console.error('Error obteniendo sesión desde evento:', error);
      throw error;
    }
  }

  /**
   * Lista sesiones del usuario con filtros opcionales
   *
   * @param filters - Filtros opcionales para la consulta
   * @returns Array de DTOs de sesiones
   */
  async listUserSessions(filters?: SessionFilters): Promise<SessionDto[]> {
    try {
      console.log('[SESSION SERVICE] Listando sesiones del usuario');
      
      const params = new URLSearchParams();

      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const queryString = params.toString();
      const url = queryString
        ? `${API_ENDPOINTS.SESSIONS}?${queryString}`
        : API_ENDPOINTS.SESSIONS;

      const responseData = await makeRequest(url, {
        method: 'GET',
      });

      const sessionsArray = responseData.data || responseData || [];
      
      // Mapear cada sesión de snake_case a camelCase
      return sessionsArray.map((session: any) => this.mapSnakeToCamel(session));
    } catch (error) {
      console.error('Error listando sesiones:', error);
      throw error;
    }
  }

  /**
   * Obtiene sesiones pendientes que han estado inactivas por X días
   *
   * @param days - Número de días de inactividad
   * @returns Array de DTOs de sesiones
   */
  async getPendingAged(days: number): Promise<SessionDto[]> {
    try {
      console.log(`[SESSION SERVICE] Obteniendo sesiones pendientes de más de ${days} días`);
      
      const responseData = await makeRequest(`${API_ENDPOINTS.SESSIONS}/pending-aged?days=${days}`, {
        method: 'GET',
      });

      const sessionsArray = responseData.data || responseData || [];
      return sessionsArray.map((session: any) => this.mapSnakeToCamel(session));
    } catch (error) {
      console.error('Error obteniendo sesiones pendientes antiguas:', error);
      throw error;
    }
  }

  /**
   * Mapea un DTO del servidor a un objeto ActiveSession del cliente
   *
   * @param dto - DTO recibido del servidor
   * @param persistedAt - Timestamp de persistencia local
   * @returns Objeto ActiveSession listo para usar
   */
  mapServerSession(dto: SessionDto, persistedAt?: string): ActiveSession {
    return mapServerSession(dto, persistedAt);
  }

  /**
   * Convierte estado de cliente a estado de servidor
   *
   * @param clientStatus - Estado del cliente
   * @returns Estado del servidor
   */
  mapClientToServerStatus(clientStatus: 'active' | 'paused' | 'completed'): 'pending' | 'completed' {
    return mapClientToServerStatus(clientStatus);
  }

  /**
   * Función auxiliar para mapear campos snake_case a camelCase
   */
  private mapSnakeToCamel(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.mapSnakeToCamel(item));
    }

    const newObj: any = {};
    
    Object.keys(obj).forEach(key => {
      // Convertir snake_case a camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      if (obj[key] && typeof obj[key] === 'object') {
        newObj[camelKey] = this.mapSnakeToCamel(obj[key]);
      } else {
        newObj[camelKey] = obj[key];
      }
    });

    return newObj;
  }

  /**
   * Verifica si hay una sesión activa en AsyncStorage
   */
  async getActiveSession(): Promise<ActiveSession | null> {
    try {
      const sessionString = await AsyncStorage.getItem('focusup:activeSession');
      
      if (!sessionString) {
        return null;
      }

      const session = JSON.parse(sessionString) as ActiveSession;
      
      // Verificar si la sesión ha expirado (más de 7 días)
      if (session.persistedAt) {
        const persistedDate = new Date(session.persistedAt);
        const now = new Date();
        const daysDiff = (now.getTime() - persistedDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 7) {
          console.log('Sesión expirada, eliminando del almacenamiento');
          await AsyncStorage.removeItem('focusup:activeSession');
          return null;
        }
      }

      return session;
    } catch (error) {
      console.error('Error obteniendo sesión activa:', error);
      return null;
    }
  }

  /**
   * Guarda una sesión activa en AsyncStorage
   */
  async saveActiveSession(session: ActiveSession): Promise<void> {
    try {
      const sessionToStore = {
        ...session,
        persistedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('focusup:activeSession', JSON.stringify(sessionToStore));
      console.log('Sesión activa guardada en AsyncStorage');
    } catch (error) {
      console.error('Error guardando sesión activa:', error);
    }
  }

  /**
   * Elimina la sesión activa de AsyncStorage
   */
  async clearActiveSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem('focusup:activeSession');
      await AsyncStorage.removeItem('focusup:directResume');
      console.log('Sesión activa eliminada de AsyncStorage');
    } catch (error) {
      console.error('Error eliminando sesión activa:', error);
    }
  }

  /**
   * Verifica y restaura una sesión si hay un flag de reanudación directa
   */
  async checkAndRestoreSession(): Promise<ActiveSession | null> {
    try {
      const directResume = await AsyncStorage.getItem('focusup:directResume');
      
      if (directResume === 'true') {
        const session = await this.getActiveSession();
        
        if (session) {
          // Limpiar el flag de reanudación directa
          await AsyncStorage.removeItem('focusup:directResume');
          console.log('Sesión restaurada desde flag de reanudación directa');
          return session;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error verificando reanudación de sesión:', error);
      return null;
    }
  }
}

// Instancia singleton del servicio
const sessionServiceInstance = new SessionService();

export { sessionServiceInstance as sessionService };
export default sessionServiceInstance;