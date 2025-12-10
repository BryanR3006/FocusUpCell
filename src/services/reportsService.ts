/**
 * Servicio de API para operaciones de reportes de sesiones y métodos
 *
 * Este módulo proporciona funciones para obtener reportes de sesiones de concentración
 * y métodos de estudio desde los nuevos endpoints separados. Maneja el mapeo
 * de campos snake_case del backend a camelCase del frontend.
 *
 * Incluye validación de respuestas y manejo de errores consistente.
 */

import { apiClient } from '../clientes/apiClient';
import { API_ENDPOINTS } from '../utils/constants';
import type { SessionReport, MethodReport } from '../types/api';

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
      console.log('[REPORTS] Obteniendo reportes de sesiones desde:', API_ENDPOINTS.SESSION_PROGRESS);
      const response = await apiClient.get(API_ENDPOINTS.SESSION_PROGRESS);

      // Determinar la estructura de la respuesta
      let reportsArray: any[] = [];

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Estructura: {success: true, data: [...]}
        reportsArray = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Estructura: [...] (array directo)
        reportsArray = response.data;
      } else {
        console.warn('Estructura de respuesta inesperada para sesiones:', response.data);
        return [];
      }

      // Mapear campos snake_case a camelCase
      const mappedReports: SessionReport[] = reportsArray.map((report: any) => ({
        idReporte: report.id_reporte,
        idSesion: report.id_sesion,
        idUsuario: report.id_usuario,
        nombreSesion: report.nombre_sesion,
        descripcion: report.descripcion,
        // FIX: Standardize status from backend's 'completada' to frontend's expected 'completado'.
        // CORRECCIÓN: Estandarizar el estado 'completada' del backend a 'completado' para consistencia con la UI.
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
      console.log('Obteniendo reportes de métodos desde:', API_ENDPOINTS.METHOD_PROGRESS);
      const response = await apiClient.get(API_ENDPOINTS.METHOD_PROGRESS);

      // Determinar la estructura de la respuesta
      let reportsArray: any[] = [];

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Estructura: {success: true, data: [...]}
        reportsArray = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Estructura: [...] (array directo)
        reportsArray = response.data;
      } else {
        console.warn('Estructura de respuesta inesperada para métodos:', response.data);
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
}

// Instancia singleton del servicio
const reportsServiceInstance = new ReportsService();

export { reportsServiceInstance as reportsService };
export default reportsServiceInstance;