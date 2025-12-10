/**
 * Pruebas unitarias para audioService
 *
 * Verifica el uso de la función factory cuando se le pasa un mock musicPlayerApi.
 */

import { describe, it, expect, vi } from 'vitest';
import { replaceIfSessionAlbum, type MusicPlayerApi } from './audioService';
import type { Song } from '../types/api';

describe('audioService', () => {
  describe('replaceIfSessionAlbum', () => {
    it('debe llamar a playPlaylist cuando se proporciona un albumId válido', async () => {
      const mockMusicPlayerApi: MusicPlayerApi = {
        playPlaylist: vi.fn(),
        currentAlbum: null,
        isPlaying: false,
        togglePlayPause: vi.fn(),
      };

      const mockSongs: Song[] = [
        {
          id_cancion: 1,
          nombre_cancion: 'Canción 1',
          artista_cancion: 'Artista 1',
          categoria: 'Lo-fi',
          url_musica: 'http://example.com/song1.mp3',
          id_album: 1,
        },
        {
          id_cancion: 2,
          nombre_cancion: 'Canción 2',
          artista_cancion: 'Artista 1',
          categoria: 'Lo-fi',
          url_musica: 'http://example.com/song2.mp3',
          id_album: 1,
        },
      ];

      await replaceIfSessionAlbum(mockMusicPlayerApi, 1, mockSongs, {
        id_album: 1,
        nombre_album: 'Álbum de prueba',
      });

      expect(mockMusicPlayerApi.playPlaylist).toHaveBeenCalledWith(
        mockSongs,
        0,
        {
          id_album: 1,
          nombre_album: 'Álbum de prueba',
        }
      );
    });

    it('debe manejar el caso cuando no hay canciones', async () => {
      const mockMusicPlayerApi: MusicPlayerApi = {
        playPlaylist: vi.fn(),
        currentAlbum: null,
        isPlaying: false,
        togglePlayPause: vi.fn(),
      };

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await replaceIfSessionAlbum(mockMusicPlayerApi, 1, [], {
        id_album: 1,
        nombre_album: 'Álbum vacío',
      });

      expect(mockMusicPlayerApi.playPlaylist).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('No se encontraron canciones para el álbum 1');

      consoleWarnSpy.mockRestore();
    });

    it('no debe llamar a playPlaylist cuando albumId es undefined', async () => {
      const mockMusicPlayerApi: MusicPlayerApi = {
        playPlaylist: vi.fn(),
        currentAlbum: null,
        isPlaying: false,
        togglePlayPause: vi.fn(),
      };

      const mockSongs: Song[] = [
        {
          id_cancion: 1,
          nombre_cancion: 'Canción 1',
          artista_cancion: 'Artista 1',
          categoria: 'Lo-fi',
          url_musica: 'http://example.com/song1.mp3',
          id_album: 1,
        },
      ];

      await replaceIfSessionAlbum(mockMusicPlayerApi, undefined, mockSongs);

      expect(mockMusicPlayerApi.playPlaylist).not.toHaveBeenCalled();
    });

    it('debe manejar errores y relanzarlos', async () => {
      const mockMusicPlayerApi: MusicPlayerApi = {
        playPlaylist: vi.fn().mockImplementation(() => {
          throw new Error('Error de reproducción');
        }),
        currentAlbum: null,
        isPlaying: false,
        togglePlayPause: vi.fn(),
      };

      const mockSongs: Song[] = [
        {
          id_cancion: 1,
          nombre_cancion: 'Canción 1',
          artista_cancion: 'Artista 1',
          categoria: 'Lo-fi',
          url_musica: 'http://example.com/song1.mp3',
          id_album: 1,
        },
      ];

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        replaceIfSessionAlbum(mockMusicPlayerApi, 1, mockSongs)
      ).rejects.toThrow('Error de reproducción');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error iniciando reproducción del álbum de sesión:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});