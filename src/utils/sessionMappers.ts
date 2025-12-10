/**
 * Utilidades para mapear estados de sesión - Versión móvil completa
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionDto, ActiveSession } from '../types/api';

// Claves de almacenamiento
const STORAGE_KEYS = {
  ACTIVE_SESSION: 'focusup:activeSession',
  DIRECT_RESUME: 'focusup:directResume',
} as const;

/**
 * Mapea un DTO de sesión del servidor a un objeto ActiveSession del cliente
 */
export function mapServerSession(dto: SessionDto, persistedAt: string = new Date().toISOString()): ActiveSession {
  // Determinar el estado del cliente basado en el estado del servidor
  let clientStatus: 'active' | 'paused' | 'completed';

  if (dto.estado === 'completed') {
    clientStatus = 'completed';
  } else if (dto.estado === 'pending') {
    // Para sesiones pendientes, el estado depende de isRunning
    clientStatus = dto.isRunning ? 'active' : 'paused';
  } else {
    // Fallback por si acaso
    clientStatus = 'paused';
  }

  return {
    sessionId: dto.sessionId,
    title: dto.title,
    description: dto.description,
    type: dto.type,
    eventId: dto.eventId,
    methodId: dto.methodId,
    albumId: dto.albumId,
    startTime: dto.startTime,
    pausedAt: dto.pausedAt,
    accumulatedMs: dto.accumulatedMs,
    isRunning: dto.isRunning,
    status: clientStatus,
    serverEstado: dto.estado,
    elapsedMs: dto.elapsedMs,
    persistedAt,
  };
}

/**
 * Convierte un estado de cliente a estado de servidor para envío
 *
 * @param clientStatus - Estado del cliente
 * @returns Estado del servidor
 */
export function mapClientToServerStatus(clientStatus: 'active' | 'paused' | 'completed'): 'pending' | 'completed' {
  if (clientStatus === 'completed') {
    return 'completed';
  }
  return 'pending'; // Tanto 'active' como 'paused' son 'pending' en el servidor
}

/**
 * Formatea segundos a formato HH:MM:SS o MM:SS
 */
export function formatTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) {
    return '0:00';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formatea milisegundos a formato HH:MM:SS
 */
export function formatTimeFromMs(ms: number): string {
  if (!ms || ms <= 0) {
    return '0:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  return formatTime(totalSeconds);
}

/**
 * Verifica si una sesión persistida ha expirado (más de 7 días)
 */
export function isSessionExpired(persistedAt: string): boolean {
  try {
    const persistedDate = new Date(persistedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - persistedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 7;
  } catch (error) {
    console.error('Error verificando expiración de sesión:', error);
    return true;
  }
}

/**
 * Guarda una sesión activa en AsyncStorage
 */
export async function saveSessionToStorage(session: ActiveSession): Promise<void> {
  try {
    const sessionToStore = {
      ...session,
      persistedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionToStore));
    console.log('Sesión guardada en AsyncStorage:', session.sessionId);
  } catch (error) {
    console.error('Error guardando sesión en AsyncStorage:', error);
  }
}

/**
 * Carga una sesión activa desde AsyncStorage
 */
export async function loadSessionFromStorage(): Promise<ActiveSession | null> {
  try {
    const sessionString = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    
    if (!sessionString) {
      return null;
    }

    const session = JSON.parse(sessionString) as ActiveSession;

    // Verificar si la sesión ha expirado
    if (session.persistedAt && isSessionExpired(session.persistedAt)) {
      console.log('Sesión expirada, eliminando del almacenamiento');
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      await AsyncStorage.removeItem(STORAGE_KEYS.DIRECT_RESUME);
      return null;
    }

    console.log('Sesión cargada desde AsyncStorage:', session.sessionId);
    return session;
  } catch (error) {
    console.error('Error cargando sesión desde AsyncStorage:', error);
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.DIRECT_RESUME);
    return null;
  }
}

/**
 * Elimina una sesión de AsyncStorage
 */
export async function removeSessionFromStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.DIRECT_RESUME);
    console.log('Sesión eliminada de AsyncStorage');
  } catch (error) {
    console.error('Error eliminando sesión de AsyncStorage:', error);
  }
}

/**
 * Verifica si hay una sesión pendiente de reanudación directa
 */
export async function hasDirectResumeFlag(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(STORAGE_KEYS.DIRECT_RESUME);
    return flag === 'true';
  } catch (error) {
    console.error('Error verificando flag de reanudación:', error);
    return false;
  }
}

/**
 * Establece el flag de reanudación directa
 */
export async function setDirectResumeFlag(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DIRECT_RESUME, value.toString());
  } catch (error) {
    console.error('Error estableciendo flag de reanudación:', error);
  }
}

/**
 * Calcula el tiempo visible de la sesión usando la fórmula correcta
 *
 * Fórmula: elapsedMs + (Date.now() - startTime) si está corriendo
 * O solo elapsedMs si está pausada
 *
 * @param session - Sesión activa
 * @returns Tiempo visible en milisegundos
 */
export function getVisibleTime(session: ActiveSession): number {
  if (session.isRunning && session.startTime) {
    // Si está corriendo, agregar el tiempo transcurrido desde startTime
    const startTimeMs = new Date(session.startTime).getTime();
    const now = Date.now();
    return (session.elapsedMs || 0) + (now - startTimeMs);
  } else {
    // Si está pausada, mostrar solo elapsedMs
    return session.elapsedMs || 0;
  }
}