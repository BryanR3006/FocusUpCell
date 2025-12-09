import { apiClient } from "clientes/apiClient";
import type { Album, Song } from "types/api";

// Endpoints base para música
const MUSIC_BASE = "/musica";

/**
 * Obtiene todos los álbumes disponibles
 */
export const getAlbums = async (): Promise<Album[]> => {
  const response = await apiClient.get(`${MUSIC_BASE}/albums`);
  // Albums endpoint might return data directly, not wrapped
  const rawAlbums = response.data?.data || response.data || [];

  // Transform camelCase API response to snake_case expected by frontend
  const transformedAlbums: Album[] = Array.isArray(rawAlbums) ? rawAlbums.map(album => ({
    id_album: album.idAlbum || album.id_album,
    nombre_album: album.nombreAlbum || album.nombre_album,
    genero: album.genero,
    descripcion: album.descripcion,
    url_imagen: album.urlImagen || album.url_imagen
  })) : [];

  return transformedAlbums;
};

/**
 * Obtiene un álbum específico por ID
 */
export const getAlbumById = async (id: number): Promise<Album | null> => {
  const response = await apiClient.get(`${MUSIC_BASE}/albums/${id}`);
  const rawAlbum = response.data?.data || response.data || null;

  // Transform camelCase API response to snake_case expected by frontend
  if (rawAlbum) {
    const transformedAlbum: Album = {
      id_album: rawAlbum.idAlbum || rawAlbum.id_album,
      nombre_album: rawAlbum.nombreAlbum || rawAlbum.nombre_album,
      genero: rawAlbum.genero,
      descripcion: rawAlbum.descripcion,
      url_imagen: rawAlbum.urlImagen || rawAlbum.url_imagen
    };
    return transformedAlbum;
  }

  return null;
};

/**
 * Obtiene álbumes por nombre (búsqueda)
 */
export const getAlbumsByName = async (name: string): Promise<Album[]> => {
  const response = await apiClient.get(`${MUSIC_BASE}/albums/nombre/${encodeURIComponent(name)}`);
  return response.data?.data || [];
};

/**
 * Obtiene todas las canciones disponibles
 */
export const getSongs = async (): Promise<Song[]> => {
  const response = await apiClient.get(MUSIC_BASE);
  return response.data?.data || [];
};

/**
 * Obtiene una canción específica por ID
 */
export const getSongById = async (id: number): Promise<Song | null> => {
  const response = await apiClient.get(`${MUSIC_BASE}/${id}`);
  return response.data?.data || null;
};

/**
 * Obtiene canciones por nombre (búsqueda)
 */
export const getSongsByName = async (name: string): Promise<Song[]> => {
  const response = await apiClient.get(`${MUSIC_BASE}/nombre/${encodeURIComponent(name)}`);
  return response.data?.data || [];
};

/**
 * Obtiene canciones de un álbum específico
 */
export const getSongsByAlbumId = async (albumId: number): Promise<Song[]> => {
  const response = await apiClient.get(`${MUSIC_BASE}/albums/${albumId}`);
  const rawSongs = response.data?.data || response.data || [];

  // Transform camelCase API response to snake_case expected by frontend
  const transformedSongs: Song[] = Array.isArray(rawSongs) ? rawSongs.map(song => ({
    id_cancion: song.idCancion,
    nombre_cancion: song.nombreCancion,
    artista_cancion: song.artistaCancion,
    categoria: song.categoriaMusica || song.generoCancion,
    url_musica: song.urlMusica,
    id_album: song.idAlbum,
    duracion: song.duracion // May be undefined, will be handled by duration loading
  })) : [];

  return transformedSongs;
};

/**
 * Filtra canciones por ID de álbum (utilidad del lado cliente - deprecated, usar getSongsByAlbumId)
 */
export const filterSongsByAlbumId = (songs: Song[], albumId: number): Song[] => {
  return songs.filter(song => song.id_album === albumId);
};