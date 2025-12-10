/**
 * Servicio de API para operaciones de reportes de sesiones y métodos - Versión móvil
 * Adaptado para React Native/Expo con AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type { SessionReport, MethodReport } from '../types/api';

/* ---------------------------------------------------------
   Utilidades internas
--------------------------------------------------------- */

// Obtener token desde AsyncStorage
const getAuthToken = async (): Promise<string> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('No authentication token found');
  return token;
};

// Wrapper de fetch con manejo de errores
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Si el token expiró, se elimina de AsyncStorage
      if (response.status === 401) {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('userId');
        throw new Error('Authentication expired. Please login again.');
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request error:', error);
    throw error;
  }
};

/* ---------------------------------------------------------
   Servicio principal
--------------------------------------------------------- */

class ReportsService {
  /* -----------------------------
     Obtener reportes de sesiones
  ----------------------------- */
  async getSessionReports(): Promise<SessionReport[]> {
    try {
      console.log('[REPORTS] Obteniendo reportes de sesiones desde:', `${API_BASE_URL}${API_ENDPOINTS.SESSION_PROGRESS}`);

      const responseData = await makeRequest(API_ENDPOINTS.SESSION_PROGRESS, { method: 'GET' });

      let reportsArray: any[] = [];

      if (responseData?.data && Array.isArray(responseData.data)) {
        reportsArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        reportsArray = responseData;
      } else {
        console.warn('Estructura inesperada para sesiones:', responseData);
        return [];
      }

      // Mapear snake_case → camelCase
      const mappedReports: SessionReport[] = reportsArray.map((report: any) => ({
        idReporte: report.id_reporte,
        idSesion: report.id_sesion,
        idUsuario: report.id_usuario,
        nombreSesion: report.nombre_sesion,
        descripcion: report.descripcion,
        estado: report.estado === 'completada' ? 'completado' : report.estado,
        tiempoTotal: report.tiempo_total,
        metodoAsociado: report.metodo_asociado
          ? {
              idMetodo: report.metodo_asociado.id_metodo,
              nombreMetodo: report.metodo_asociado.nombre_metodo,
            }
          : undefined,
        albumAsociado: report.album_asociado
          ? {
              idAlbum: report.album_asociado.id_album,
              nombreAlbum: report.album_asociado.nombre_album,
            }
          : undefined,
        fechaCreacion: report.fecha_creacion,
      }));

      return mappedReports;
    } catch (error) {
      console.error('Error obteniendo reportes de sesiones:', error);
      throw error;
    }
  }

  /* -----------------------------
     Obtener reportes de métodos
  ----------------------------- */
  async getMethodReports(): Promise<MethodReport[]> {
    try {
      console.log('[REPORTS] Obteniendo reportes de métodos desde:', `${API_BASE_URL}${API_ENDPOINTS.METHOD_PROGRESS}`);

      const responseData = await makeRequest(API_ENDPOINTS.METHOD_PROGRESS, { method: 'GET' });

      let reportsArray: any[] = [];

      if (responseData?.data && Array.isArray(responseData.data)) {
        reportsArray = responseData.data;
      } else if (Array.isArray(responseData)) {
        reportsArray = responseData;
      } else {
        console.warn('Estructura inesperada para métodos:', responseData);
        return [];
      }

      const mappedReports: MethodReport[] = reportsArray.map((report: any) => ({
        idReporte: report.id_reporte,
        idMetodo: report.id_metodo,
        idUsuario: report.id_usuario,
        nombreMetodo: report.nombre_metodo,
        progreso: report.progreso,
        estado: report.estado,
        fechaCreacion: report.fecha_creacion,
      }));

      return mappedReports;
    } catch (error) {
      console.error('Error obteniendo reportes de métodos:', error);
      throw error;
    }
  }

  /* -----------------------------
     Eliminar reporte
  ----------------------------- */
  async deleteReport(reportId: number): Promise<void> {
    try {
      console.log('Eliminando reporte:', reportId);

      await makeRequest(`${API_ENDPOINTS.REPORTS}/${reportId}`, {
        method: 'DELETE',
      });

      console.log('Reporte eliminado');
    } catch (error) {
      console.error('Error eliminando reporte:', error);
      throw error;
    }
  }

  /* -----------------------------
     Obtener estadísticas
  ----------------------------- */
  async getReportsStats(): Promise<any> {
    try {
      console.log('Obteniendo estadísticas');

      const responseData = await makeRequest(API_ENDPOINTS.METHOD_PROGRESS, {
        method: 'GET',
      });

      return responseData;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}

/* Exportar instancia única */
const reportsServiceInstance = new ReportsService();

export { reportsServiceInstance as reportsService };
export default reportsServiceInstance;
