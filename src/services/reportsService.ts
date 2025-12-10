/**
 * Servicio de API para operaciones de reportes de sesiones y métodos - Versión móvil
 * Adaptado para React Native/Expo con AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../utils/constants';
import type { SessionReport, MethodReport } from '../types/api';

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async (): Promise<string> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

// Función auxiliar para hacer peticiones con manejo de errores
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
      if (response.status === 401) {
        // Token expirado - limpiar almacenamiento
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

/**
 * Servicio principal para operaciones de reportes
 */
class ReportsService {
  /**
   * Obtiene reportes de sesiones de concentración del usuario
   *
   * @returns Array de reportes de sesiones mapeados a camelCase
   */
  async getSessionReports(): Promise<SessionReport[]> {
    try {
      console.log('[REPORTS] Obteniendo reportes de sesiones desde:', `${API_BASE_URL}${API_ENDPOINTS.SESSION_PROGRESS}`);
      
      const responseData = await makeRequest(API_ENDPOINTS.SESSION_PROGRESS, {
        method: 'GET',
      });

      // Determinar la estructura de la respuesta
      let reportsArray: any[] = [];

      if (responseData?.data && Array.isArray(responseData.data)) {
        // Estructura: {success: true, data: [...]}
        reportsArray = responseData.data;
      } else if (responseData && Array.isArray(responseData)) {
        // Estructura: [...] (array directo)
        reportsArray = responseData;
      } else {
        console.warn('Estructura de respuesta inesperada para sesiones:', responseData);
        return [];
      }

      // Mapear campos snake_case a camelCase
      const mappedReports: SessionReport[] = reportsArray.map((report: any) => ({
        idReporte: report.id_reporte,
        idSesion: report.id_sesion,
        idUsuario: report.id_usuario,
        nombreSesion: report.nombre_sesion,
        descripcion: report.descripcion,
        // Estandarizar el estado 'completada' a 'completado' para consistencia con la UI
        estado: report.estado === 'completada' ? 'completado' : report.estado,
        tiempoTotal: report.tiempo_total,
        metodoAsociado: report.metodo_asociado ? {
          idMetodo: report.metodo_asociado.id_metodo,
          nombreMetodo: report.metodo_asociado.nombre_metodo
        } : undefined,
        albumAsociado: report.album_asociado ? {
          idAlbum: report.album_asociado.id_album,
          nombreAlbum: report.album_asociado.nombre_album
        } : undefined,
        fechaCreacion: report.fecha_creacion
      }));

      console.log('Reportes de sesiones obtenidos exitosamente:', mappedReports.length);
      return mappedReports;
    } catch (error) {
      console.error('Error obteniendo reportes de sesiones:', error);
      throw error;
    }
  }

  /**
   * Obtiene reportes de métodos de estudio del usuario
   *
   * @returns Array de reportes de métodos mapeados a camelCase
   */
  async getMethodReports(): Promise<MethodReport[]> {
    try {
      console.log('Obteniendo reportes de métodos desde:', `${API_BASE_URL}${API_ENDPOINTS.METHOD_PROGRESS}`);
      
      const responseData = await makeRequest(API_ENDPOINTS.METHOD_PROGRESS, {
        method: 'GET',
      });

      // Determinar la estructura de la respuesta
      let reportsArray: any[] = [];

      if (responseData?.data && Array.isArray(responseData.data)) {
        // Estructura: {success: true, data: [...]}
        reportsArray = responseData.data;
      } else if (responseData && Array.isArray(responseData)) {
        // Estructura: [...] (array directo)
        reportsArray = responseData;
      } else {
        console.warn('Estructura de respuesta inesperada para métodos:', responseData);
        return [];
      }

      // Mapear campos snake_case a camelCase
      const mappedReports: MethodReport[] = reportsArray.map((report: any) => ({
        idReporte: report.id_reporte,
        idMetodo: report.id_metodo,
        idUsuario: report.id_usuario,
        nombreMetodo: report.nombre_metodo,
        progreso: report.progreso,
        estado: report.estado,
        fechaCreacion: report.fecha_creacion
      }));

      console.log('Reportes de métodos obtenidos exitosamente:', mappedReports.length);
      return mappedReports;
    } catch (error) {
      console.error('Error obteniendo reportes de métodos:', error);
      throw error;
    }
  }

  /**
   * Elimina un reporte específico
   *
   * @param reportId - ID del reporte a eliminar
   */
  async deleteReport(reportId: number): Promise<void> {
    try {
      console.log('Eliminando reporte:', reportId);
      
      await makeRequest(`${API_ENDPOINTS.REPORTS}/${reportId}`, {
        method: 'DELETE',
      });

      console.log('Reporte eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando reporte:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de reportes
   */
  async getReportsStats(): Promise<any> {
    try {
      console.log('Obteniendo estadísticas de reportes');
      
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

// Instancia singleton del servicio
const reportsServiceInstance = new ReportsService();

export { reportsServiceInstance as reportsService };
export default reportsServiceInstance;