import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import type { Song } from '../types/api';

// Modos de reproducción (igual que web)
export type PlaybackMode = 'ordered' | 'shuffle' | 'loop-one' | 'loop-all';

interface AudioContextType {
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

  // Funciones de control
  playSong: (song: Song) => Promise<void>;
  playPlaylist: (songs: Song[], startIndex?: number, albumInfo?: { id_album: number; nombre_album: string }) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  setShuffle: (shuffle: boolean) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => Promise<void>;
  addToPlaylist: (song: Song) => void;
  removeFromPlaylist: (index: number) => void;
  reorderPlaylist: (fromIndex: number, toIndex: number) => void;
  clearPlaylist: () => Promise<void>;
  stopAndClear: () => Promise<void>; // ← NUEVA: Función para detener y limpiar todo
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const MUSIC_PLAYER_STORAGE_KEY = '@focusup-music-player';

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const stateRef = useRef<{
    playlist: Song[];
    playbackMode: PlaybackMode;
    volume: number;
  }>({
    playlist: [],
    playbackMode: 'ordered',
    volume: 0.7,
  });

  const [state, setState] = useState<Omit<AudioContextType, 
    'playSong' | 'playPlaylist' | 'togglePlayPause' | 'nextSong' | 
    'previousSong' | 'setShuffle' | 'setPlaybackMode' | 'setVolume' | 
    'seekTo' | 'addToPlaylist' | 'removeFromPlaylist' | 'reorderPlaylist' | 'clearPlaylist' | 'stopAndClear'
  >>({
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

  // Cargar estado desde AsyncStorage
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(MUSIC_PLAYER_STORAGE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setState(prev => ({
            ...prev,
            playlist: parsed.playlist || [],
            playbackMode: parsed.playbackMode || 'ordered',
            volume: parsed.volume ?? 0.7,
          }));
          stateRef.current = {
            playlist: parsed.playlist || [],
            playbackMode: parsed.playbackMode || 'ordered',
            volume: parsed.volume ?? 0.7,
          };
        }
      } catch (error) {
        console.error('Error loading music player state:', error);
      }
    };
    loadState();
  }, []);

  // Guardar estado en AsyncStorage
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem(MUSIC_PLAYER_STORAGE_KEY, JSON.stringify({
          playlist: state.playlist,
          playbackMode: state.playbackMode,
          volume: state.volume,
        }));
      } catch (error) {
        console.error('Error saving music player state:', error);
      }
    };
    saveState();
    stateRef.current = {
      playlist: state.playlist,
      playbackMode: state.playbackMode,
      volume: state.volume,
    };
  }, [state.playlist, state.playbackMode, state.volume]);

  // Configurar Audio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error setting up audio mode:', error);
      }
    };
    setupAudio();
  }, []);

  // Validar URL de audio
  const validateAudioUrl = (url: string): { isValid: boolean; reason?: string } => {
    if (!url || typeof url !== 'string') {
      return { isValid: false, reason: 'URL vacía o inválida' };
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { isValid: false, reason: 'URL debe comenzar con http:// o https://' };
    }

    if (url.includes('placeholder') || url.includes('example.com')) {
      return { isValid: false, reason: 'URL de placeholder detectada' };
    }

    return { isValid: true };
  };

  // Obtener índice de la siguiente canción
  const getNextSongIndex = (): number => {
    if (!state.currentSong || state.playlist.length === 0) return -1;

    const currentIndex = state.playlist.findIndex(
      song => song.id_cancion === state.currentSong!.id_cancion
    );

    if (state.isShuffling) {
      return Math.floor(Math.random() * state.playlist.length);
    } else if (state.playbackMode === 'loop-all') {
      return (currentIndex + 1) % state.playlist.length;
    } else {
      const nextIndex = currentIndex + 1;
      return nextIndex < state.playlist.length ? nextIndex : -1;
    }
  };

  // Obtener índice de la canción anterior
  const getPreviousSongIndex = (): number => {
    if (!state.currentSong || state.playlist.length === 0) return -1;

    const currentIndex = state.playlist.findIndex(
      song => song.id_cancion === state.currentSong!.id_cancion
    );

    if (state.isShuffling) {
      return Math.floor(Math.random() * state.playlist.length);
    } else if (state.playbackMode === 'loop-all') {
      return currentIndex > 0 ? currentIndex - 1 : state.playlist.length - 1;
    } else {
      return currentIndex > 0 ? currentIndex - 1 : -1;
    }
  };

  // Reproducir una canción
  const playSong = async (song: Song) => {
    // Validar URL
    const validation = validateAudioUrl(song.url_musica);
    if (!validation.isValid) {
      console.error('URL de audio inválida:', validation.reason);
      Alert.alert(
        'Error de reproducción',
        `${validation.reason}. La canción "${song.nombre_cancion || 'desconocida'}" no se puede reproducir.`
      );
      setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, currentSong: song, isLoading: true }));

    try {
      // Detener sonido actual si existe
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Crear nuevo sonido
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.url_musica },
        { 
          shouldPlay: true,
          volume: state.volume,
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;

      // Actualizar estado
      setState(prev => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
        duration: song.duracion || 180,
      }));

    } catch (error: any) {
      console.error('Error reproduciendo canción:', error);
      setState(prev => ({ ...prev, isPlaying: false, isLoading: false }));

      Alert.alert(
        'Error de reproducción',
        'No se pudo reproducir la canción. Intentando la siguiente...'
      );

      // Intentar siguiente canción
      setTimeout(() => nextSong(), 2000);
    }
  };

  // Actualizar estado de reproducción
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      handleSongEnd();
    } else {
      setState(prev => ({
        ...prev,
        currentTime: status.positionMillis / 1000,
        duration: status.durationMillis ? status.durationMillis / 1000 : prev.duration,
        isPlaying: status.isPlaying,
      }));
    }
  };

  // Manejar fin de canción
  const handleSongEnd = async () => {
    if (state.playbackMode === 'loop-one' && state.currentSong) {
      // Repetir misma canción
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      }
    } else {
      // Siguiente canción
      const nextIndex = getNextSongIndex();
      if (nextIndex >= 0 && state.playlist[nextIndex]) {
        await playSong(state.playlist[nextIndex]);
      } else {
        // Fin de la lista
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    }
  };

  // Reproducir playlist
  const playPlaylist = async (songs: Song[], startIndex: number = 0, albumInfo?: { id_album: number; nombre_album: string }) => {
    setState(prev => ({
      ...prev,
      playlist: [...songs],
      currentAlbum: albumInfo || null,
    }));

    if (songs.length > 0) {
      const startSong = songs[startIndex] || songs[0];
      await playSong(startSong);
    }
  };

  // Alternar play/pause
  const togglePlayPause = async () => {
    if (!state.currentSong || !soundRef.current) return;

    try {
      if (state.isPlaying) {
        await soundRef.current.pauseAsync();
        setState(prev => ({ ...prev, isPlaying: false }));
      } else {
        await soundRef.current.playAsync();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error('Error al cambiar estado de reproducción:', error);
    }
  };

  // Siguiente canción
  const nextSong = async () => {
    const nextIndex = getNextSongIndex();
    if (nextIndex >= 0 && state.playlist[nextIndex]) {
      await playSong(state.playlist[nextIndex]);
    } else if (state.playbackMode === 'ordered') {
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  // Canción anterior
  const previousSong = async () => {
    const prevIndex = getPreviousSongIndex();
    if (prevIndex >= 0 && state.playlist[prevIndex]) {
      await playSong(state.playlist[prevIndex]);
    } else if (state.playbackMode === 'ordered') {
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  // Cambiar modo shuffle
  const setShuffle = (shuffle: boolean) => {
    setState(prev => ({ ...prev, isShuffling: shuffle }));
  };

  // Cambiar modo de reproducción
  const setPlaybackMode = (mode: PlaybackMode) => {
    setState(prev => ({ ...prev, playbackMode: mode }));
  };

  // Cambiar volumen
  const setVolume = async (volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: newVolume }));
    
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newVolume);
    }
  };

  // Buscar posición específica
  const seekTo = async (time: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(time * 1000);
      setState(prev => ({ ...prev, currentTime: time }));
    }
  };

  // Agregar a playlist
  const addToPlaylist = (song: Song) => {
    setState(prev => ({
      ...prev,
      playlist: [...prev.playlist, song]
    }));
  };

  // Eliminar de playlist
  const removeFromPlaylist = (index: number) => {
    setState(prev => {
      const newPlaylist = [...prev.playlist];
      newPlaylist.splice(index, 1);
      return { ...prev, playlist: newPlaylist };
    });
  };

  // Reordenar playlist
  const reorderPlaylist = (fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newPlaylist = [...prev.playlist];
      const [moved] = newPlaylist.splice(fromIndex, 1);
      newPlaylist.splice(toIndex, 0, moved);
      return { ...prev, playlist: newPlaylist };
    });
  };

  // Limpiar playlist
  const clearPlaylist = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
    }

    setState(prev => ({
      ...prev,
      playlist: [],
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    }));
  };

  // 🆕 FUNCIÓN NUEVA: Detener todo y limpiar completamente
  const stopAndClear = async (): Promise<void> => {
    try {
      console.log('🛑 Deteniendo audio y limpiando estado...');
      
      // 1. Detener y descargar el audio si existe
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (error) {
          console.warn('Error al detener audio:', error);
        }
        soundRef.current = null;
      }
      
      // 2. Resetear TODO el estado a valores iniciales
      setState({
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
      
      // 3. Limpiar AsyncStorage
      try {
        await AsyncStorage.removeItem(MUSIC_PLAYER_STORAGE_KEY);
      } catch (error) {
        console.warn('Error limpiando almacenamiento:', error);
      }
      
      console.log('✅ Audio detenido y estado limpiado');
    } catch (error) {
      console.error('❌ Error en stopAndClear:', error);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const contextValue: AudioContextType = {
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
    stopAndClear, // ← INCLUIDA EN EL CONTEXTO
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};