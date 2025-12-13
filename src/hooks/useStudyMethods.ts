import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../clientes/apiClient";
import type { MethodReport } from "../types/api";

// Define StudyMethod interface locally
interface StudyMethod {
  id: number | string;
  nombre?: string;
  titulo?: string;
  descripcion: string;
  icono?: string;
  color?: string;
  progreso?: number;
  estado?: 'activo' | 'pausado' | 'completado';
  duracion_recomendada?: number;
  dificultad?: 'facil' | 'medio' | 'dificil';
}

interface UseStudyMethodsReturn {
  methods: StudyMethod[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useStudyMethods = (): UseStudyMethodsReturn => {
  const [methods, setMethods] = useState<StudyMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudyMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch study methods and user progress
      const [methodsResponse, progressResponse] = await Promise.all([
        apiClient.get("/metodos-estudio"),
        apiClient.get("/reports/methods"),
      ]);

      const methodsData = methodsResponse.data || [];
      const progressData = progressResponse.data || [];

      // Map and merge data
      const enrichedMethods = methodsData.map((method: any, index: number) => {
        // Find user progress for this method
        const userMethod = progressData.find((progress: MethodReport) =>
          progress.idMetodo === method.id_metodo
        );

        const progreso = userMethod?.progreso || 0;

        return {
          id: method.id_metodo,
          titulo: method.nombre_metodo,
          descripcion: method.descripcion,
          icono: method.icono || 'book-open',
          color: method.color || getMethodColor(index, method.id_metodo),
          progreso: Number(progreso),
          estado: progreso === 100 ? 'completado' :
                  progreso > 0 ? 'activo' : 'pausado',
          duracion_recomendada: method.duracion_recomendada,
          dificultad: method.dificultad || 'medio',
        } as StudyMethod;
      });

      setMethods(enrichedMethods);
    } catch (err: any) {
      console.error("Error fetching study methods:", err);
      setError(err.message || "Failed to load study methods");
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchStudyMethods();
  }, [fetchStudyMethods]);

  useEffect(() => {
    fetchStudyMethods();
  }, [fetchStudyMethods]);

  return { methods, loading, error, refetch };
};

// Helper function to get method color
const getMethodColor = (index: number, methodId?: number) => {
  const colors = [
    "#8B5CF6", // Purple
    "#10B981", // Green
    "#7C3AED", // Violet
    "#059669", // Emerald
    "#F59E0B", // Amber
    "#2563EB", // Blue
  ];

  if (methodId) {
    return colors[methodId % colors.length];
  }
  return colors[index % colors.length];
};