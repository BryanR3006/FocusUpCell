/**
 * API-related type definitions for the FocusUpCell mobile app
 */

// Error types
export type ApiErrorKind = 'client' | 'server' | 'network' | 'timeout' | 'unknown';

export class ApiError extends Error {
  public readonly kind: ApiErrorKind;
  public readonly status?: number;
  public readonly details?: any;

  constructor(kind: ApiErrorKind, message: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }

  static fromResponse(status: number, message: string, details?: any): ApiError {
    if (status >= 400 && status < 500) {
      return new ApiError('client', message, status, details);
    } else if (status >= 500) {
      return new ApiError('server', message, status, details);
    }
    return new ApiError('unknown', message, status, details);
  }

  static network(message: string, details?: any): ApiError {
    return new ApiError('network', message, undefined, details);
  }

  static timeout(message: string = 'Request timeout'): ApiError {
    return new ApiError('timeout', message);
  }
}

// Request/Response types
export interface ApiRequestOptions {
  timeout?: number;
  skipAuth?: boolean;
  retries?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

// Auth types
export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

// Generic API response wrapper
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
}

export type ApiResult<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Tipos del módulo de música
export interface Album {
  id_album: number;
  nombre_album: string;
  genero: string;
  descripcion: string;
  url_imagen?: string;
}

export interface Song {
  id_cancion: number;
  nombre_cancion: string;
  artista_cancion?: string;
  categoria: string;
  url_musica: string;
  url_imagen?: string;
  id_album: number;
  duracion?: number; // En segundos
}

// Tipos del módulo de notificaciones
export interface NotificationSettings {
  idUsuario?: number;
  eventos: boolean;
  metodosPendientes: boolean;
  sesionesPendientes: boolean;
  motivacion: boolean;
}

export interface UpcomingNotification {
  id: number;
  titulo: string;
  tipo: 'evento' | 'metodo' | 'sesion' | 'motivacion';
  fecha_hora: string; // ISO string
  id_metodo?: number;
  id_album?: number;
  descripcion?: string;
}

export interface NotificationConfigUpdate {
  tipo: keyof NotificationSettings;
  enabled: boolean;
}

// Tipos del módulo de sesiones
export interface SessionDto {
  sessionId: string;
  title: string;
  description?: string;
  type: 'rapid' | 'scheduled';
  eventId?: number;
  methodId?: number;
  albumId?: number;
  startTime: string; // ISO string
  pausedAt?: string; // ISO string cuando está pausada
  accumulatedMs: number; // Mantenido localmente, sobreescrito por servidor
  isRunning: boolean;
  estado: 'pending' | 'completed'; // Campo del servidor
  createdAt: string;
  updatedAt: string;
  elapsedInterval?: string;
  elapsedMs: number; // Valor autoritativo del servidor
}

export interface SessionCreateDto {
  title: string; // Sin userId - viene del JWT
  description?: string;
  type: 'rapid' | 'scheduled';
  eventId?: number;
  methodId?: number;
  albumId?: number;
}

export interface SessionUpdateDto {
  status?: 'active' | 'paused' | 'completed';
  accumulatedMs?: number;
  pausedAt?: string;
}

export interface SessionFilters {
  type?: 'rapid' | 'scheduled';
  status?: 'active' | 'paused' | 'completed';
  dateFrom?: string;
  dateTo?: string;
}

// Estado de sesión activo en el frontend
export interface ActiveSession {
  sessionId: string;
  title: string;
  description?: string;
  type: 'rapid' | 'scheduled';
  eventId?: number;
  methodId?: number;
  albumId?: number;
  startTime: string; // ISO string
  pausedAt?: string; // ISO string cuando está pausada
  accumulatedMs: number; // Mantenido localmente
  isRunning: boolean;
  status: 'active' | 'paused' | 'completed'; // Estado del cliente
  isLate?: boolean; // Para sesiones programadas
  serverEstado: 'pending' | 'completed'; // Estado del servidor
  elapsedMs: number; // Del servidor
  persistedAt: string; // Para política de expiración
}

// Common DTOs (placeholders - extend as needed)
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserProfileResponse {
  id_usuario: number;
  nombre_usuario: string;
  correo: string;
  pais?: string;
  genero?: string;
  fecha_nacimiento: string;
  horario_fav?: string;
  intereses: string[];
  distracciones: string[];
}

export interface LoginResponse extends AuthTokens {
  user: UserProfileResponse;
  message: string;
}

export interface RegisterResponse extends AuthTokens {
  user: UserProfileResponse;
  message: string;
}

// Request DTOs
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  nombre_usuario?: string;
  correo?: string;
  pais?: string;
  genero?: string;
  fecha_nacimiento?: string;
  horario_fav?: string;
  intereses?: string[];
  distracciones?: string[];
}

// Tipos para reportes de sesiones y métodos
export interface SessionReport {
  idReporte: number;
  idSesion: number;
  idUsuario: number;
  nombreSesion: string;
  descripcion: string;
  estado: 'pendiente' | 'completado';
  tiempoTotal: number;
  metodoAsociado?: {
    idMetodo: number;
    nombreMetodo: string;
  };
  albumAsociado?: {
    idAlbum: number;
    nombreAlbum: string;
  };
  fechaCreacion: string;
}

export interface MethodReport {
  idReporte: number;
  idMetodo: number;
  idUsuario: number;
  nombreMetodo: string;
  progreso: number;
  estado: string;
  fechaCreacion: string;
}

// Tipos para métodos de estudio
export interface StudyMethod {
  id_metodo: number;
  titulo: string;
  descripcion: string;
  url_imagen?: string;
  color_hexa?: string;
}
