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

/* ---------------------------------------------------------
   Utilidades internas
--------------------------------------------------------- */

const getAuthToken = async (): Promise<string> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  return token;
};

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

/* ---------------------------------------------------------
   Servicio principal
--------------------------------------------------------- */

class SessionService {
  /* -----------------------------------------
     Obtener detalles de una sesión
  ----------------------------------------- */
  async getSession(sessionId: string): Promise<SessionDto> {
    console.log('[SESSION SERVICE] Obteniendo sesión:', sessionId);
    const responseData = await makeRequest(`${API_ENDPOINTS.SESSIONS}/${sessionId}`, {
      method: 'GET',
    });

    const sessionData = responseData.data || responseData;
    return this.mapSnakeToCamel(sessionData);
  }

  /* -----------------------------------------
     Pausar sesión
  ----------------------------------------- */
  async pauseSession(sessionId: string, elapsedMs: number): Promise<void> {
    try {
      console.log('[SESSION SERVICE] Pausando sesión:', sessionId);

      const duracion = Math.floor(elapsedMs / 1000);

      await makeRequest(`/reports/sessions/${sessionId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'pending',
          estado: 'pending',
          elapsedMs,
          duracion,
        }),
      });

      console.log('Sesión pausada exitosamente');
    } catch (error) {
      console.error('Error pausando sesión:', error);
      throw error;
    }
  }

  /* -----------------------------------------
     Finish later
  ----------------------------------------- */
  async finishLater(sessionId: string, elapsedMs: number, notes?: string): Promise<void> {
    console.log('[SESSION SERVICE] finishLater:', sessionId);

    const duracion = Math.floor(elapsedMs / 1000);
    const payload: any = {
      status: 'pending',
      estado: 'pending',
      elapsedMs,
      duracion,
    };
    if (notes) payload.notes = notes;

    await makeRequest(`/reports/sessions/${sessionId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    console.log('Sesión marcada como finish-later');
  }

  /* -----------------------------------------
     Completar sesión
  ----------------------------------------- */
  async completeSession(sessionId: string, elapsedMs: number, notes?: string): Promise<void> {
    console.log('[SESSION SERVICE] Completando sesión:', sessionId);

    const duracion = Math.floor(elapsedMs / 1000);
    const payload: any = {
      status: 'completed',
      estado: 'completed',
      elapsedMs,
      duracion,
    };
    if (notes) payload.notes = notes;

    await makeRequest(`/reports/sessions/${sessionId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    console.log('Sesión completada');

    // Limpiar local
    await AsyncStorage.removeItem('focusup:activeSession');
    await AsyncStorage.removeItem('focusup:directResume');
  }

  /* -----------------------------------------
     Crear nueva sesión
  ----------------------------------------- */
  async startSession(payload: SessionCreateDto): Promise<SessionDto> {
    console.log('[SESSION SERVICE] Creando sesión');

    const responseData = await makeRequest(API_ENDPOINTS.SESSIONS, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const sessionData = responseData.data || responseData;

    if (sessionData.sessionId) {
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
    }

    return this.mapSnakeToCamel(sessionData);
  }

  /* -----------------------------------------
     Obtener desde evento
  ----------------------------------------- */
  async getSessionFromEvent(eventId: string): Promise<SessionDto> {
    const responseData = await makeRequest(`${API_ENDPOINTS.SESSIONS}/from-event/${eventId}`, {
      method: 'GET',
    });

    return this.mapSnakeToCamel(responseData.data || responseData);
  }

  /* -----------------------------------------
     Listar sesiones del usuario
  ----------------------------------------- */
  async listUserSessions(filters?: SessionFilters): Promise<SessionDto[]> {
    const params = new URLSearchParams();

    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const url = params.toString()
      ? `${API_ENDPOINTS.SESSIONS}?${params.toString()}`
      : API_ENDPOINTS.SESSIONS;

    const responseData = await makeRequest(url, { method: 'GET' });
    const sessions = responseData.data || responseData || [];

    return sessions.map((s: any) => this.mapSnakeToCamel(s));
  }

  /* -----------------------------------------
     Sesiones viejas pendientes
  ----------------------------------------- */
  async getPendingAged(days: number): Promise<SessionDto[]> {
    const responseData = await makeRequest(
      `${API_ENDPOINTS.SESSIONS}/pending-aged?days=${days}`,
      { method: 'GET' }
    );

    const sessions = responseData.data || responseData || [];
    return sessions.map((s: any) => this.mapSnakeToCamel(s));
  }

  /* -----------------------------------------
     Mapper snake_case → camelCase
  ----------------------------------------- */
  private mapSnakeToCamel(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(i => this.mapSnakeToCamel(i));

    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      newObj[camelKey] = typeof obj[key] === 'object'
        ? this.mapSnakeToCamel(obj[key])
        : obj[key];
    });
    return newObj;
  }

  /* -----------------------------------------
     Gestión local de sesión activa
  ----------------------------------------- */
  async getActiveSession(): Promise<ActiveSession | null> {
    try {
      const raw = await AsyncStorage.getItem('focusup:activeSession');
      if (!raw) return null;

      const session = JSON.parse(raw) as ActiveSession;

      if (session.persistedAt) {
        const daysDiff =
          (Date.now() - new Date(session.persistedAt).getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysDiff > 7) {
          await AsyncStorage.removeItem('focusup:activeSession');
          return null;
        }
      }

      return session;
    } catch {
      return null;
    }
  }

  async saveActiveSession(session: ActiveSession): Promise<void> {
    await AsyncStorage.setItem(
      'focusup:activeSession',
      JSON.stringify({ ...session, persistedAt: new Date().toISOString() })
    );
  }

  async clearActiveSession(): Promise<void> {
    await AsyncStorage.removeItem('focusup:activeSession');
    await AsyncStorage.removeItem('focusup:directResume');
  }

  async checkAndRestoreSession(): Promise<ActiveSession | null> {
    const direct = await AsyncStorage.getItem('focusup:directResume');
    if (direct === 'true') {
      const session = await this.getActiveSession();
      await AsyncStorage.removeItem('focusup:directResume');
      return session;
    }
    return null;
  }

  /* -----------------------------------------
     Enlaces para mappers
  ----------------------------------------- */
  mapServerSession(dto: SessionDto, persistedAt?: string): ActiveSession {
    return mapServerSession(dto, persistedAt);
  }

  mapClientToServerStatus(
    status: 'active' | 'paused' | 'completed'
  ): 'pending' | 'completed' {
    return mapClientToServerStatus(status);
  }
}

/* Exportar singleton */
const sessionServiceInstance = new SessionService();
export { sessionServiceInstance as sessionService };
export default sessionServiceInstance;
