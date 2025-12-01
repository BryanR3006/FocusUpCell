/**
 * Session-related type definitions
 */

export interface SessionData {
  id: string;
  methodId: number;
  id_metodo_realizado: number;
  startTime: string;
  progress: number;
  status: "en_progreso" | "completado";
}

export interface PomodoroConfig {
  workTime: number;
  breakTime: number;
}

export type SessionStatus = "en_progreso" | "completado" | "pausado" | "cancelado";