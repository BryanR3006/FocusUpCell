import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Song } from '../types/api';
import Swal from 'sweetalert2';

// Modos de reproducción
export type PlaybackMode = 'ordered' | 'shuffle' | 'loop-one' | 'loop-all';

interface MusicPlayerState {
  currentSong: Song | null;
  currentAlbum: { id_album: number; nombre_album: string } | null;
  playlist: Song[];
  isPlaying: boolean;
  isShuffling: boolean;
  playbackMode: PlaybackMode;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
}

interface MusicPlayerContextType extends MusicPlayerState {
  // Funciones de control
  playSong: (song: Song) => void;
  playPlaylist: (songs: Song[], startIndex?: number, albumInfo?: { id_album: number; nombre_album: string }) => void;
  togglePlayPause: () => void;
  nextSong: () => void;
  previousSong: () => void;
  setShuffle: (shuffle: boolean) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
  addToPlaylist: (song: Song) => void;
  removeFromPlaylist: (index: number) => void;
  reorderPlaylist: (fromIndex: number, toIndex: number) => void;
  clearPlaylist: () => void;

  // Elemento de audio
  audioElement: HTMLAudioElement | null;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

const MUSIC_PLAYER_STORAGE_KEY = 'focusup-music-player';

export const MusicPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Persistent audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ref to access current state in event handlers
  const stateRef = useRef<MusicPlayerState | null>(null);

  // Provider lifecycle - no logging needed in production

  // Estado inicial
  const [state, setState] = useState<MusicPlayerState>({
    currentSong: null,
    currentAlbum: null,
    playlist: [],
    isPlaying: false,
    isShuffling: false,
    playbackMode: 'ordered',
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false,
  });

