/**
 * Servicio de audio para integración con sesiones de concentración
 *
 * Este módulo proporciona funciones puras para controlar la reproducción de música
 * durante las sesiones. Las funciones aceptan una API de musicPlayer inyectada
 * para evitar el uso de hooks fuera de componentes React.
 *
 * Reglas de reproducción:
 * - Si no se selecciona álbum y el audio ya está reproduciendo → continuar
 * - Si se selecciona álbum → reemplazar reproducción actual
 * - Minimizar/maximizar no afecta el audio
 */

import type { Song } from '../types/api';

// Interfaz para la API del music player inyectada
export interface MusicPlayerApi {
  playPlaylist: (songs: Song[], startIndex?: number, albumInfo?: { id_album: number; nombre_album: string }) => void;
  currentAlbum: { id_album: number; nombre_album: string } | null;
  isPlaying: boolean;
  togglePlayPause: () => void;
}

/**
 * Reproduce un álbum específico filtrando canciones por id_album
 *
 * Esta función es pura y requiere que se le inyecte la API del music player
 * y la lista completa de canciones. Se filtran las canciones por id_album
 * para reproducir únicamente las del álbum seleccionado.
 *
 * @param musicPlayerApi - API del music player inyectada desde componente React
 * @param albumId - ID del álbum a reproducir
 * @param allSongs - Lista completa de canciones desde la API
 * @param albumInfo - Información del álbum para metadata
 */
export async function replaceIfSessionAlbum(
  musicPlayerApi: MusicPlayerApi,
  albumId: number | undefined,
  albumSongs: Song[],
  albumInfo?: { id_album: number; nombre_album: string }
): Promise<void> {
  try {
    // Si no hay albumId, no hacer nada
    if (!albumId) {
      console.log('No hay albumId especificado, no se cambia la reproducción');
      return;
    }

    if (albumSongs.length === 0) {
      console.warn(`No se encontraron canciones para el álbum ${albumId}`);
      return;
    }

    // Verificar si ya está reproduciendo el álbum correcto
    if (musicPlayerApi.currentAlbum && musicPlayerApi.currentAlbum.id_album === albumId) {
      console.log('Álbum de sesión ya está reproduciendo');
      return;
    }

    // Iniciar reproducción con las canciones del álbum
    console.log(`Reproduciendo ${albumSongs.length} canciones del álbum ${albumInfo?.nombre_album || albumId}`);
    musicPlayerApi.playPlaylist(albumSongs, 0, albumInfo);

  } catch (error) {
    console.error('Error iniciando reproducción del álbum de sesión:', error);
    throw error;
  }
}

/**
 * Pausa la reproducción actual
 *
 * @param musicPlayerApi - API del music player inyectada
 */
export function pausePlayback(musicPlayerApi: MusicPlayerApi): void {
  try {
    musicPlayerApi.togglePlayPause();
  } catch (error) {
    console.error('Error pausando reproducción:', error);
  }
}

/**
 * Reanuda la reproducción
 *
 * @param musicPlayerApi - API del music player inyectada
 */
export function resumePlayback(musicPlayerApi: MusicPlayerApi): void {
  try {
    musicPlayerApi.togglePlayPause();
  } catch (error) {
    console.error('Error reanudando reproducción:', error);
  }
}

/**
 * Obtiene información del álbum actualmente reproduciendo
 *
 * @param musicPlayerApi - API del music player inyectada
 * @returns Información del álbum actual o null
 */
export function getCurrentAlbum(musicPlayerApi: MusicPlayerApi): { id: number; name: string } | null {
  try {
    if (musicPlayerApi.currentAlbum) {
      return {
        id: musicPlayerApi.currentAlbum.id_album,
        name: musicPlayerApi.currentAlbum.nombre_album,
      };
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo álbum actual:', error);
    return null;
  }
}

/**
 * Determina si se debe reemplazar la reproducción actual
 *
 * @param musicPlayerApi - API del music player inyectada
 * @param sessionAlbumId - ID del álbum de la sesión
 * @returns true si se debe reemplazar
 */
export function shouldReplacePlayback(musicPlayerApi: MusicPlayerApi, sessionAlbumId?: number): boolean {
  try {
    const currentAlbum = getCurrentAlbum(musicPlayerApi);

    // Si no hay álbum de sesión, no reemplazar
    if (!sessionAlbumId) {
      return false;
    }

    // Si hay álbum de sesión y es diferente al actual, reemplazar
    if (currentAlbum && currentAlbum.id !== sessionAlbumId) {
      return true;
    }

    // Si no hay álbum actual pero hay álbum de sesión, reemplazar
    if (!currentAlbum && sessionAlbumId) {
      return true;
    }

    // En cualquier otro caso, no reemplazar
    return false;
  } catch (error) {
    console.error('Error determinando si reemplazar reproducción:', error);
    return false;
  }
}