/**
 * Proveedor global de estado para sesiones de concentración
 *
 * Este componente maneja todo el estado y lógica de las sesiones de concentración
 * a nivel global de la aplicación. Es crítico que este provider nunca se desmonte
 * durante la navegación SPA para mantener la persistencia del audio y el estado.
 *
 * Características principales:
 * - Estado global de sesión activa
 * - Sincronización multi-pestaña
 * - Cola offline para acciones críticas
 * - Detección de suspensión del sistema
 * - Persistencia automática en localStorage
 * - Integración con servicios de audio y métodos
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ActiveSession, SessionCreateDto } from '../types/api';
import { sessionService } from '../services/sessionService';
import { getBroadcastChannel, type BroadcastMessage } from '../utils/broadcastChannel';
import { getOfflineQueue } from '../utils/offlineQueue';
import { getSleepDetector } from '../utils/sleepDetector';
import { mapServerSession, isSessionExpired } from '../utils/sessionMappers';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { replaceIfSessionAlbum } from '../services/audioService';
import { getSongsByAlbumId } from '../utils/musicApi';

// Claves para localStorage
const SESSION_STORAGE_KEY = 'focusup:activeSession';

// Estado del provider
interface ProviderState {
  activeSession: ActiveSession | null;
  isMinimized: boolean;
  showContinueModal: boolean;
  isSyncing: boolean; // Indicador de sincronización offline
  tabLockToken: string | null; // Token para control multi-pestaña
  showCountdown: boolean; // Mostrar cuenta regresiva
}

// API del contexto
interface ConcentrationSessionContextType {
  // Gestión de sesiones
  startSession: (payload: SessionCreateDto) => Promise<void>;
  startSessionWithCountdown: (payload: SessionCreateDto) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  finishLater: () => Promise<void>;
  completeSession: () => Promise<void>;

  // Control de UI
  minimize: () => void;
  maximize: () => void;
  hideContinueModal: () => void;
  showCountdown: () => void;
  hideCountdown: () => void;

  // Acceso a estado
  getState: () => ProviderState;

  // Eventos
  onMethodCompleted: (callback: () => void) => () => void;
  onStateChange: (callback: (state: ProviderState) => void) => () => void;

  // Multi-pestaña
  broadcastState: () => void;
  acquireTabLock: () => boolean;
  releaseTabLock: () => void;

  // Direct resume
  checkDirectResume: () => void;
}

// Contexto
const ConcentrationSessionContext = createContext<ConcentrationSessionContextType | undefined>(undefined);

// Props del provider
interface ConcentrationSessionProviderProps {
  children: ReactNode;
}

/**
 * Proveedor global de sesiones de concentración
 */
