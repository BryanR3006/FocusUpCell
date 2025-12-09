import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RefreshCw,
  Shuffle,
  ListMusic,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  Music,
  ArrowUp,
  ArrowDown,
  GripVertical,
  StopCircle,
} from 'lucide-react-native';
import { useAudio, type PlaybackMode } from '../contexts/AudioContext';
import { useAuth } from '../contexts/AuthContext';
import { getLocalAlbumImage } from '../utils/musicUtils';
import type { Song } from '../types/api';

const { width, height } = Dimensions.get('window');

export const CompactMusicPlayer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    currentSong,
    playlist,
    isPlaying,
    isShuffling,
    playbackMode,
    currentTime,
    duration,
    togglePlayPause,
    nextSong,
    previousSong,
    setShuffle,
    setPlaybackMode,
    removeFromPlaylist,
    reorderPlaylist,
    playPlaylist,
    stopAndClear,
  } = useAudio();

  const [shouldShowPlayer, setShouldShowPlayer] = useState(false); // ← CAMBIADO
  const [showQueue, setShowQueue] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 🎯 EFECTO 1: Controlar cuándo mostrar el player
  useEffect(() => {
    const show = isAuthenticated && !!currentSong;
    setShouldShowPlayer(show);
    
    // Si no está autenticado, forzar cerrar modales
    if (!isAuthenticated) {
      setShowQueue(false);
      setIsExpanded(false);
    }
  }, [isAuthenticated, currentSong]);

  // 🎯 EFECTO 2: Limpiar cuando se cierra sesión
  useEffect(() => {
    if (!isAuthenticated && currentSong) {
      console.log('👋 Sesión cerrada, limpiando player...');
      // Forzar cierre de modales
      setShowQueue(false);
      setIsExpanded(false);
    }
  }, [isAuthenticated, currentSong]);

  // 🎯 No mostrar nada si no debería mostrarse
  if (!shouldShowPlayer) {
    return null;
  }

  // Solo mostrar si está autenticado y hay canción
  if (!isAuthenticated || !currentSong) {
    return null;
  }

  const getArtistName = (song: Song): string => {
    return song.artista_cancion || 'Artista desconocido';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlaybackModeIcon = () => {
    switch (playbackMode) {
      case 'ordered': return <RefreshCw size={16} color="#9CA3AF" />;
      case 'loop-all': return <RefreshCw size={16} color="#10B981" />;
      case 'loop-one': return <RefreshCw size={16} color="#3B82F6" />;
      default: return <RefreshCw size={16} color="#9CA3AF" />;
    }
  };

  // Función para mover canción hacia arriba
  const moveSongUp = (index: number) => {
    if (index > 0) {
      reorderPlaylist(index, index - 1);
    }
  };

  // Función para mover canción hacia abajo
  const moveSongDown = (index: number) => {
    if (index < playlist.length - 1) {
      reorderPlaylist(index, index + 1);
    }
  };

  

  return (
    <>
      {/* ========== PLAYER MÍNIMO (SIEMPRE VISIBLE) ========== */}
      <View style={styles.miniPlayer}>
        <Image
          source={getLocalAlbumImage(currentSong.id_album)}
          style={styles.miniAlbumArt}
          resizeMode="cover"
        />
        
        <View style={styles.miniInfo}>
          <Text style={styles.miniSongTitle} numberOfLines={1}>
            {currentSong.nombre_cancion}
          </Text>
          <Text style={styles.miniSongArtist} numberOfLines={1}>
            {getArtistName(currentSong)}
          </Text>
        </View>
        
        <View style={styles.miniControls}>
          <TouchableOpacity
            onPress={togglePlayPause}
            style={styles.miniPlayButton}
            activeOpacity={0.8}
          >
            {isPlaying ? (
              <Pause size={18} color="#FFFFFF" />
            ) : (
              <Play size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setIsExpanded(true)}
            style={styles.expandMiniButton}
            activeOpacity={0.7}
          >
            <ChevronDown size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ========== MODAL EXPANDIDO (SE ABRE AL TOCAR) ========== */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsExpanded(false)}
      >
        <View style={styles.expandedModalOverlay}>
          <View style={styles.expandedModal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setIsExpanded(false)}
                style={styles.closeModalButton}
                activeOpacity={0.7}
              >
                <ChevronDown size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Reproduciendo</Text>
              <TouchableOpacity
                onPress={() => setShowQueue(true)}
                style={styles.queueModalButton}
                activeOpacity={0.7}
              >
                <ListMusic size={20} color="#9CA3AF" />
                {playlist.length > 0 && (
                  <View style={styles.queueModalBadge}>
                    <Text style={styles.queueModalBadgeText}>{playlist.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Album Art */}
            <View style={styles.expandedAlbumArtContainer}>
              <Image
                source={getLocalAlbumImage(currentSong.id_album)}
                style={styles.expandedAlbumArt}
                resizeMode="cover"
              />
            </View>

            {/* Song Info */}
            <View style={styles.expandedSongInfo}>
              <Text style={styles.expandedSongTitle}>
                {currentSong.nombre_cancion}
              </Text>
              <Text style={styles.expandedSongArtist}>
                {getArtistName(currentSong)}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.expandedProgressContainer}>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${(currentTime / (duration || 1)) * 100}%` }
                  ]} 
                />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.expandedControls}>
              <TouchableOpacity
                onPress={() => {
                  const modes: PlaybackMode[] = ['ordered', 'loop-all', 'loop-one'];
                  const currentModeIndex = modes.indexOf(playbackMode);
                  const nextMode = modes[(currentModeIndex + 1) % modes.length];
                  setPlaybackMode(nextMode);
                }}
                style={styles.modeButton}
                activeOpacity={0.7}
              >
                {getPlaybackModeIcon()}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={previousSong}
                style={styles.navButton}
                activeOpacity={0.7}
              >
                <SkipBack size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.mainPlayButton}
                activeOpacity={0.8}
              >
                {isPlaying ? (
                  <Pause size={28} color="#FFFFFF" />
                ) : (
                  <Play size={28} color="#FFFFFF" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={nextSong}
                style={styles.navButton}
                activeOpacity={0.7}
              >
                <SkipForward size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShuffle(!isShuffling)}
                style={[styles.shuffleButton, isShuffling && styles.activeShuffle]}
                activeOpacity={0.7}
              >
                <Shuffle size={18} color={isShuffling ? "#3B82F6" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== MODAL DE COLA DE REPRODUCCIÓN ========== */}
      <Modal
        visible={showQueue}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQueue(false)}
      >
        <View style={styles.queueModalOverlay}>
          <View style={styles.queueModalContent}>
            {/* Header de la cola */}
            <View style={styles.queueHeader}>
              <View>
                <Text style={styles.queueTitle}>Cola de reproducción</Text>
                <Text style={styles.queueSubtitle}>
                  {playlist.length} {playlist.length === 1 ? 'canción' : 'canciones'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowQueue(false)}
                style={styles.closeQueueButton}
                activeOpacity={0.7}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Instrucciones */}
            <View style={styles.queueInstructions}>
              <Text style={styles.instructionsText}>
                Usa los botones ↑↓ para reordenar las canciones
              </Text>
            </View>

            {/* Lista de canciones CON BOTONES DE REORDENAR */}
            <ScrollView 
              style={styles.queueList}
              showsVerticalScrollIndicator={false}
            >
              {playlist.map((song, index) => (
                <View 
                  key={`${song.id_cancion}-${index}`}
                  style={[
                    styles.queueItemContainer,
                    song.id_cancion === currentSong.id_cancion && styles.activeQueueItemContainer,
                  ]}
                >
                  {/* Controles de reordenar */}
                  <View style={styles.reorderControls}>
                    <TouchableOpacity
                      onPress={() => moveSongUp(index)}
                      disabled={index === 0}
                      style={[
                        styles.reorderButton,
                        index === 0 && styles.disabledReorderButton,
                      ]}
                      activeOpacity={0.7}
                    >
                      <ArrowUp 
                        size={16} 
                        color={index === 0 ? "#6B7280" : "#FFFFFF"} 
                      />
                    </TouchableOpacity>
                    
                    <View style={styles.gripContainer}>
                      <GripVertical size={16} color="#6B7280" />
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => moveSongDown(index)}
                      disabled={index === playlist.length - 1}
                      style={[
                        styles.reorderButton,
                        index === playlist.length - 1 && styles.disabledReorderButton,
                      ]}
                      activeOpacity={0.7}
                    >
                      <ArrowDown 
                        size={16} 
                        color={index === playlist.length - 1 ? "#6B7280" : "#FFFFFF"} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Ícono de orden */}
                  <View style={styles.queueNumber}>
                    <Text style={styles.queueNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* Información de la canción */}
                  <TouchableOpacity
                    style={styles.queueItem}
                    onPress={() => {
                      playPlaylist(playlist, index);
                      setShowQueue(false);
                      setIsExpanded(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={getLocalAlbumImage(song.id_album)}
                      style={styles.queueAlbumArt}
                      resizeMode="cover"
                    />
                    
                    <View style={styles.queueItemInfo}>
                      <Text 
                        style={[
                          styles.queueItemTitle,
                          song.id_cancion === currentSong.id_cancion && styles.activeQueueItemTitle,
                        ]}
                        numberOfLines={1}
                      >
                        {song.nombre_cancion}
                      </Text>
                      <Text style={styles.queueItemArtist} numberOfLines={1}>
                        {getArtistName(song)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Indicador de reproducción actual */}
                  {song.id_cancion === currentSong.id_cancion && (
                    <View style={styles.nowPlayingIndicator}>
                      <Music size={18} color="#3B82F6" />
                    </View>
                  )}

                  {/* Botón para eliminar */}
                  <TouchableOpacity
                    onPress={() => removeFromPlaylist(index)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};


const styles = StyleSheet.create({
 

  queueModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
  },
  queueModalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  queueTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  queueSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  closeQueueButton: {
    padding: 8,
  },
  queueInstructions: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  instructionsText: {
    color: '#93C5FD',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  queueList: {
    padding: 16,
  },
  queueItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeQueueItemContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  reorderControls: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 12,
    gap: 8,
  },
  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  disabledReorderButton: {
    opacity: 0.3,
  },
  gripContainer: {
    padding: 4,
  },
  queueNumber: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  queueNumberText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  queueItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  activeQueueItemTitle: {
    color: '#3B82F6',
  },
  queueItemArtist: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  nowPlayingIndicator: {
    marginHorizontal: 12,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  miniAlbumArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  miniInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  miniSongTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  miniSongArtist: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  miniControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandMiniButton: {
    padding: 6,
  },

  // Modal Expandido
  expandedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  expandedModal: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    minHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  closeModalButton: {
    padding: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  queueModalButton: {
    padding: 8,
    position: 'relative',
  },
  queueModalBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueModalBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  expandedAlbumArtContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  expandedAlbumArt: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 16,
  },
  expandedSongInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  expandedSongTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  expandedSongArtist: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
  },
  expandedProgressContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  expandedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  modeButton: {
    padding: 10,
  },
  navButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  mainPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  shuffleButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  activeShuffle: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
});