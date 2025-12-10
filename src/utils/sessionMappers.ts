/**
 * Utilidades para mapear estados de sesión - Versión móvil completa y corregida
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
 *
 * Reglas:
 * - server.estado = "pending" → depende de isRunning:
 *      - isRunning = true  → "active"
 *      - isRunning = false → "paused"
 * - server.estado = "completed" → "completed"
 */
export function mapServerSession(
  dto: SessionDto,
  persistedAt: string = new Date().toISOString()
): ActiveSession {
  let clientStatus: 'active' | 'paused' | 'completed';

  if (dto.estado === 'completed') {
    clientStatus = 'completed';
  } else {
    clientStatus = dto.isRunning ? 'active' : 'paused';
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
 * Convierte estado del cliente → estado servidor
 */
export function mapClientToServerStatus(
  clientStatus: 'active' | 'paused' | 'completed'
): 'pending' | 'completed' {
  return clientStatus === 'completed' ? 'completed' : 'pending';
}

/**
 * Formatea segundos → HH:MM:SS o MM:SS
 */
export function formatTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formatea milisegundos → HH:MM:SS
 */
export function formatTimeFromMs(ms: number): string {
  if (!ms || ms <= 0) return '0:00';
  return formatTime(Math.floor(ms / 1000));
}

/**
 * Verifica si la sesión persistida ha expirado (> 7 días)
 */
export function isSessionExpired(persistedAt: string): boolean {
  try {
    const persistedDate = new Date(persistedAt);
    const now = new Date();
    const daysDiff =
      (now.getTime() - persistedDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff > 7;
  } catch {
    return true;
  }
}

/**
 * Guarda sesión activa en AsyncStorage
 */
export async function saveSessionToStorage(
  session: ActiveSession
): Promise<void> {
  try {
    const sessionToStore = {
      ...session,
      persistedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.ACTIVE_SESSION,
      JSON.stringify(sessionToStore)
    );
  } catch (error) {
    console.error('Error guardando sesión:', error);
  }
}

/**
 * Carga sesión activa desde AsyncStorage
 */
export async function loadSessionFromStorage(): Promise<ActiveSession | null> {
  try {
    const sessionString = await AsyncStorage.getItem(
      STORAGE_KEYS.ACTIVE_SESSION
    );

    if (!sessionString) return null;

    const session = JSON.parse(sessionString) as ActiveSession;

    if (session.persistedAt && isSessionExpired(session.persistedAt)) {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      await AsyncStorage.removeItem(STORAGE_KEYS.DIRECT_RESUME);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error cargando sesión:', error);
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.DIRECT_RESUME);
    return null;
  }
}

/**
 * Elimina la sesión persistida
 */
export async function removeSessionFromStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.DIRECT_RESUME);
  } catch (error) {
    console.error('Error eliminando sesión:', error);
  }
}

/**
 * Flag: ¿la app debe reanudar sesión al abrir?
 */
export async function hasDirectResumeFlag(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(STORAGE_KEYS.DIRECT_RESUME);
    return flag === 'true';
  } catch {
    return false;
  }
}

/**
 * Guardar flag de reanudación directa
 */
export async function setDirectResumeFlag(value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.DIRECT_RESUME,
      value.toString()
    );
  } catch (error) {
    console.error('Error estableciendo flag:', error);
  }
}

/**
 * Calcula tiempo visible real
 *
 * Fórmula:
 * - Si está corriendo → elapsedMs + (now - startTime)
 * - Si está pausada → elapsedMs
 */
export function getVisibleTime(session: ActiveSession): number {
  if (session.isRunning && session.startTime) {
    const startTimeMs = new Date(session.startTime).getTime();
    return (session.elapsedMs || 0) + (Date.now() - startTimeMs);
  }
  return session.elapsedMs || 0;
}
