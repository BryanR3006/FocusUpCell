export interface ApiError {
  message: string;
  statusCode: number;
  error: string;
}

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