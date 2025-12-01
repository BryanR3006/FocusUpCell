/**
 * Music-related type definitions
 */

export interface MusicAlbum {
  id: string;
  titulo: string;
  artista: string;
  genero: string;
  portada_url?: string;
  duracion?: number;
  anio_lanzamiento?: number;
  descripcion?: string;
}

export interface MusicTrack {
  id: string;
  titulo: string;
  artista: string;
  album_id: string;
  duracion: number;
  url_audio?: string;
  numero_pista?: number;
}

export interface MusicPlaylist {
  id: string;
  nombre: string;
  descripcion?: string;
  tracks: MusicTrack[];
  duracion_total: number;
  creada_por: string;
  fecha_creacion: string;
}

export interface MusicGenre {
  id: string;
  nombre: string;
  descripcion?: string;
  color?: string;
}

export type MusicPlaybackState = "playing" | "paused" | "stopped" | "loading";