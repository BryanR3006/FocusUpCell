export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
}

/* ---------------------------------------------------------
 * MÚSICA
 * --------------------------------------------------------- */

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
  id_album: number;
  duracion?: number; // segundos
}

/* ---------------------------------------------------------
 * NOTIFICACIONES
 * --------------------------------------------------------- */

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

/* ---------------------------------------------------------
 * SESIONES
 * --------------------------------------------------------- */

export interface SessionDto {
  sessionId: string;
  title: string;
  description?: string;
  type: 'rapid' | 'scheduled';
  eventId?: number;
  methodId?: number;
  albumId?: number;
  startTime: string; // ISO
  pausedAt?: string;
  accumulatedMs: number;
  isRunning: boolean;
  estado: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  elapsedInterval?: string;
  elapsedMs: number;
}

export interface SessionCreateDto {
  title: string;
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

/* ---------------------------------------------------------
 * ESTADO LOCAL DE SESIÓN (solo móvil)
 * --------------------------------------------------------- */

export interface ActiveSession {
  sessionId: string;
  title: string;
  description?: string;
  type: 'rapid' | 'scheduled';
  eventId?: number;
  methodId?: number;
  albumId?: number;
  startTime: string;
  pausedAt?: string;
  accumulatedMs: number;
  isRunning: boolean;
  status: 'active' | 'paused' | 'completed';
  isLate?: boolean;
  serverEstado: 'pending' | 'completed';
  elapsedMs: number;
  persistedAt: string; // Para expiración
}

/* ---------------------------------------------------------
 * MÉTODOS DE ESTUDIO
 * --------------------------------------------------------- */

export interface StudyMethod {
  id_metodo: number;
  titulo: string;
  descripcion: string;
  url_imagen?: string;
  color_hexa?: string;
}

/* ---------------------------------------------------------
 * REPORTES DE SESIONES Y MÉTODOS
 * --------------------------------------------------------- */

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
