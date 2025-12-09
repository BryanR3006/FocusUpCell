/**
 * Pruebas unitarias para el Cliente API
 * Demuestra comportamiento de timeout, reintento y 401+actualización
 */

import { ApiError, api } from '../src/clientes/apiClient';

// Mock fetch para pruebas
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock del puente de autenticación
jest.mock('../src/clientes/authBridge', () => ({
  getAuthBridge: () => ({
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Comportamiento de Timeout', () => {
    it('debería lanzar ApiError con tipo timeout cuando la solicitud expira', async () => {
      // Mock de una solicitud que nunca se resuelve (simulando timeout)
      mockFetch.mockImplementation(() => new Promise(() => {}));

      const startTime = Date.now();

      try {
        await api.get('/test-endpoint', { timeout: 100 });
        fail('Debería haber lanzado error de timeout');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).kind).toBe('timeout');
        expect((error as ApiError).message).toContain('timeout');

        // Verificar que tomó aproximadamente la duración del timeout
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThanOrEqual(95); // Permitir tolerancia
        expect(elapsed).toBeLessThan(200);
      }
    });
  });

  describe('Lógica de Reintento', () => {
    it('debería reintentar solicitudes GET en errores de red hasta el máximo de intentos', async () => {
      // Mock error de red para los primeros 2 intentos, éxito en el 3er
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Map(),
        });

      const result = await api.get('/test-endpoint', { retries: 3 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toBe('success');
    });

    it('no debería reintentar errores del cliente 4xx', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad Request' }),
        headers: new Map(),
      });

      try {
        await api.get('/test-endpoint');
        fail('Debería haber lanzado error del cliente');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).kind).toBe('client');
        expect((error as ApiError).status).toBe(400);
      }

      expect(mockFetch).toHaveBeenCalledTimes(1); // No hay reintentos para 4xx
    });

    it('debería reintentar errores 429 respetando el encabezado Retry-After', async () => {
      const retryAfterMs = 500;

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ message: 'Too Many Requests' }),
          headers: new Map([['retry-after', (retryAfterMs / 1000).toString()]]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Map(),
        });

      const startTime = Date.now();
      const result = await api.get('/test-endpoint');

      expect(result).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verificar que el retraso de reintento fue respetado
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(retryAfterMs - 50); // Permitir tolerancia
    });
  });

  describe('Manejo de 401 y Actualización de Token', () => {
    const mockAuthBridge = {
      getAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      setTokens: jest.fn(),
      clearTokens: jest.fn(),
      logout: jest.fn(),
    };

    beforeEach(() => {
      // Restablecer mock del puente de autenticación
      mockAuthBridge.getAccessToken.mockResolvedValue('old-token');
      mockAuthBridge.getRefreshToken.mockResolvedValue('refresh-token');
      mockAuthBridge.setTokens.mockResolvedValue(undefined);
      mockAuthBridge.logout.mockResolvedValue(undefined);
    });

    it('debería intentar actualizar token en 401 y reproducir solicitudes en cola', async () => {
      // Primera solicitud obtiene 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
          headers: new Map(),
        })
        // Solicitud de actualización de token tiene éxito
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new-token',
            refresh_token: 'new-refresh-token'
          }),
          headers: new Map(),
        })
        // Solicitud original reproducida con nuevo token
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Map(),
        });

      const result = await api.get('/protected-endpoint');

      expect(result).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verificar que se intentó actualizar
      expect(mockAuthBridge.getRefreshToken).toHaveBeenCalled();
      expect(mockAuthBridge.setTokens).toHaveBeenCalledWith({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token'
      });
    });

    it('debería cerrar sesión del usuario cuando falla la actualización de token', async () => {
      // Primera solicitud obtiene 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
          headers: new Map(),
        })
        // Solicitud de actualización de token falla
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Invalid refresh token' }),
          headers: new Map(),
        });

      try {
        await api.get('/protected-endpoint');
        fail('Debería haber lanzado después del fallo de actualización');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).kind).toBe('client');
        expect((error as ApiError).status).toBe(401);
      }

      // Verificar que se llamó al cierre de sesión
      expect(mockAuthBridge.logout).toHaveBeenCalled();
    });

    it('debería poner en cola múltiples solicitudes 401 y reproducirlas después de actualizar', async () => {
      // Ambas solicitudes obtienen 401 inicialmente
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
          headers: new Map(),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
          headers: new Map(),
        })
        // Actualización tiene éxito
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            access_token: 'new-token',
            refresh_token: 'new-refresh-token'
          }),
          headers: new Map(),
        })
        // Primera solicitud reproducida
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success1' }),
          headers: new Map(),
        })
        // Segunda solicitud reproducida
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success2' }),
          headers: new Map(),
        });

      // Iniciar ambas solicitudes simultáneamente
      const [result1, result2] = await Promise.all([
        api.get('/endpoint1'),
        api.get('/endpoint2')
      ]);

      expect(result1).toBe('success1');
      expect(result2).toBe('success2');
      expect(mockFetch).toHaveBeenCalledTimes(5); // 2 iniciales + 1 actualización + 2 reproducidas

      // Verificar que solo se intentó una actualización
      expect(mockAuthBridge.setTokens).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mapeo de Errores', () => {
    it('debería mapear errores 4xx a errores del cliente', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ message: 'Validation failed', details: { field: 'email' } }),
        headers: new Map(),
      });

      try {
        await api.post('/test-endpoint', { email: 'invalid' });
        fail('Debería haber lanzado error del cliente');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).kind).toBe('client');
        expect((error as ApiError).status).toBe(422);
        expect((error as ApiError).message).toBe('Validation failed');
        expect((error as ApiError).details).toEqual({ field: 'email' });
      }
    });

    it('debería mapear errores 5xx a errores del servidor', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
        headers: new Map(),
      });

      try {
        await api.get('/test-endpoint');
        fail('Debería haber lanzado error del servidor');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).kind).toBe('server');
        expect((error as ApiError).status).toBe(500);
      }
    });
  });
});