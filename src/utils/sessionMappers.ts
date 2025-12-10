/**
 * Utilidades para mapear estados de sesión entre backend y frontend
 *
 * Este módulo proporciona funciones para convertir los estados de sesión
 * del servidor (que usa 'estado': 'pending' | 'completed') a los estados
 * del cliente ('active' | 'paused' | 'completed'), y viceversa.
 *
 * Esto es crítico porque el backend no maneja estados temporales como
 * 'active' o 'paused', sino que los infiere del campo 'isRunning'.
 */

import type { SessionDto, ActiveSession } from '../types/api';

/**
 * Mapea un DTO de sesión del servidor a un objeto ActiveSession del cliente
 *
 * Reglas de mapeo:
 * - server.estado = "pending" AND server.isRunning=true → client.status = "active"
 * - server.estado = "pending" AND server.isRunning=false → client.status = "paused"
 * - server.estado = "completed" → client.status = "completed"
 *
 * @param dto - DTO recibido del servidor
 * @param persistedAt - Timestamp de cuando se persistió localmente (para expiración)
 * @returns Objeto ActiveSession listo para usar en el frontend
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
 * Calcula el tiempo visible de la sesión usando la fórmula correcta
 *
 * Fórmula: elapsedMs + (Date.now() - startTime) si está corriendo
 * O solo elapsedMs si está pausada
 *
 * @param session - Sesión activa
 * @returns Tiempo visible en milisegundos
 */
export function getVisibleTime(session: ActiveSession): number {
  if (session.isRunning) {
    // Si está corriendo, agregar el tiempo transcurrido desde startTime
    const startTimeMs = new Date(session.startTime).getTime();
    const now = Date.now();
    return session.elapsedMs + (now - startTimeMs);
  } else {
    // Si está pausada, mostrar solo elapsedMs
    return session.elapsedMs;
  }
}

/**
 * Formatea milisegundos a formato HH:MM:SS
 *
 * @param ms - Milisegundos
 * @returns String en formato HH:MM:SS
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Verifica si una sesión persistida ha expirado (más de 7 días)
 *
 * @param persistedAt - Timestamp de persistencia
 * @returns true si ha expirado
 */
export function isSessionExpired(persistedAt: string): boolean {
  const persistedDate = new Date(persistedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - persistedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > 7;
}