/**
 * Pruebas unitarias para sessionService
 *
 * Verifica las llamadas a los nuevos endpoints de reportes
 * y el endpoint de sesiones desde eventos.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from './sessionService';
import { apiClient } from '../clientes/apiClient';

// Mock del apiClient
vi.mock('../utils/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    patch: vi.fn(),
    get: vi.fn(),
  },
}));

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessionFromEvent', () => {
    it('debe llamar al endpoint correcto para obtener sesión desde evento', async () => {
      const mockResponse = {
        data: {
          sessionId: 'session-123',
          title: 'Sesión desde evento',
          eventId: 456,
        },
      };

      (apiClient.get as any).mockResolvedValue(mockResponse);

      const result = await sessionService.getSessionFromEvent('456');

      expect(apiClient.get).toHaveBeenCalledWith('/sessions/from-event/456');
      expect(result).toEqual(mockResponse.data);
    });

    it('debe manejar errores del endpoint de evento', async () => {
      const mockError = new Error('Evento no encontrado');
      (apiClient.get as any).mockRejectedValue(mockError);

      await expect(sessionService.getSessionFromEvent('999')).rejects.toThrow('Evento no encontrado');
    });
  });

  describe('pauseSession', () => {
    it('debe llamar al nuevo endpoint de reportes con status y estado pending, elapsedMs y duracion', async () => {
      (apiClient.patch as any).mockResolvedValue({});

      await sessionService.pauseSession('session-123', 30000);

      expect(apiClient.patch).toHaveBeenCalledWith('/reports/sessions/session-123/progress', {
        status: 'pending',
        estado: 'pending',
        elapsedMs: 30000,
        duracion: 30, // 30000ms = 30s
      });
    });
  });

  describe('finishLater', () => {
    it('debe llamar al endpoint de reportes con status y estado pending, elapsedMs, duracion y notas', async () => {
      (apiClient.patch as any).mockResolvedValue({});

      await sessionService.finishLater('session-123', 45000, 'Aplazada por usuario');

      expect(apiClient.patch).toHaveBeenCalledWith('/reports/sessions/session-123/progress', {
        status: 'pending',
        estado: 'pending',
        elapsedMs: 45000,
        duracion: 45, // 45000ms = 45s
        notes: 'Aplazada por usuario',
      });
    });

    it('debe llamar al endpoint sin notas cuando no se proporcionan', async () => {
      (apiClient.patch as any).mockResolvedValue({});

      await sessionService.finishLater('session-123', 45000);

      expect(apiClient.patch).toHaveBeenCalledWith('/reports/sessions/session-123/progress', {
        status: 'pending',
        estado: 'pending',
        elapsedMs: 45000,
        duracion: 45,
      });
    });
  });

  describe('completeSession', () => {
    it('debe llamar al endpoint de reportes con status y estado completed, elapsedMs, duracion y notas', async () => {
      (apiClient.patch as any).mockResolvedValue({});

      await sessionService.completeSession('session-123', 60000, 'Sesión completada exitosamente');

      expect(apiClient.patch).toHaveBeenCalledWith('/reports/sessions/session-123/progress', {
        status: 'completed',
        estado: 'completed',
        elapsedMs: 60000,
        duracion: 60, // 60000ms = 60s
        notes: 'Sesión completada exitosamente',
      });
    });
  });

  describe('resumeSession', () => {
    it('debe ser una función deprecated que no hace llamadas API', async () => {
      // Esta función está deprecated y no debería hacer llamadas
      await sessionService.resumeSession('session-123');

      expect(apiClient.get).not.toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(apiClient.patch).not.toHaveBeenCalled();
    });
  });
});