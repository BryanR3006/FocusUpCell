import { useAudio } from '../contexts/AudioContext';
import type { Song } from '../types/api';

export const useMusicPlayer = () => {
  const audioContext = useAudio();

  return {
    // Funciones adicionales si las necesitas
    playAlbum: (songs: Song[], albumInfo: { id_album: number; nombre_album: string }) => {
      return audioContext.playPlaylist(songs, 0, albumInfo);
    },
  };
};