export const ConcentrationSessionProvider: React.FC<ConcentrationSessionProviderProps> = ({ children }) => {
  // Estado principal
  const [state, setState] = useState<ProviderState>({
    activeSession: null,
    isMinimized: false,
    showContinueModal: false,
    isSyncing: false,
    tabLockToken: null,
    showCountdown: false,
  });

  // Refs para callbacks y estado persistente
  const methodCompletedCallbacks = useRef<Map<string, () => void>>(new Map());
  const stateChangeCallbacks = useRef<Map<string, (state: ProviderState) => void>>(new Map());
  const tabLockToken = useRef<string | null>(null);

  // Servicios
  const broadcastChannel = getBroadcastChannel();
  const offlineQueue = getOfflineQueue();
  const sleepDetector = getSleepDetector();

  /**
   * Inicializa el provider al montar
   */
  useEffect(() => {
    initializeProvider();
    setupBroadcastListeners();
    setupSleepDetection();

    // Cleanup al desmontar
    return () => {
      broadcastChannel.close();
      sleepDetector.stop();
    };
  }, []);

  /**
   * Inicializa el provider cargando estado persistido
   */
  const initializeProvider = useCallback(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      const directResume = localStorage.getItem('focusup:directResume');

      if (stored) {
        const parsed = JSON.parse(stored);

        // Verificar expiración
        if (isSessionExpired(parsed.persistedAt)) {
          console.log('Sesión expirada, eliminando');
          localStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem('focusup:directResume');
          return;
        }

        // Mapear sesión del servidor al cliente
        const session = mapServerSession(parsed, parsed.persistedAt);

        // Verificar que la sesión tenga un ID válido
        if (!session.sessionId) {
          console.warn('Sesión restaurada sin ID válido, eliminando');
          localStorage.removeItem(SESSION_STORAGE_KEY);
          localStorage.removeItem('focusup:directResume');
          return;
        }

        // Si la sesión estaba corriendo cuando se persistió, actualizar startTime al tiempo actual
        // para que el timer continue correctamente desde el punto de restauración
        const sessionWithCorrectedTimer = session.isRunning ? {
          ...session,
          startTime: new Date().toISOString(), // Nuevo punto de referencia para continuar el timer
        } : session;

        if (directResume === 'true') {
          // Continuación directa desde reportes - iniciar minimizada sin modal
          setState(prev => ({
            ...prev,
            activeSession: sessionWithCorrectedTimer,
            isMinimized: true,
            showContinueModal: false,
          }));
          localStorage.removeItem('focusup:directResume');
        } else {
          // Inicialización normal - mostrar modal de continuar
          setState(prev => ({
            ...prev,
            activeSession: sessionWithCorrectedTimer,
            showContinueModal: true,
          }));
        }

        // Broadcast a otras pestañas
        broadcastChannel.broadcastSessionUpdate(session);
      }
    } catch (error) {
      console.error('Error inicializando provider:', error);
      localStorage.removeItem('focusup:directResume');
    }
  }, []);

  /**
   * Configura listeners para broadcast multi-pestaña
   */
  const setupBroadcastListeners = useCallback(() => {
    broadcastChannel.addListener('session-provider', (message: BroadcastMessage) => {
      switch (message.type) {
        case 'SESSION_UPDATE':
          if (message.state) {
            setState(prev => ({
              ...prev,
              activeSession: message.state || null,
            }));
          }
          break;

        case 'SESSION_COMPLETED':
        case 'SESSION_PAUSED':
        case 'SESSION_RESUMED':
          // Recargar estado desde servidor si es necesario
          if (state.activeSession) {
            reloadSessionState(state.activeSession.sessionId);
          }
          break;
      }
    });
  }, [state.activeSession]);

  /**
   * Configura detección de suspensión del sistema
   */
  const setupSleepDetection = useCallback(() => {
    sleepDetector.addCallback('session-timer-correction', (sleptMs: number) => {
      console.log(`Corrigiendo timer después de ${sleptMs}ms de suspensión`);
      // La corrección ocurre automáticamente en getVisibleTime()
      // No necesitamos actualizar estado aquí
    });

    sleepDetector.start();
  }, []);

  /**
   * Recarga el estado de la sesión desde el servidor
   */
  const reloadSessionState = useCallback(async (sessionId: string) => {
    try {
      const sessionDto = await sessionService.getSession(sessionId);
      const session = mapServerSession(sessionDto);

      setState(prev => ({
        ...prev,
        activeSession: session,
      }));
    } catch (error) {
      console.error('Error recargando estado de sesión:', error);
    }
  }, []);

  /**
   * Persiste el estado en localStorage
   */
  const persistState = useCallback((session: ActiveSession | null) => {
    try {
      if (session) {
        // Si la sesión está corriendo, actualizar elapsedMs con el tiempo actual acumulado
        // para que al restaurar, el timer muestre el tiempo correcto
        const sessionToPersist = session.isRunning ? {
          ...session,
          elapsedMs: (session.elapsedMs || 0) + (session.startTime ? Date.now() - new Date(session.startTime).getTime() : 0),
        } : session;

        const toPersist = {
          ...sessionToPersist,
          persistedAt: new Date().toISOString(),
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toPersist));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error persistiendo estado:', error);
    }
  }, []);

  /**
   * Inicia una nueva sesión
   * Nota: La reproducción de música se maneja en el componente StartSession
   * para evitar el uso de hooks en servicios y mantener la separación de responsabilidades
   */
  const startSession = useCallback(async (payload: SessionCreateDto) => {
    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Crear sesión en el servidor
      const sessionDto = await sessionService.startSession(payload);
      const session = mapServerSession(sessionDto);

      // Para sesiones nuevas, asegurar que startTime esté establecido
      const sessionWithStartTime = {
        ...session,
        startTime: session.startTime || new Date().toISOString(),
        isRunning: true, // Nueva sesión siempre inicia corriendo
      };

      // Actualizar estado
      setState(prev => ({
        ...prev,
        activeSession: sessionWithStartTime,
        isMinimized: false,
        showContinueModal: false,
        isSyncing: false,
      }));

      // Persistir
      persistState(session);

      // Broadcast a otras pestañas
      broadcastChannel.broadcastSessionUpdate(session);

    } catch (error) {
      console.error('Error iniciando sesión:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [persistState]);

  /**
   * Pausa la sesión actual usando el nuevo endpoint de reportes
   *
   * Lógica del timer de pausa/resume:
   * - Al pausar: calcula tiempo total acumulado y lo guarda en elapsedMs
   * - Al resumir: establece nuevo startTime para continuar acumulando desde cero
   * - Timer visible = elapsedMs acumulado + (tiempo actual - startTime) si está corriendo
   * - Timer visible = elapsedMs acumulado si está pausado
   *
   * Actualización crítica: Se calcula elapsedMs correctamente y se usa
   * PATCH /api/v1/reports/sessions/{id}/progress con status "pending".
   */
  const pauseSession = useCallback(async () => {
    console.log('[PROVIDER] pauseSession called. Session ID:', state.activeSession?.sessionId, 'isRunning:', state.activeSession?.isRunning);
    if (!state.activeSession || !state.activeSession.isRunning) {
      console.log('[PROVIDER] pauseSession aborted: no active session or not running');
      return;
    }

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Calcular tiempo transcurrido correctamente
      // Fórmula: elapsedMs = (sesión.elapsedMs || 0) + (Date.now() - sesión.startTime)
      const currentElapsedMs = (state.activeSession.elapsedMs || 0) +
        (state.activeSession.startTime ? Date.now() - new Date(state.activeSession.startTime).getTime() : 0);

      console.log('[PROVIDER] Pausing session with elapsedMs:', currentElapsedMs);

      // Intentar pausa en servidor usando nuevo endpoint, o enqueue si offline
      if (navigator.onLine) {
        await sessionService.pauseSession(state.activeSession.sessionId, currentElapsedMs);
        console.log('[PROVIDER] Session paused successfully, report created');
      } else {
        offlineQueue.enqueue('pause', state.activeSession.sessionId, { elapsedMs: currentElapsedMs });
        console.log('[PROVIDER] Session pause enqueued for offline');
      }

      // Actualizar estado local con tiempo acumulado correcto
      // CRÍTICO: Actualizar elapsedMs para que el timer muestre el tiempo correcto cuando está pausado
      const updatedSession = {
        ...state.activeSession,
        elapsedMs: currentElapsedMs, // Guardar tiempo acumulado para mostrar timer correcto en pausa
        isRunning: false,
        pausedAt: new Date().toISOString(),
        status: 'paused' as const,
        serverEstado: 'pending' as const,
      };

      setState(prev => ({
        ...prev,
        activeSession: updatedSession,
        isSyncing: false,
      }));

      persistState(updatedSession);
      broadcastChannel.broadcastSessionPaused();

    } catch (error) {
      console.error('Error pausando sesión:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.activeSession]);

  /**
   * Reanuda la sesión pausada
   *
   * Lógica del timer de resume:
   * - Mantiene elapsedMs acumulado de la pausa anterior
   * - Establece nuevo startTime = Date.now() para que el timer continue acumulando desde cero
   * - Timer visible continuará sumando: elapsedMs + (Date.now() - nuevo startTime)
   */
  const resumeSession = useCallback(async () => {
    if (!state.activeSession || state.activeSession.isRunning) return;

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Intentar reanudar en servidor, o enqueue si offline
      if (navigator.onLine) {
        await sessionService.resumeSession(state.activeSession.sessionId);
      } else {
        offlineQueue.enqueue('resume', state.activeSession.sessionId);
      }

      // Actualizar estado local - mantener elapsedMs acumulado y actualizar startTime para continuar el timer
      // CRÍTICO: Nuevo startTime permite que el timer continue acumulando correctamente
      const updatedSession = {
        ...state.activeSession,
        startTime: new Date().toISOString(), // Nuevo punto de referencia para continuar acumulando tiempo
        isRunning: true,
        pausedAt: undefined,
        status: 'active' as const,
        serverEstado: 'pending' as const,
      };

      setState(prev => ({
        ...prev,
        activeSession: updatedSession,
        isSyncing: false,
      }));

      persistState(updatedSession);
      broadcastChannel.broadcastSessionResumed();

    } catch (error) {
      console.error('Error reanudando sesión:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.activeSession]);

  /**
   * Marca la sesión como "terminar más tarde"
   *
   * Actualización crítica: Se calcula elapsedMs correctamente usando la fórmula:
   * elapsedMs = (sesión.elapsedMs || 0) + (Date.now() - sesión.startTime)
   * y se pasa al nuevo endpoint PATCH /api/v1/reports/sessions/{id}/progress
   */
  const finishLater = useCallback(async () => {
    if (!state.activeSession) return;

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Calcular tiempo transcurrido correctamente
      // Fórmula: elapsedMs = (sesión.elapsedMs || 0) + (Date.now() - sesión.startTime)
      const currentElapsedMs = (state.activeSession.elapsedMs || 0) +
        (state.activeSession.startTime ? Date.now() - new Date(state.activeSession.startTime).getTime() : 0);

      if (navigator.onLine) {
        // Enviar PATCH con status "pending" y notas para marcar como aplazada
        await sessionService.finishLater(state.activeSession.sessionId, currentElapsedMs, "Aplazada desde UI");
      } else {
        offlineQueue.enqueue('finish-later', state.activeSession.sessionId, {
          elapsedMs: currentElapsedMs,
          notes: "Aplazada desde UI"
        });
      }

      // Limpiar estado
      setState(prev => ({
        ...prev,
        activeSession: null,
        isMinimized: false,
        isSyncing: false,
      }));

      persistState(null);
      broadcastChannel.broadcastSessionUpdate(null);

    } catch (error) {
      console.error('Error en finish later:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.activeSession]);

  /**
   * Completa la sesión
   *
   * Actualización crítica: Se calcula elapsedMs correctamente usando la fórmula:
   * elapsedMs = (sesión.elapsedMs || 0) + (Date.now() - sesión.startTime)
   * y se pasa al nuevo endpoint PATCH /api/v1/reports/sessions/{id}/progress
   */
  const completeSession = useCallback(async () => {
    if (!state.activeSession) return;

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Calcular tiempo transcurrido correctamente
      // Fórmula: elapsedMs = (sesión.elapsedMs || 0) + (Date.now() - sesión.startTime)
      const currentElapsedMs = (state.activeSession.elapsedMs || 0) +
        (state.activeSession.startTime ? Date.now() - new Date(state.activeSession.startTime).getTime() : 0);

      if (navigator.onLine) {
        // Enviar PATCH con status "completed", duracion y notas
        await sessionService.completeSession(state.activeSession.sessionId, currentElapsedMs, "Sesión completada exitosamente");
      } else {
        offlineQueue.enqueue('complete', state.activeSession.sessionId, {
          elapsedMs: currentElapsedMs,
          notes: "Sesión completada exitosamente"
        });
      }

      // Limpiar estado
      setState(prev => ({
        ...prev,
        activeSession: null,
        isMinimized: false,
        isSyncing: false,
      }));

      persistState(null);
      broadcastChannel.broadcastSessionUpdate(null);
      broadcastChannel.broadcastSessionCompleted();

    } catch (error) {
      console.error('Error completando sesión:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.activeSession]);

  /**
   * Minimiza la sesión
   */
  const minimize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: true }));
  }, []);

  /**
   * Maximiza la sesión
   */
  const maximize = useCallback(() => {
    setState(prev => ({ ...prev, isMinimized: false }));
  }, []);

  /**
   * Oculta el modal de continuar sesión
   */
  const hideContinueModal = useCallback(() => {
    setState(prev => ({ ...prev, showContinueModal: false }));
  }, []);

  /**
   * Obtiene el estado actual
   */
  const getState = useCallback(() => state, [state]);

  /**
   * Registra callback para completación de método
   */
  const onMethodCompleted = useCallback((callback: () => void) => {
    const id = `method-callback-${Date.now()}-${Math.random()}`;
    methodCompletedCallbacks.current.set(id, callback);

    return () => {
      methodCompletedCallbacks.current.delete(id);
    };
  }, []);

  /**
   * Registra callback para cambios de estado
   */
  const onStateChange = useCallback((callback: (state: ProviderState) => void) => {
    const id = `state-callback-${Date.now()}-${Math.random()}`;
    stateChangeCallbacks.current.set(id, callback);

    return () => {
      stateChangeCallbacks.current.delete(id);
    };
  }, []);

  /**
   * Broadcast estado a otras pestañas
   */
  const broadcastState = useCallback(() => {
    broadcastChannel.broadcastSessionUpdate(state.activeSession);
  }, [state.activeSession]);

  /**
   * Adquiere lock para control del timer
   */
  const acquireTabLock = useCallback((): boolean => {
    if (!tabLockToken.current) {
      tabLockToken.current = `lock-${Date.now()}-${Math.random()}`;
      setState(prev => ({ ...prev, tabLockToken: tabLockToken.current }));
      broadcastChannel.broadcastLockAcquired(tabLockToken.current!);
      return true;
    }
    return false;
  }, []);

  /**
   * Libera lock del timer
   */
  const releaseTabLock = useCallback(() => {
    tabLockToken.current = null;
    setState(prev => ({ ...prev, tabLockToken: null }));
    broadcastChannel.broadcastLockReleased();
  }, []);


  /**
   * Inicia sesión con cuenta regresiva
   */
  const startSessionWithCountdown = useCallback(async (_payload: SessionCreateDto) => {
    // Mostrar cuenta regresiva
    setState(prev => ({ ...prev, showCountdown: true }));
  }, []);

  /**
   * Muestra la cuenta regresiva
   */
  const showCountdown = useCallback(() => {
    setState(prev => ({ ...prev, showCountdown: true }));
  }, []);

  /**
   * Oculta la cuenta regresiva
   */
  const hideCountdown = useCallback(() => {
    setState(prev => ({ ...prev, showCountdown: false }));
  }, []);

  /**
   * Verifica si hay una reanudación directa pendiente
   */
  const checkDirectResume = useCallback(() => {
    const directResume = localStorage.getItem('focusup:directResume');
    console.log('[PROVIDER] checkDirectResume called, directResume flag:', directResume);

    if (directResume === 'true') {
      console.log('[PROVIDER] Processing direct resume');

      // Re-run initialization
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        console.log('[PROVIDER] Stored session data:', stored ? JSON.parse(stored) : null);

        if (stored) {
          const parsed = JSON.parse(stored);

          // Verificar expiración
          if (isSessionExpired(parsed.persistedAt)) {
            console.log('[PROVIDER] Sesión expirada, eliminando');
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem('focusup:directResume');
            return;
          }

          // Mapear sesión del servidor al cliente
          const session = mapServerSession(parsed, parsed.persistedAt);
          console.log('[PROVIDER] Mapped session:', session);
          console.log('[PROVIDER] Session status before correction:', session.status, 'isRunning:', session.isRunning, 'elapsedMs:', session.elapsedMs);

          // Para sesiones reanudadas, asegurar que startTime esté establecido correctamente
          const sessionWithCorrectedTimer = session.isRunning ? {
            ...session,
            startTime: new Date().toISOString(), // Nuevo punto de referencia para continuar el timer
          } : session;

          console.log('[PROVIDER] Session with corrected timer:', sessionWithCorrectedTimer);
          console.log('[PROVIDER] Final session status:', sessionWithCorrectedTimer.status, 'isRunning:', sessionWithCorrectedTimer.isRunning);

          // Actualizar estado directamente sin mostrar modal
          setState(prev => ({
            ...prev,
            activeSession: sessionWithCorrectedTimer,
            isMinimized: true,
            showContinueModal: false,
          }));

          console.log('[PROVIDER] State updated, session restored. Checking if session gets paused automatically...');

          // Check if session is paused immediately after restore
          setTimeout(() => {
            console.log('[PROVIDER] Checking session status 1 second after restore:', state.activeSession?.status, 'isRunning:', state.activeSession?.isRunning);
          }, 1000);

          localStorage.removeItem('focusup:directResume');
        } else {
          console.log('[PROVIDER] No stored session data found');
        }
      } catch (error) {
        console.error('[PROVIDER] Error en checkDirectResume:', error);
        localStorage.removeItem('focusup:directResume');
      }
    } else {
      console.log('[PROVIDER] No direct resume pending');
    }
  }, []);

  // Notificar cambios de estado
  useEffect(() => {
    stateChangeCallbacks.current.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error en callback de cambio de estado:', error);
      }
    });
  }, [state]);

  // API del contexto
  const contextValue: ConcentrationSessionContextType = {
    startSession,
    startSessionWithCountdown,
    pauseSession,
    resumeSession,
    finishLater,
    completeSession,
    minimize,
    maximize,
    hideContinueModal,
    showCountdown,
    hideCountdown,
    getState,
    onMethodCompleted,
    onStateChange,
    broadcastState,
    acquireTabLock,
    releaseTabLock,
    checkDirectResume,
  };

  return (
    <ConcentrationSessionContext.Provider value={contextValue}>
      {children}
    </ConcentrationSessionContext.Provider>
  );
};

/**
 * Hook para usar el contexto de sesiones de concentración
 */
export const useConcentrationSession = () => {
  const context = useContext(ConcentrationSessionContext);
  if (context === undefined) {
    throw new Error('useConcentrationSession must be used within a ConcentrationSessionProvider');
  }
  return context;
};

export default ConcentrationSessionProvider;