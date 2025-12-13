import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../clientes/apiClient";
import type { MethodReport, SessionReport } from "../types/api";

// Define UserProgress interface locally since it's not in api.ts
interface UserProgress {
  totalMethods: number;
  completedMethods: number;
  totalSessions: number;
  totalMusic: number;
  activeMethods: number;
  upcomingEvents: number;
  totalStudyTime: number;
  averageConcentration: number;
  streakDays: number;
}

interface UseUserStatsReturn {
  stats: UserProgress;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const initialStats: UserProgress = {
  totalMethods: 0,
  completedMethods: 0,
  totalSessions: 0,
  totalMusic: 0,
  activeMethods: 0,
  upcomingEvents: 0,
  totalStudyTime: 0,
  averageConcentration: 75,
  streakDays: 0,
};

export const useUserStats = (): UseUserStatsReturn => {
  const [stats, setStats] = useState<UserProgress>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from multiple endpoints and aggregate
      const [methodsResponse, sessionsResponse, eventsResponse, musicResponse] =
        await Promise.all([
          apiClient.get("/reports/methods"),
          apiClient.get("/reports/sessions"),
          apiClient.get("/eventos"),
          apiClient.get("/musica/albums"),
        ]);

      const userMethods = methodsResponse.data || [];
      const userSessions = sessionsResponse.data || [];
      const userEvents = eventsResponse.data || [];
      const userMusic = musicResponse.data || [];

      // Calculate stats (extracted from Home.tsx logic)
      const completedMethods = userMethods.filter(
        (m: MethodReport) => m.progreso === 100
      ).length;
      const activeMethods = userMethods.filter(
        (m: MethodReport) => (m.progreso || 0) > 0 && (m.progreso || 0) < 100
      ).length;

      const pendingEvents = userEvents.filter(
        (e: any) => e.estado === "pendiente" || e.status === "pending"
      ).length;

      // Calculate total study time (in seconds)
      const totalStudyTime = userSessions
        .filter((s: SessionReport) => s.estado === "completado")
        .reduce(
          (total: number, session: SessionReport) => total + (session.tiempoTotal || 0),
          0
        );

      // Calculate average concentration - not available in current API, use default
      const averageConcentration = 75;

      // Calculate streak days
      const streakDays = calculateStreakDays(userSessions);

      const calculatedStats: UserProgress = {
        totalMethods: userMethods.length,
        completedMethods,
        totalSessions: userSessions.length,
        totalMusic: userMusic.length,
        activeMethods,
        upcomingEvents: pendingEvents,
        totalStudyTime,
        averageConcentration,
        streakDays,
      };

      setStats(calculatedStats);
    } catch (err: any) {
      console.error("Error fetching user stats:", err);
      setError(err.message || "Failed to load user statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchUserStats();
  }, [fetchUserStats]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return { stats, loading, error, refetch };
};

// Helper function extracted from Home.tsx
const calculateStreakDays = (sessions: SessionReport[]): number => {
  if (sessions.length === 0) return 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.fechaCreacion);
    return sessionDate >= sevenDaysAgo;
  });

  const uniqueDays = new Set(
    recentSessions.map((session) => {
      const date = new Date(session.fechaCreacion);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );

  return uniqueDays.size;
};