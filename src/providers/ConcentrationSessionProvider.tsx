import React, { useState, useEffect, useRef } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

interface ConcentrationSession {
  sessionId: string;
  methodId: string;
  startTime: number;
  duration: number;
  isPaused: boolean;
  reason?: string;
}

interface ConcentrationSessionContextType {
  activeSession: ConcentrationSession | null;
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number;
  startSession: (methodId: string) => Promise<void>;
  pauseSession: (reason?: string) => Promise<void>;
  resumeSession: () => Promise<void>;
  endSession: () => Promise<void>;
}

export const ConcentrationSessionContext =
  React.createContext<ConcentrationSessionContextType>({
    activeSession: null,
    isActive: false,
    isPaused: false,
    remainingTime: 0,
    startSession: async () => {},
    pauseSession: async () => {},
    resumeSession: async () => {},
    endSession: async () => {},
  });

export const ConcentrationSessionProvider = ({ children }: any) => {
  const [activeSession, setActiveSession] = useState<ConcentrationSession | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  /* -----------------------------------------------------------
     Utilidades de almacenamiento móvil
  ----------------------------------------------------------- */
  const saveSessionToStorage = async (session: ConcentrationSession | null) => {
    if (session) {
      await AsyncStorage.setItem("activeSession", JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem("activeSession");
    }
  };

  const loadSessionFromStorage = async () => {
    const storedSession = await AsyncStorage.getItem("activeSession");
    if (storedSession) {
      const session = JSON.parse(storedSession) as ConcentrationSession;
      setActiveSession(session);

      const now = Date.now();
      const elapsed = (now - session.startTime) / 1000;
      const timeLeft = session.duration - elapsed;

      setRemainingTime(timeLeft > 0 ? timeLeft : 0);

      if (timeLeft > 0 && !session.isPaused) {
        startTimer();
      }
    }
  };

  /* -----------------------------------------------------------
     Timer para móvil (solo JS setInterval)
  ----------------------------------------------------------- */
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  /* -----------------------------------------------------------
     MÉTODOS DEL PROVIDER
  ----------------------------------------------------------- */

  const startSession = async (methodId: string) => {
    const sessionData: ConcentrationSession = {
      sessionId: `${Date.now()}`,
      methodId,
      startTime: Date.now(),
      duration: 25 * 60, // 25 min default
      isPaused: false,
    };

    setActiveSession(sessionData);
    setRemainingTime(sessionData.duration);
    await saveSessionToStorage(sessionData);

    startTimer();
  };

  const pauseSession = async (reason?: string) => {
    if (!activeSession) return;

    stopTimer();

    const updated = { ...activeSession, isPaused: true, reason };
    setActiveSession(updated);
    await saveSessionToStorage(updated);
  };

  const resumeSession = async () => {
    if (!activeSession) return;

    const updated = { ...activeSession, isPaused: false, reason: undefined };
    setActiveSession(updated);
    await saveSessionToStorage(updated);

    startTimer();
  };

  const endSession = async () => {
    stopTimer();
    setActiveSession(null);
    setRemainingTime(0);
    await saveSessionToStorage(null);

    // Enviar reporte opcional
    try {
      await axios.post(`${API_BASE_URL}/sessions/end`, {
        sessionId: activeSession?.sessionId,
        methodId: activeSession?.methodId,
        completed: true,
      });
    } catch (e) {
      console.log("Error enviando fin de sesión:", e);
    }
  };

  /* -----------------------------------------------------------
     Manejo de AppState (solo móvil)
  ----------------------------------------------------------- */
  useEffect(() => {
    loadSessionFromStorage();

    const sub = AppState.addEventListener("change", (next) => {
      if (appState.current.match(/inactive|background/) && next === "active") {
        loadSessionFromStorage();
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, []);

  return (
    <ConcentrationSessionContext.Provider
      value={{
        activeSession,
        isActive: !!activeSession,
        isPaused: activeSession?.isPaused ?? false,
        remainingTime,
        startSession,
        pauseSession,
        resumeSession,
        endSession,
      }}
    >
      {children}
    </ConcentrationSessionContext.Provider>
  );
};