  // Fallback progress tracking for external URLs
  useEffect(() => {
    let progressInterval: number | null = null;

    if (state.isPlaying && audioRef.current) {
      // Update progress every 100ms as fallback
      progressInterval = window.setInterval(() => {
        if (audioRef.current && !audioRef.current.paused) {
          setState(prev => ({
            ...prev,
            currentTime: audioRef.current!.currentTime
          }));
        }
      }, 100);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [state.isPlaying]);

  // Cargar estado desde localStorage al montar
  useEffect(() => {
    const savedState = localStorage.getItem(MUSIC_PLAYER_STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          playlist: parsed.playlist || [],
          playbackMode: parsed.playbackMode || 'ordered',
          volume: parsed.volume ?? 0.7,
        }));
      } catch (error) {
        console.error('Error loading music player state:', error);
      }
    }
  }, []);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    const stateToSave = {
      playlist: state.playlist,
      playbackMode: state.playbackMode,
      volume: state.volume,
    };
    localStorage.setItem(MUSIC_PLAYER_STORAGE_KEY, JSON.stringify(stateToSave));

    // Update state ref for event handlers
    stateRef.current = state;
  }, [state.playlist, state.playbackMode, state.volume, state.currentSong, state.isPlaying, state.isShuffling, state.currentTime, state.duration, state.isLoading, state.currentAlbum]);

  // Setup audio element when ref is available
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;


    // Set initial volume
    audio.volume = state.volume;

    // Eventos del audio
    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration, isLoading: false }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true }));
    };

    const handleEnded = () => {
      handleSongEnd();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    // Cleanup function - NO pausar el audio para mantener reproducción persistente
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      // Nota: No llamamos audio.pause() para mantener reproducción persistente
    };
  }, []);

  // Actualizar volumen cuando cambie
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  const handleSongEnd = () => {
    const currentState = stateRef.current;
    if (!currentState) return;

    if (currentState.playbackMode === 'loop-one' && currentState.currentSong) {
      // Repetir la misma canción
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      // Para otros modos, intentar reproducir la siguiente canción
      const nextIndex = getNextSongIndex();
      if (nextIndex >= 0 && currentState.playlist[nextIndex]) {
        playSong(currentState.playlist[nextIndex]);
      } else {
        // No hay siguiente canción (fin de la lista en modo 'ordered')
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    }
  };

  const getNextSongIndex = (): number => {
    const currentState = stateRef.current;
    if (!currentState || !currentState.currentSong || currentState.playlist.length === 0) return -1;

    const currentIndex = currentState.playlist.findIndex(song => song.id_cancion === currentState.currentSong!.id_cancion);

    if (currentState.isShuffling) {
      // Modo aleatorio - canción aleatoria
      return Math.floor(Math.random() * currentState.playlist.length);
    } else if (currentState.playbackMode === 'loop-all') {
      // Modo loop-all - volver al inicio cuando llegue al final
      return (currentIndex + 1) % currentState.playlist.length;
    } else {
      // Modo ordered - siguiente canción o -1 si es la última
      const nextIndex = currentIndex + 1;
      return nextIndex < currentState.playlist.length ? nextIndex : -1;
    }
  };

  const getPreviousSongIndex = (): number => {
    const currentState = stateRef.current;
    if (!currentState || !currentState.currentSong || currentState.playlist.length === 0) return -1;

    const currentIndex = currentState.playlist.findIndex(song => song.id_cancion === currentState.currentSong!.id_cancion);

    if (currentState.isShuffling) {
      // En modo aleatorio, ir a una canción aleatoria
      return Math.floor(Math.random() * currentState.playlist.length);
    } else if (currentState.playbackMode === 'loop-all') {
      // Modo loop-all - ir a la anterior, o a la última si estamos en la primera
      return currentIndex > 0 ? currentIndex - 1 : currentState.playlist.length - 1;
    } else {
      // Modo ordered - ir a la anterior, o -1 si estamos en la primera
      return currentIndex > 0 ? currentIndex - 1 : -1;
    }
  };


  // Función para validar URL de audio
  const validateAudioUrl = (url: string): { isValid: boolean; reason?: string } => {
    if (!url || typeof url !== 'string') {
      return { isValid: false, reason: 'URL vacía o inválida' };
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { isValid: false, reason: 'URL debe comenzar con http:// o https://' };
    }

    // Detectar URLs de placeholder (como tu-proyecto.supabase.co)
    if (url.includes('tu-proyecto.supabase.co') || url.includes('placeholder') || url.includes('example.com')) {
      return { isValid: false, reason: 'URL de placeholder detectada - archivo no disponible' };
    }

    // Verificar extensiones soportadas
    const supportedExtensions = ['.mp3', '.m4a', '.wav', '.ogg'];
    const hasSupportedExtension = supportedExtensions.some(ext => url.toLowerCase().endsWith(ext));

    if (!hasSupportedExtension) {
      return { isValid: false, reason: 'Formato de archivo no soportado' };
    }

    return { isValid: true };
  };

  const playSong = (song: Song) => {
    // Validar URL antes de intentar reproducir
    const validation = validateAudioUrl(song.url_musica);
    if (!validation.isValid) {
      console.error('URL de audio inválida:', song.url_musica, 'Razón:', validation.reason);

      // En modo desarrollo, simular reproducción para URLs de placeholder
      if (validation.reason?.includes('placeholder')) {
        simulatePlayback(song);
        return;
      }

      Swal.fire({
        title: 'Error de reproducción',
        text: `${validation.reason}. La canción "${song.nombre_cancion || 'desconocida'}" no se puede reproducir.`,
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#EF4444',
        background: '#232323',
        color: '#ffffff',
        iconColor: '#EF4444',
      });
      setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, currentSong: song, isLoading: true }));

    if (audioRef.current) {
      // Limpiar eventos anteriores
      audioRef.current.removeEventListener('error', handleAudioError);
      audioRef.current.addEventListener('error', handleAudioError);

      audioRef.current.src = song.url_musica;
      audioRef.current.load(); // Forzar recarga

      // Set initial duration from database as fallback
      setState(prev => ({ ...prev, duration: song.duracion || 0 }));

      audioRef.current.play().then(() => {
        // Manually set isPlaying since events might not fire for external URLs
        setState(prev => ({ ...prev, isPlaying: true }));
      }).catch((error: any) => {
        console.error('Error reproduciendo canción:', error);
        setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));

        // Mostrar mensaje específico según el tipo de error
        if (error.name === 'NotSupportedError') {
          Swal.fire({
            title: 'Error de formato',
            text: 'El formato de audio no es soportado por este navegador.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#EF4444',
            background: '#232323',
            color: '#ffffff',
            iconColor: '#EF4444',
          });
        } else {
          Swal.fire({
            title: 'Error de reproducción',
            text: 'Error al reproducir la canción. Intentando la siguiente...',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#EF4444',
            background: '#232323',
            color: '#ffffff',
            iconColor: '#EF4444',
          });
        }

        // Intentar reproducir la siguiente canción automáticamente
        setTimeout(() => nextSong(), 2000);
      });
    }
  };

  // Función para simular reproducción en modo desarrollo
  const simulatePlayback = (song: Song) => {

    setState(prev => ({
      ...prev,
      currentSong: song,
      isPlaying: true,
      isLoading: false,
      duration: song.duracion || 180, // 3 minutos por defecto
      currentTime: 0
    }));

    // Simular progreso de la canción
    const interval = setInterval(() => {
      setState(prev => {
        const newTime = prev.currentTime + 1;
        if (newTime >= (prev.duration || 180)) {
          clearInterval(interval);
          // Simular fin de canción
          setTimeout(() => nextSong(), 1000);
          return { ...prev, currentTime: prev.duration || 180, isPlaying: false };
        }
        return { ...prev, currentTime: newTime };
      });
    }, 1000);

    // Limpiar intervalo si se cambia de canción
    setTimeout(() => clearInterval(interval), (song.duracion || 180) * 1000);
  };

  const handleAudioError = (e: Event) => {
    const audio = e.target as HTMLAudioElement;
    console.error('Error cargando archivo de audio:', audio.src);

    setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));

    // Determinar el tipo de error y mostrar mensaje apropiado
    if (audio.error) {
      switch (audio.error.code) {
        case MediaError.MEDIA_ERR_NETWORK:
          Swal.fire({
            title: 'Error de red',
            text: 'No se pudo cargar el archivo de audio.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#EF4444',
            background: '#232323',
            color: '#ffffff',
            iconColor: '#EF4444',
          });
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          Swal.fire({
            title: 'Error de formato',
            text: 'El formato de audio no es soportado.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#EF4444',
            background: '#232323',
            color: '#ffffff',
            iconColor: '#EF4444',
          });
          break;
        case MediaError.MEDIA_ERR_ABORTED:
          break;
        default:
          Swal.fire({
            title: 'Error desconocido',
            text: 'Error desconocido al cargar el archivo de audio.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#EF4444',
            background: '#232323',
            color: '#ffffff',
            iconColor: '#EF4444',
          });
      }
    }

    // Intentar reproducir la siguiente canción
    setTimeout(() => nextSong(), 3000);
  };

  const playPlaylist = (songs: Song[], startIndex: number = 0, albumInfo?: { id_album: number; nombre_album: string }) => {
    setState(prev => ({
      ...prev,
      playlist: [...songs],
      currentAlbum: albumInfo || null
    }));

    if (songs.length > 0) {
      const startSong = songs[startIndex] || songs[0];
      playSong(startSong);
    }
  };

  const togglePlayPause = () => {
    if (!state.currentSong) return;

    // Si hay un elemento de audio real, usarlo
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
      } else {
        audioRef.current.play().then(() => {
          setState(prev => ({ ...prev, isPlaying: true }));
        }).catch(() => {
          setState(prev => ({ ...prev, isPlaying: false }));
        });
      }
    } else {
      // Modo simulado - alternar estado de reproducción
      setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const nextSong = () => {
    const nextIndex = getNextSongIndex();
    const currentState = stateRef.current;
    if (nextIndex >= 0 && currentState && currentState.playlist[nextIndex]) {
      playSong(currentState.playlist[nextIndex]);
    } else if (currentState && currentState.playbackMode === 'ordered') {
      // En modo ordered, si no hay siguiente canción, detener reproducción
      setState(prev => ({ ...prev, isPlaying: false }));
    }
    // En otros modos (shuffle, loop-all), getNextSongIndex ya maneja el comportamiento correcto
  };

  const previousSong = () => {
    const prevIndex = getPreviousSongIndex();
    const currentState = stateRef.current;
    if (prevIndex >= 0 && currentState && currentState.playlist[prevIndex]) {
      playSong(currentState.playlist[prevIndex]);
    } else if (currentState && currentState.playbackMode === 'ordered') {
      // En modo ordered, si no hay canción anterior, detener reproducción
      setState(prev => ({ ...prev, isPlaying: false }));
    }
    // En otros modos (shuffle, loop-all), getPreviousSongIndex ya maneja el comportamiento correcto
  };

  const setShuffle = (shuffle: boolean) => {
    setState(prev => ({ ...prev, isShuffling: shuffle }));
  };

  const setPlaybackMode = (mode: PlaybackMode) => {
    setState(prev => ({ ...prev, playbackMode: mode }));
  };

  const setVolume = (volume: number) => {
    setState(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    } else {
      // Modo simulado
      setState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, prev.duration || 0)) }));
    }
  };

  const addToPlaylist = (song: Song) => {
    setState(prev => ({
      ...prev,
      playlist: [...prev.playlist, song]
    }));
  };

  const removeFromPlaylist = (index: number) => {
    setState(prev => {
      const newPlaylist = [...prev.playlist];
      newPlaylist.splice(index, 1);
      return { ...prev, playlist: newPlaylist };
    });
  };

  const reorderPlaylist = (fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newPlaylist = [...prev.playlist];
      const [moved] = newPlaylist.splice(fromIndex, 1);
      newPlaylist.splice(toIndex, 0, moved);
      return { ...prev, playlist: newPlaylist };
    });
  };

  const clearPlaylist = () => {
    setState(prev => ({
      ...prev,
      playlist: [],
      currentSong: null,
      isPlaying: false
    }));

    // No pausar el audio para mantener consistencia con reproducción persistente
    // Solo limpiar la fuente si es necesario
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const contextValue: MusicPlayerContextType = {
    ...state,
    playSong,
    playPlaylist,
    togglePlayPause,
    nextSong,
    previousSong,
    setShuffle,
    setPlaybackMode,
    setVolume,
    seekTo,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylist,
    clearPlaylist,
    audioElement: audioRef.current,
  };

  return (
    <MusicPlayerContext.Provider value={contextValue}>
      {children}
      <audio
        ref={audioRef}
        id="global-audio-element"
        preload="metadata"
        style={{ display: 'none' }}
      />
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};