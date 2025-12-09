// src/contexts/AudioContext.tsx
import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import type { Song } from '../types/api';

// Modos de reproducción (igual que web)
export type PlaybackMode = 'ordered' | 'loop-one' | 'loop-all';

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
  stopAndClear: () => Promise<void>;
  clearStorage: () => Promise<void>; // Nueva función para limpiar storage
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const MUSIC_PLAYER_STORAGE_KEY = '@focusup-music-player';

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Ref para acceder al estado actual en callbacks
  const stateRef = useRef<{
    playlist: Song[];
    playbackMode: PlaybackMode;
    volume: number;
    isShuffling: boolean;
    currentSong: Song | null;
  }>({
    playlist: [],
    playbackMode: 'ordered',
    volume: 0.7,
    isShuffling: false,
    currentSong: null,
  });

  const [state, setState] = useState<Omit<AudioContextType, 
    'playSong' | 'playPlaylist' | 'togglePlayPause' | 'nextSong' | 
    'previousSong' | 'setShuffle' | 'setPlaybackMode' | 'setVolume' | 
    'seekTo' | 'addToPlaylist' | 'removeFromPlaylist' | 'reorderPlaylist' | 
    'clearPlaylist' | 'stopAndClear' | 'clearStorage'
  >>({
    currentSong: null,
    currentAlbum: null,
    playlist: [],
    isPlaying: false,
    isShuffling: false, // Siempre empezar con shuffle desactivado
    playbackMode: 'ordered',
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isLoading: false,
  });

  // Cargar estado desde AsyncStorage (SOLO playlist y playbackMode)
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(MUSIC_PLAYER_STORAGE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          console.log('📥 Estado cargado desde AsyncStorage:', {
            playlistLength: parsed.playlist?.length || 0,
            playbackMode: parsed.playbackMode,
            volume: parsed.volume
          });
          
          setState(prev => ({
            ...prev,
            playlist: parsed.playlist || [],
            playbackMode: parsed.playbackMode || 'ordered',
            volume: parsed.volume ?? 0.7,
            // NO restaurar isShuffling - siempre empezar con false
          }));
          
          // Actualizar ref
          stateRef.current = {
            playlist: parsed.playlist || [],
            playbackMode: parsed.playbackMode || 'ordered',
            volume: parsed.volume ?? 0.7,
            isShuffling: false, // Siempre false al cargar
            currentSong: null,
          };
        } else {
          console.log('📭 No hay estado guardado en AsyncStorage');
        }
      } catch (error) {
        console.error('❌ Error loading music player state:', error);
      }
    };
    loadState();
  }, []);

  // Guardar estado en AsyncStorage (SOLO datos esenciales)
  useEffect(() => {
    const saveState = async () => {
      try {
        const stateToSave = {
          playlist: state.playlist,
          playbackMode: state.playbackMode,
          volume: state.volume,
          // NO guardar isShuffling, isPlaying, currentSong, etc.
        };
        
        console.log('💾 Guardando estado en AsyncStorage:', {
          playlistLength: stateToSave.playlist.length,
          playbackMode: stateToSave.playbackMode,
          volume: stateToSave.volume
        });
        
        await AsyncStorage.setItem(MUSIC_PLAYER_STORAGE_KEY, JSON.stringify(stateToSave));
        
        // Actualizar ref con estado actual
        stateRef.current = {
          playlist: state.playlist,
          playbackMode: state.playbackMode,
          volume: state.volume,
          isShuffling: state.isShuffling,
          currentSong: state.currentSong,
        };
        
      } catch (error) {
        console.error('❌ Error saving music player state:', error);
      }
    };
    
    // Solo guardar cuando cambien estos valores
    saveState();
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
        console.log('✅ Audio configurado correctamente');
      } catch (error) {
        console.error('❌ Error setting up audio mode:', error);
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

  // Obtener índice de la siguiente canción - VERSIÓN CORREGIDA
  const getNextSongIndex = (): number => {
    const currentState = stateRef.current;
    
    if (!currentState.currentSong || currentState.playlist.length === 0) {
      console.log('⚠️ No hay canción actual o playlist vacía');
      return -1;
    }

    const currentIndex = currentState.playlist.findIndex(
      song => song.id_cancion === currentState.currentSong!.id_cancion
    );

    console.log('🎵 getNextSongIndex:', {
      currentSong: currentState.currentSong?.nombre_cancion,
      currentIndex,
      playlistLength: currentState.playlist.length,
      playbackMode: currentState.playbackMode,
      isShuffling: currentState.isShuffling
    });

    // Si no encontramos la canción actual, empezar desde 0
    if (currentIndex === -1) {
      console.log('⚠️ Canción actual no encontrada en playlist, empezando desde 0');
      return 0;
    }

    // 1. PRIMERO verificar si shuffle está activado
    if (currentState.isShuffling) {
      console.log('🎲 Modo shuffle activado');
      
      if (currentState.playlist.length === 1) {
        console.log('🎵 Solo una canción, devolviendo 0');
        return 0;
      }
      
      // Generar índice aleatorio diferente al actual
      let newIndex;
      let attempts = 0;
      const maxAttempts = 20;
      
      do {
        newIndex = Math.floor(Math.random() * currentState.playlist.length);
        attempts++;
        
        if (attempts >= maxAttempts) {
          console.warn('⚠️ Máximo de intentos alcanzado, usando cálculo alternativo');
          newIndex = (currentIndex + 1) % currentState.playlist.length;
          break;
        }
      } while (newIndex === currentIndex);
      
      console.log(`🎲 Índice shuffle: ${newIndex} (intentos: ${attempts})`);
      return newIndex;
    }
    
    // 2. SI NO HAY SHUFFLE, usar playbackMode
    console.log('📋 Usando playbackMode:', currentState.playbackMode);
    
    switch (currentState.playbackMode) {
      case 'loop-one':
        console.log('🔁 Modo loop-one, misma canción:', currentIndex);
        return currentIndex;
        
      case 'loop-all':
        const nextIndex = (currentIndex + 1) % currentState.playlist.length;
        console.log('🔁 Modo loop-all, siguiente índice:', nextIndex);
        return nextIndex;
        
      case 'ordered':
      default:
        const orderedNext = currentIndex + 1;
        const result = orderedNext < currentState.playlist.length ? orderedNext : -1;
        console.log('➡️ Modo ordered, siguiente:', result);
        return result;
    }
  };

  // Obtener índice de la canción anterior - VERSIÓN CORREGIDA
  const getPreviousSongIndex = (): number => {
    const currentState = stateRef.current;
    
    if (!currentState.currentSong || currentState.playlist.length === 0) {
      return -1;
    }

    const currentIndex = currentState.playlist.findIndex(
      song => song.id_cancion === currentState.currentSong!.id_cancion
    );

    if (currentIndex === -1) return 0;

    // Shuffle: también aleatorio para "anterior"
    if (currentState.isShuffling) {
      if (currentState.playlist.length === 1) return 0;
      
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * currentState.playlist.length);
      } while (newIndex === currentIndex && currentState.playlist.length > 1);
      return newIndex;
    }
    
    // Modos normales
    switch (currentState.playbackMode) {
      case 'loop-one':
        return currentIndex;
        
      case 'loop-all':
        return currentIndex > 0 ? currentIndex - 1 : currentState.playlist.length - 1;
        
      case 'ordered':
      default:
        return currentIndex > 0 ? currentIndex - 1 : -1;
    }
  };

  // Reproducir una canción
  const playSong = async (song: Song) => {
    console.log('🎵 Iniciando reproducción de:', song.nombre_cancion);
    console.log('🎵 Estado actual:', {
      modo: state.playbackMode,
      shuffle: state.isShuffling,
      playlistLength: state.playlist.length,
      canciónActual: state.currentSong?.nombre_cancion
    });

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
        console.log('⏹️ Deteniendo audio anterior');
        await soundRef.current.unloadAsync();
      }

      // Crear nuevo sonido
      console.log('🔊 Creando nuevo audio:', song.url_musica);
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
        currentTime: 0,
      }));
      
      // Actualizar ref
      stateRef.current.currentSong = song;
      
      console.log('✅ Canción reproduciéndose:', song.nombre_cancion);

    } catch (error: any) {
      console.error('❌ Error reproduciendo canción:', error);
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
      console.log('🎵 Canción terminada (onPlaybackStatusUpdate)');
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

  // Manejar fin de canción - VERSIÓN CORREGIDA
  const handleSongEnd = async () => {
    console.log('🎵 handleSongEnd llamado');
    console.log('🎵 Estado en handleSongEnd:', {
      modo: state.playbackMode,
      shuffle: state.isShuffling,
      canciónActual: state.currentSong?.nombre_cancion
    });
    
    // Modo loop-one: repetir misma canción
    if (state.playbackMode === 'loop-one' && state.currentSong && soundRef.current) {
      console.log('🔁 Repitiendo misma canción (loop-one)');
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
      return;
    }
    
    // Para otros modos, obtener siguiente canción
    const nextIndex = getNextSongIndex();
    console.log('🎵 Índice siguiente calculado:', nextIndex);
    
    if (nextIndex >= 0 && state.playlist[nextIndex]) {
      // Hay siguiente canción - reproducirla
      console.log('⏭️ Reproduciendo siguiente canción:', state.playlist[nextIndex].nombre_cancion);
      await playSong(state.playlist[nextIndex]);
    } else {
      // No hay siguiente canción
      console.log('⏹️ No hay siguiente canción');
      
      if (state.playbackMode === 'loop-all' && state.playlist.length > 0) {
        // En loop-all, volver al inicio
        console.log('🔁 Volviendo al inicio (loop-all)');
        await playSong(state.playlist[0]);
      } else {
        // En ordered o sin más canciones, detener
        console.log('⏹️ Deteniendo reproducción');
        if (soundRef.current) {
          await soundRef.current.stopAsync();
        }
        setState(prev => ({ 
          ...prev, 
          isPlaying: false,
          currentTime: 0 
        }));
      }
    }
  };

  // Reproducir playlist
  const playPlaylist = async (songs: Song[], startIndex: number = 0, albumInfo?: { id_album: number; nombre_album: string }) => {
    console.log('🎵 playPlaylist llamado:', {
      canciones: songs.length,
      inicio: startIndex,
      álbum: albumInfo?.nombre_album
    });
    
    // Resetear shuffle cuando se cambia de playlist
    setState(prev => ({
      ...prev,
      playlist: [...songs],
      currentAlbum: albumInfo || null,
      isShuffling: false, // Siempre empezar sin shuffle
    }));

    if (songs.length > 0) {
      const startSong = songs[startIndex] || songs[0];
      await playSong(startSong);
    }
  };

  // Alternar play/pause
  const togglePlayPause = async () => {
    console.log('⏯️ togglePlayPause - isPlaying actual:', state.isPlaying);
    
    if (!state.currentSong || !soundRef.current) {
      console.log('⚠️ No hay canción o audio para pausar/reanudar');
      return;
    }

    try {
      if (state.isPlaying) {
        console.log('⏸️ Pausando canción');
        await soundRef.current.pauseAsync();
        setState(prev => ({ ...prev, isPlaying: false }));
      } else {
        console.log('▶️ Reanudando canción');
        await soundRef.current.playAsync();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado de reproducción:', error);
    }
  };

  // Siguiente canción - VERSIÓN CORREGIDA
  const nextSong = async () => {
    console.log('⏭️ Botón siguiente presionado');
    const nextIndex = getNextSongIndex();
    console.log('🎵 Índice siguiente:', nextIndex);
    
    if (nextIndex >= 0 && state.playlist[nextIndex]) {
      await playSong(state.playlist[nextIndex]);
    } else if (state.playbackMode === 'loop-all' && state.playlist.length > 0) {
      // En loop-all, volver al inicio cuando llegamos al final
      console.log('🔁 Volviendo al inicio (loop-all desde nextSong)');
      await playSong(state.playlist[0]);
    } else {
      // No hay siguiente canción, detener
      console.log('⏹️ No hay siguiente canción, deteniendo');
      if (soundRef.current) {
        await soundRef.current.stopAsync();
      }
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        currentTime: 0 
      }));
    }
  };

  // Canción anterior - VERSIÓN CORREGIDA
  const previousSong = async () => {
    console.log('⏮️ Botón anterior presionado');
    const prevIndex = getPreviousSongIndex();
    console.log('🎵 Índice anterior:', prevIndex);
    
    if (prevIndex >= 0 && state.playlist[prevIndex]) {
      await playSong(state.playlist[prevIndex]);
    } else if (state.playbackMode === 'loop-all' && state.playlist.length > 0) {
      // En loop-all, ir a la última cuando estamos en la primera
      console.log('🔁 Yendo a la última canción (loop-all desde previousSong)');
      await playSong(state.playlist[state.playlist.length - 1]);
    } else {
      // No hay canción anterior, reiniciar la actual
      console.log('🔁 Reiniciando canción actual');
      if (soundRef.current && state.currentSong) {
        await soundRef.current.setPositionAsync(0);
        setState(prev => ({ ...prev, currentTime: 0 }));
      }
    }
  };

  // Cambiar modo shuffle - VERSIÓN MEJORADA
  const setShuffle = (shuffle: boolean) => {
    console.log('🔄 setShuffle llamado:', {
      nuevo: shuffle,
      anterior: state.isShuffling,
      modoActual: state.playbackMode
    });
    
    // Si activamos shuffle y estamos en loop-one, cambiar a ordered
    if (shuffle && state.playbackMode === 'loop-one') {
      console.log('⚠️ Cambiando de loop-one a ordered para activar shuffle');
      setState(prev => ({ 
        ...prev, 
        isShuffling: true,
        playbackMode: 'ordered'
      }));
    } else {
      setState(prev => ({ ...prev, isShuffling: shuffle }));
    }
    
    // Actualizar ref inmediatamente
    stateRef.current.isShuffling = shuffle;
  };

  // Cambiar modo de reproducción - VERSIÓN MEJORADA
  const setPlaybackMode = (mode: PlaybackMode) => {
    console.log('🔄 setPlaybackMode llamado:', {
      nuevo: mode,
      anterior: state.playbackMode,
      shuffleActual: state.isShuffling
    });
    
    // Si cambiamos a un modo que no sea ordered y shuffle está activado, desactivar shuffle
    if (state.isShuffling && mode !== 'ordered') {
      console.log('⚠️ Desactivando shuffle porque se cambió a modo:', mode);
      setState(prev => ({ 
        ...prev, 
        playbackMode: mode,
        isShuffling: false 
      }));
      stateRef.current.isShuffling = false;
    } else {
      setState(prev => ({ ...prev, playbackMode: mode }));
    }
    
    stateRef.current.playbackMode = mode;
  };

  // Cambiar volumen
  const setVolume = async (volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    console.log('🔊 Cambiando volumen a:', newVolume);
    
    setState(prev => ({ ...prev, volume: newVolume }));
    stateRef.current.volume = newVolume;
    
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newVolume);
    }
  };

  // Buscar posición específica
  const seekTo = async (time: number) => {
    console.log('⏩ Seek a:', time, 'segundos');
    
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(time * 1000);
      setState(prev => ({ ...prev, currentTime: time }));
    }
  };

  // Agregar a playlist
  const addToPlaylist = (song: Song) => {
    console.log('➕ Añadiendo canción a playlist:', song.nombre_cancion);
    
    setState(prev => ({
      ...prev,
      playlist: [...prev.playlist, song]
    }));
  };

  // Eliminar de playlist
  const removeFromPlaylist = (index: number) => {
    console.log('➖ Eliminando canción de playlist, índice:', index);
    
    setState(prev => {
      const newPlaylist = [...prev.playlist];
      newPlaylist.splice(index, 1);
      return { ...prev, playlist: newPlaylist };
    });
  };

  // Reordenar playlist
  const reorderPlaylist = (fromIndex: number, toIndex: number) => {
    console.log('🔄 Reordenando playlist:', fromIndex, '→', toIndex);
    
    setState(prev => {
      const newPlaylist = [...prev.playlist];
      const [moved] = newPlaylist.splice(fromIndex, 1);
      newPlaylist.splice(toIndex, 0, moved);
      return { ...prev, playlist: newPlaylist };
    });
  };

  // Limpiar playlist
  const clearPlaylist = async () => {
    console.log('🧹 Limpiando playlist');
    
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
    }

    setState(prev => ({
      ...prev,
      playlist: [],
      currentSong: null,
      currentAlbum: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isShuffling: false,
      playbackMode: 'ordered',
    }));
    
    // Actualizar ref
    stateRef.current = {
      playlist: [],
      playbackMode: 'ordered',
      volume: 0.7,
      isShuffling: false,
      currentSong: null,
    };
  };

  // 🆕 FUNCIÓN: Limpiar AsyncStorage
  const clearStorage = async (): Promise<void> => {
    try {
      console.log('🧹 Limpiando AsyncStorage...');
      await AsyncStorage.removeItem(MUSIC_PLAYER_STORAGE_KEY);
      console.log('✅ AsyncStorage limpiado');
    } catch (error) {
      console.error('❌ Error limpiando AsyncStorage:', error);
    }
  };

  // 🆕 FUNCIÓN: Detener todo y limpiar completamente
  const stopAndClear = async (): Promise<void> => {
    try {
      console.log('🛑 stopAndClear llamado');
      
      // 1. Detener y descargar el audio si existe
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          console.log('✅ Audio detenido');
        } catch (error) {
          console.warn('⚠️ Error al detener audio:', error);
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
      
      // 3. Resetear ref
      stateRef.current = {
        playlist: [],
        playbackMode: 'ordered',
        volume: 0.7,
        isShuffling: false,
        currentSong: null,
      };
      
      // 4. Limpiar AsyncStorage
      try {
        await AsyncStorage.removeItem(MUSIC_PLAYER_STORAGE_KEY);
        console.log('✅ AsyncStorage limpiado');
      } catch (error) {
        console.warn('⚠️ Error limpiando almacenamiento:', error);
      }
      
      console.log('✅ Audio detenido y estado limpiado completamente');
    } catch (error) {
      console.error('❌ Error en stopAndClear:', error);
    }
  };

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        console.log('🧹 Limpiando audio al desmontar');
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
    stopAndClear,
    clearStorage, // Nueva función
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