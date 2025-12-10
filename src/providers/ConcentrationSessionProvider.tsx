/**
 * Proveedor global de estado para sesiones de concentración - Versión móvil
 * Adaptado para React Native/Expo con AsyncStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Platform } from 'react-native';
import type { ActiveSession, SessionCreateDto } from '../types/api';
import { sessionService } from '../services/sessionService';
import { 
  mapServerSession, 
  isSessionExpired,
  saveSessionToStorage,
  loadSessionFromStorage,
  removeSessionFromStorage,
  hasDirectResumeFlag,
  setDirectResumeFlag
} from '../utils/sessionMappers';
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { replaceIfSessionAlbum } from '../services/audioService';
import { getSongsByAlbumId } from '../utils/musicApi';

// Claves para almacenamiento
const STORAGE_KEYS = {
  ACTIVE_SESSION: 'focusup:activeSession',
  DIRECT_RESUME: 'focusup:directResume',
  TAB_LOCK: 'focusup:tabLock',
} as const;

// Estado del provider
interface ProviderState {
  activeSession: ActiveSession | null;
  isMinimized: boolean;
  showContinueModal: boolean;
  isSyncing: boolean;
  tabLockToken: string | null;
  showCountdown: boolean;
  appState: AppStateStatus;
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
  getActiveSession: () => ActiveSession | null;

  // Eventos
  onMethodCompleted: (callback: () => void) => () => void;
  onStateChange: (callback: (state: ProviderState) => void) => () => void;

  // Reanudación directa
  checkDirectResume: () => Promise<boolean>;
  forceResumeSession: (session: ActiveSession) => Promise<void>;

  // Persistencia
  saveSession: (session: ActiveSession) => Promise<void>;
  clearSession: () => Promise<void>;
}

// Contexto
const ConcentrationSessionContext = createContext<ConcentrationSessionContextType | undefined>(undefined);

// Props del provider
interface ConcentrationSessionProviderProps {
  children: ReactNode;
}

/**
 * Proveedor global de sesiones de concentración para móvil
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
    appState: AppState.currentState,
  });

  // Refs para callbacks y estado persistente
  const methodCompletedCallbacks = useRef<Map<string, () => void>>(new Map());
  const stateChangeCallbacks = useRef<Map<string, (state: ProviderState) => void>>(new Map());
  const appStateRef = useRef(AppState.currentState);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateSubscriptionRef = useRef<any>(null);

  // Servicios
  const musicPlayer = useMusicPlayer();

  /**
   * Inicializa el provider al montar
   */
  useEffect(() => {
    initializeProvider();
    setupAppStateListener();
    startSessionInterval();

    // Cleanup al desmontar
    return () => {
      stopSessionInterval();
      appStateSubscriptionRef.current?.remove();
    };
  }, []);

  /**
   * Inicializa el provider cargando estado persistido
   */
  const initializeProvider = useCallback(async () => {
    try {
      console.log('[PROVIDER] Inicializando provider...');
      
      // Cargar sesión activa desde AsyncStorage
      const activeSession = await loadSessionFromStorage();
      const hasDirectResume = await hasDirectResumeFlag();

      if (activeSession) {
        console.log('[PROVIDER] Sesión cargada desde AsyncStorage:', activeSession.sessionId);
        
        if (hasDirectResume) {
          // Continuación directa desde reportes - iniciar minimizada sin modal
          console.log('[PROVIDER] Direct resume detected, starting minimized');
          
          const correctedSession = activeSession.isRunning ? {
            ...activeSession,
            startTime: new Date().toISOString(),
          } : activeSession;

          setState(prev => ({
            ...prev,
            activeSession: correctedSession,
            isMinimized: true,
            showContinueModal: false,
          }));

          await setDirectResumeFlag(false);
        } else {
          // Inicialización normal - mostrar modal de continuar
          console.log('[PROVIDER] Normal resume, showing continue modal');
          
          setState(prev => ({
            ...prev,
            activeSession,
            showContinueModal: true,
          }));
        }
      } else {
        console.log('[PROVIDER] No active session found in storage');
      }
    } catch (error) {
      console.error('[PROVIDER] Error inicializando provider:', error);
      await removeSessionFromStorage();
    }
  }, []);

  /**
   * Maneja cambios de estado de la app
   */
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    console.log('[PROVIDER] App state changed:', nextAppState);

    if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App en background - persistir estado actual
      if (state.activeSession) {
        await saveSessionToStorage(state.activeSession);
        console.log('[PROVIDER] Session saved to storage on background');
      }
    } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App vuelve al foreground - cargar estado
      const storedSession = await loadSessionFromStorage();
      if (storedSession) {
        setState(prev => ({
          ...prev,
          activeSession: storedSession,
        }));
        console.log('[PROVIDER] Session restored from storage on foreground');
      }
    }

    appStateRef.current = nextAppState;
    setState(prev => ({ ...prev, appState: nextAppState }));
  }, [state.activeSession]);

  /**
   * Configura listener para cambios de estado de la app
   */
  const setupAppStateListener = useCallback(() => {
    appStateSubscriptionRef.current = AppState.addEventListener('change', handleAppStateChange);
  }, [handleAppStateChange]);

  /**
   * Inicia el intervalo para actualizar el estado de la sesión
   */
  const startSessionInterval = useCallback(() => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }

    sessionIntervalRef.current = setInterval(() => {
      setState(prev => {
        if (!prev.activeSession || !prev.activeSession.isRunning) {
          return prev;
        }

        // Actualizar elapsedMs para sesiones en ejecución
        const updatedSession = {
          ...prev.activeSession,
          elapsedMs: (prev.activeSession.elapsedMs || 0) + 1000, // Incrementar 1 segundo
        };

        return {
          ...prev,
          activeSession: updatedSession,
        };
      });
    }, 1000);
  }, []);

  /**
   * Detiene el intervalo de la sesión
   */
  const stopSessionInterval = useCallback(() => {
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
  }, []);

  /**
   * Inicia una nueva sesión
   */
  const startSession = useCallback(async (payload: SessionCreateDto) => {
    try {
      console.log('[PROVIDER] Starting new session');
      setState(prev => ({ ...prev, isSyncing: true }));

      // Crear sesión en el servidor
      const sessionDto = await sessionService.startSession(payload);
      const session = mapServerSession(sessionDto);

      // Configurar sesión activa
      const activeSession: ActiveSession = {
        ...session,
        startTime: session.startTime || new Date().toISOString(),
        isRunning: true,
      };

      // Actualizar estado
      setState(prev => ({
        ...prev,
        activeSession,
        isMinimized: false,
        showContinueModal: false,
        isSyncing: false,
      }));

      // Persistir en AsyncStorage
      await saveSessionToStorage(activeSession);
      console.log('[PROVIDER] Session started successfully');

      // Restaurar música si hay álbum asociado
      if (payload.albumId && musicPlayer) {
        try {
          const albumSongs = await getSongsByAlbumId(payload.albumId);
          if (albumSongs.length > 0) {
            await replaceIfSessionAlbum(
              musicPlayer,
              payload.albumId,
              albumSongs,
              {
                id_album: payload.albumId,
                nombre_album: payload.title || 'Sesión de concentración'
              }
            );
            console.log('[PROVIDER] Music restored for session');
          }
        } catch (musicError) {
          console.error('[PROVIDER] Error restoring music:', musicError);
        }
      }

      return Promise.resolve();
    } catch (error) {
      console.error('[PROVIDER] Error starting session:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [musicPlayer]);

  /**
   * Pausa la sesión actual
   */
  const pauseSession = useCallback(async () => {
    console.log('[PROVIDER] Pausing session');
    
    if (!state.activeSession || !state.activeSession.isRunning) {
      console.log('[PROVIDER] No active session or session not running');
      return;
    }

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Calcular tiempo transcurrido
      const currentElapsedMs = (state.activeSession.elapsedMs || 0) +
        (state.activeSession.startTime ? Date.now() - new Date(state.activeSession.startTime).getTime() : 0);

      // Pausar en servidor
      await sessionService.pauseSession(state.activeSession.sessionId, currentElapsedMs);

      // Actualizar estado local
      const updatedSession = {
        ...state.activeSession,
        elapsedMs: currentElapsedMs,
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

      // Persistir
      await saveSessionToStorage(updatedSession);
      console.log('[PROVIDER] Session paused successfully');

    } catch (error) {
      console.error('[PROVIDER] Error pausing session:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.activeSession]);

  /**
   * Reanuda la sesión pausada
   */
  const resumeSession = useCallback(async () => {
    console.log('[PROVIDER] Resuming session');
    
    if (!state.activeSession || state.activeSession.isRunning) {
      console.log('[PROVIDER] No active session or session already running');
      return;
    }

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Nota: En móvil, la reanudación es principalmente del lado del cliente
      // El backend maneja el estado "pending" que ya está establecido

      // Actualizar estado local
      const updatedSession = {
        ...state.activeSession,
        startTime: new Date().toISOString(),
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

      // Persistir
      await saveSessionToStorage(updatedSession);
      console.log('[PROVIDER] Session resumed successfully');

    } catch (error) {
      console.error('[PROVIDER] Error resuming session:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.activeSession]);

  /**
   * Marca la sesión como "terminar más tarde"
   */
  const finishLater = useCallback(async () => {
    console.log('[PROVIDER] Marking session as "finish later"');
    
    if (!state.activeSession) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Calcular tiempo transcurrido
      const currentElapsedMs = (state.activeSession.elapsedMs || 0) +
        (state.activeSession.startTime ? Date.now() - new Date(state.activeSession.startTime).getTime() : 0);

      // Marcar como finish later en servidor
      await sessionService.finishLater(
        state.activeSession.sessionId, 
        currentElapsedMs, 
        "Aplazada desde móvil"
      );

      // Limpiar estado
      setState(prev => ({
        ...prev,
        activeSession: null,
        isMinimized: false,
        isSyncing: false,
      }));

      // Limpiar almacenamiento
      await removeSessionFromStorage();
      console.log('[PROVIDER] Session marked as "finish later"');

    } catch (error) {
      console.error('[PROVIDER] Error in finish later:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.activeSession]);

  /**
   * Completa la sesión
   */
  const completeSession = useCallback(async () => {
    console.log('[PROVIDER] Completing session');
    
    if (!state.activeSession) {
      return;
    }

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      // Calcular tiempo transcurrido
      const currentElapsedMs = (state.activeSession.elapsedMs || 0) +
        (state.activeSession.startTime ? Date.now() - new Date(state.activeSession.startTime).getTime() : 0);

      // Completar en servidor
      await sessionService.completeSession(
        state.activeSession.sessionId, 
        currentElapsedMs, 
        "Sesión completada desde móvil"
      );

      // Limpiar estado
      setState(prev => ({
        ...prev,
        activeSession: null,
        isMinimized: false,
        isSyncing: false,
      }));

      // Limpiar almacenamiento
      await removeSessionFromStorage();
      console.log('[PROVIDER] Session completed successfully');

    } catch (error) {
      console.error('[PROVIDER] Error completing session:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, [state.activeSession]);

  /**
   * Minimiza la sesión
   */
  const minimize = useCallback(() => {
    console.log('[PROVIDER] Minimizing session');
    setState(prev => ({ ...prev, isMinimized: true }));
  }, []);

  /**
   * Maximiza la sesión
   */
  const maximize = useCallback(() => {
    console.log('[PROVIDER] Maximizing session');
    setState(prev => ({ ...prev, isMinimized: false }));
  }, []);

  /**
   * Oculta el modal de continuar sesión
   */
  const hideContinueModal = useCallback(() => {
    console.log('[PROVIDER] Hiding continue modal');
    setState(prev => ({ ...prev, showContinueModal: false }));
  }, []);

  /**
   * Muestra la cuenta regresiva
   */
  const showCountdown = useCallback(() => {
    console.log('[PROVIDER] Showing countdown');
    setState(prev => ({ ...prev, showCountdown: true }));
  }, []);

  /**
   * Oculta la cuenta regresiva
   */
  const hideCountdown = useCallback(() => {
    console.log('[PROVIDER] Hiding countdown');
    setState(prev => ({ ...prev, showCountdown: false }));
  }, []);

  /**
   * Inicia sesión con cuenta regresiva
   */
  const startSessionWithCountdown = useCallback(async (payload: SessionCreateDto) => {
    console.log('[PROVIDER] Starting session with countdown');
    
    // Mostrar cuenta regresiva
    setState(prev => ({ ...prev, showCountdown: true }));
    
    // Esperar 3 segundos para el countdown (puedes ajustar esto)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Ocultar countdown e iniciar sesión
    setState(prev => ({ ...prev, showCountdown: false }));
    await startSession(payload);
  }, [startSession]);

  /**
   * Obtiene el estado actual
   */
  const getState = useCallback(() => state, [state]);

  /**
   * Obtiene la sesión activa
   */
  const getActiveSession = useCallback(() => state.activeSession, [state.activeSession]);

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

    // Ejecutar callback inmediatamente con estado actual
    callback(state);

    return () => {
      stateChangeCallbacks.current.delete(id);
    };
  }, [state]);

  /**
   * Verifica si hay una reanudación directa pendiente
   */
  const checkDirectResume = useCallback(async (): Promise<boolean> => {
    console.log('[PROVIDER] Checking for direct resume');
    
    try {
      const hasDirectResume = await hasDirectResumeFlag();
      
      if (hasDirectResume) {
        console.log('[PROVIDER] Direct resume flag found, processing...');
        
        const storedSession = await loadSessionFromStorage();
        
        if (storedSession) {
          console.log('[PROVIDER] Restoring session from storage:', storedSession.sessionId);
          
          const correctedSession = storedSession.isRunning ? {
            ...storedSession,
            startTime: new Date().toISOString(),
          } : storedSession;

          setState(prev => ({
            ...prev,
            activeSession: correctedSession,
            isMinimized: true,
            showContinueModal: false,
          }));

          await setDirectResumeFlag(false);
          console.log('[PROVIDER] Direct resume completed successfully');
          return true;
        }
      }
      
      console.log('[PROVIDER] No direct resume needed');
      return false;
    } catch (error) {
      console.error('[PROVIDER] Error checking direct resume:', error);
      await setDirectResumeFlag(false);
      return false;
    }
  }, []);

  /**
   * Fuerza la reanudación de una sesión
   */
  const forceResumeSession = useCallback(async (session: ActiveSession) => {
    console.log('[PROVIDER] Force resuming session:', session.sessionId);
    
    try {
      // Guardar sesión en almacenamiento
      const sessionToStore = {
        ...session,
        persistedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionToStore));
      await setDirectResumeFlag(true);
      
      // Actualizar estado
      const correctedSession = session.isRunning ? {
        ...session,
        startTime: new Date().toISOString(),
      } : session;

      setState(prev => ({
        ...prev,
        activeSession: correctedSession,
        isMinimized: true,
        showContinueModal: false,
      }));

      console.log('[PROVIDER] Session force resumed successfully');
    } catch (error) {
      console.error('[PROVIDER] Error force resuming session:', error);
      throw error;
    }
  }, []);

  /**
   * Guarda una sesión en almacenamiento
   */
  const saveSession = useCallback(async (session: ActiveSession) => {
    console.log('[PROVIDER] Saving session to storage:', session.sessionId);
    await saveSessionToStorage(session);
  }, []);

  /**
   * Limpia la sesión del almacenamiento
   */
  const clearSession = useCallback(async () => {
    console.log('[PROVIDER] Clearing session from storage');
    await removeSessionFromStorage();
    setState(prev => ({
      ...prev,
      activeSession: null,
      isMinimized: false,
      showContinueModal: false,
    }));
  }, []);

  // Notificar cambios de estado a los callbacks
  useEffect(() => {
    stateChangeCallbacks.current.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('[PROVIDER] Error en callback de cambio de estado:', error);
      }
    });
  }, [state]);

  // Persistir cambios en la sesión activa
  useEffect(() => {
    const persistActiveSession = async () => {
      if (state.activeSession) {
        await saveSessionToStorage(state.activeSession);
      }
    };

    persistActiveSession();
  }, [state.activeSession]);

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
    getActiveSession,
    onMethodCompleted,
    onStateChange,
    checkDirectResume,
    forceResumeSession,
    saveSession,
    clearSession,
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