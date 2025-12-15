import { useAudio } from '../contexts/AudioContext';
import type { Song } from '../types/api';

export const useMusicPlayer = () => {
  const audioContext = useAudio();

  return {
    // Funciones adicionales si las necesitas
    playAlbum: (songs: Song[], albumInfo: { id_album: number; nombre_album: string }) => {
      return audioContext.playPlaylist(songs, 0, albumInfo);
    },
    // Expose additional properties needed by Reports.tsx
    playPlaylist: audioContext.playPlaylist,
    currentAlbum: audioContext.currentAlbum,
    isPlaying: audioContext.isPlaying,
    togglePlayPause: audioContext.togglePlayPause,
  };
};