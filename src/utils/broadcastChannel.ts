/**
 * Utilidades para sincronización multi-pestaña usando BroadcastChannel
 *
 * Este módulo maneja la comunicación entre múltiples pestañas del navegador
 * para mantener sincronizadas las sesiones de concentración. Es crítico para
 * prevenir conflictos cuando el usuario tiene múltiples pestañas abiertas.
 *
 * El canal se llama "focusup-session-sync" y transmite mensajes de tipo:
 * - SESSION_UPDATE: cuando una pestaña cambia el estado de la sesión
 * - TAB_LOCK_ACQUIRED: cuando una pestaña adquiere el control del timer
 * - TAB_LOCK_RELEASED: cuando una pestaña libera el control
 */

import type { ActiveSession } from '../types/api';

// Nombre del canal de broadcast
export const SESSION_SYNC_CHANNEL = 'focusup-session-sync';

// Tipos de mensajes que se pueden enviar por el canal
export type BroadcastMessageType =
  | 'SESSION_UPDATE'
  | 'TAB_LOCK_ACQUIRED'
  | 'TAB_LOCK_RELEASED'
  | 'SESSION_COMPLETED'
  | 'SESSION_PAUSED'
  | 'SESSION_RESUMED';

// Estructura de los mensajes broadcast
export interface BroadcastMessage {
  type: BroadcastMessageType;
  state?: ActiveSession | null;
  tabId: string;
  timestamp: string;
  lockToken?: string;
}

// Clase principal para manejar la sincronización
export class SessionBroadcastChannel {
  private channel: BroadcastChannel;
  private currentTabId: string;
  private listeners: Map<string, (message: BroadcastMessage) => void> = new Map();

  /**
   * Constructor - inicializa el canal de broadcast
   */
  constructor() {
    this.currentTabId = this.generateTabId();
    this.channel = new BroadcastChannel(SESSION_SYNC_CHANNEL);

    // Escuchar mensajes de otras pestañas
    this.channel.onmessage = (event) => {
      const message: BroadcastMessage = event.data;

      // Ignorar mensajes de la misma pestaña
      if (message.tabId === this.currentTabId) {
        return;
      }

      // Notificar a todos los listeners registrados
      this.listeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error en listener de broadcast:', error);
        }
      });
    };
  }

  /**
   * Genera un ID único para esta pestaña
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene el ID de la pestaña actual
   */
  getTabId(): string {
    return this.currentTabId;
  }

  /**
   * Registra un listener para mensajes broadcast
   *
   * @param id - Identificador único del listener
   * @param callback - Función a ejecutar cuando llega un mensaje
   */
  addListener(id: string, callback: (message: BroadcastMessage) => void): void {
    this.listeners.set(id, callback);
  }

  /**
   * Remueve un listener
   *
   * @param id - Identificador del listener a remover
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Envía una actualización de estado de sesión a otras pestañas
   *
   * @param state - Nuevo estado de la sesión
   */
  broadcastSessionUpdate(state: ActiveSession | null): void {
    const message: BroadcastMessage = {
      type: 'SESSION_UPDATE',
      state,
      tabId: this.currentTabId,
      timestamp: new Date().toISOString(),
    };

    this.channel.postMessage(message);
  }

  /**
   * Notifica que esta pestaña adquirió el control del timer
   *
   * @param lockToken - Token del lock adquirido
   */
  broadcastLockAcquired(lockToken: string): void {
    const message: BroadcastMessage = {
      type: 'TAB_LOCK_ACQUIRED',
      tabId: this.currentTabId,
      timestamp: new Date().toISOString(),
      lockToken,
    };

    this.channel.postMessage(message);
  }

  /**
   * Notifica que esta pestaña liberó el control del timer
   */
  broadcastLockReleased(): void {
    const message: BroadcastMessage = {
      type: 'TAB_LOCK_RELEASED',
      tabId: this.currentTabId,
      timestamp: new Date().toISOString(),
    };

    this.channel.postMessage(message);
  }

  /**
   * Notifica que la sesión fue completada
   */
  broadcastSessionCompleted(): void {
    const message: BroadcastMessage = {
      type: 'SESSION_COMPLETED',
      tabId: this.currentTabId,
      timestamp: new Date().toISOString(),
    };

    this.channel.postMessage(message);
  }

  /**
   * Notifica que la sesión fue pausada
   */
  broadcastSessionPaused(): void {
    const message: BroadcastMessage = {
      type: 'SESSION_PAUSED',
      tabId: this.currentTabId,
      timestamp: new Date().toISOString(),
    };

    this.channel.postMessage(message);
  }

  /**
   * Notifica que la sesión fue resumida
   */
  broadcastSessionResumed(): void {
    const message: BroadcastMessage = {
      type: 'SESSION_RESUMED',
      tabId: this.currentTabId,
      timestamp: new Date().toISOString(),
    };

    this.channel.postMessage(message);
  }

  /**
   * Cierra el canal de broadcast (llamar al desmontar)
   */
  close(): void {
    this.channel.close();
    this.listeners.clear();
  }
}

// Instancia singleton del canal
let broadcastChannelInstance: SessionBroadcastChannel | null = null;

/**
 * Obtiene la instancia singleton del canal de broadcast
 */
export function getBroadcastChannel(): SessionBroadcastChannel {
  if (!broadcastChannelInstance) {
    broadcastChannelInstance = new SessionBroadcastChannel();
  }
  return broadcastChannelInstance;
}

/**
 * Hook personalizado para usar el canal de broadcast en componentes
 */
export function useBroadcastChannel() {
  return getBroadcastChannel();
}