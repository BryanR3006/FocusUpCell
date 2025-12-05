import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  Music, 
  Clock,
  Headphones,
  AlertCircle 
} from 'lucide-react-native';
import { getAlbumById, getSongsByAlbumId } from '../utils/musicApi';
import { getLocalAlbumImage, formatDuration } from '../utils/musicUtils';
import type { Album, Song } from '../types/api';

const { width } = Dimensions.get('window');

export const AlbumDetail: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Asegúrate de que los parámetros existan
  const params = route.params as { albumId?: number; albumName?: string };
  const albumId = params?.albumId;
  const albumName = params?.albumName;

  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPlaying, setCurrentPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (albumId) {
      fetchAlbumData();
    } else {
      setError('ID de álbum no proporcionado');
      setLoading(false);
    }
  }, [albumId]);

  const fetchAlbumData = async () => {
    if (!albumId) return;

    try {
      setLoading(true);
      setError('');

      const [albumData, songsData] = await Promise.all([
        getAlbumById(albumId),
        getSongsByAlbumId(albumId)
      ]);

      if (!albumData) {
        throw new Error('Álbum no encontrado');
      }

      setAlbum(albumData);
      setSongs(songsData);
    } catch (err: any) {
      console.error('Error fetching album:', err);
      setError(err?.message || 'Error al cargar el álbum');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (songId: number) => {
    if (currentPlaying === songId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentPlaying(songId);
      setIsPlaying(true);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando álbum...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !album) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.errorContainer}>
          <AlertCircle size={60} color="#EF4444" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>
            {error || 'No se pudo cargar el álbum'}
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBack}
          >
            <ChevronLeft size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button - REVISADO */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <ChevronLeft size={24} color="#F4EFFA" />
            <Text style={styles.backButtonText}></Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {albumName || album.nombre_album || 'Detalles del Álbum'}
          </Text>
          
          {/* Espaciador para alineación */}
          <View style={styles.headerSpacer} />
        </View>

        {/* Album Cover */}
        <View style={styles.albumCoverContainer}>
          <Image
            source={getLocalAlbumImage(album.id_album)}
            style={styles.albumCover}
            resizeMode="cover"
          />
        </View>

        {/* Album Info */}
        <View style={styles.albumInfo}>
          <Text style={styles.albumTitle}>{album.nombre_album}</Text>
          
          <View style={styles.genreContainer}>
            <View style={styles.genreBadge}>
              <Music size={14} color="#93C5FD" />
              <Text style={styles.genreText}>{album.genero}</Text>
            </View>
            <Text style={styles.songCount}>
              {songs.length} {songs.length === 1 ? 'canción' : 'canciones'}
            </Text>
          </View>

          <Text style={styles.albumDescription}>
            {album.descripcion}
          </Text>
        </View>

        {/* Songs List */}
        <View style={styles.songsSection}>
          <View style={styles.sectionHeader}>
            <Headphones size={20} color="#F4EFFA" />
            <Text style={styles.sectionTitle}>Canciones</Text>
          </View>

          {songs.length === 0 ? (
            <View style={styles.emptySongs}>
              <Text style={styles.emptySongsText}>
                No hay canciones en este álbum
              </Text>
            </View>
          ) : (
            songs.map((song, index) => (
              <TouchableOpacity
                key={song.id_cancion}
                style={[
                  styles.songItem,
                  currentPlaying === song.id_cancion && styles.activeSongItem
                ]}
                onPress={() => handlePlaySong(song.id_cancion)}
                activeOpacity={0.7}
              >
                <View style={styles.songNumber}>
                  {currentPlaying === song.id_cancion ? (
                    <Music size={16} color="#3B82F6" />
                  ) : (
                    <Text style={styles.songNumberText}>{index + 1}</Text>
                  )}
                </View>

                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.nombre_cancion || 'Canción sin nombre'}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {song.artista_cancion || 'Artista desconocido'}
                  </Text>
                </View>

                <View style={styles.songActions}>
                  {song.duracion ? (
                    <View style={styles.durationContainer}>
                      <Clock size={14} color="#94A3B8" />
                      <Text style={styles.durationText}>
                        {formatDuration(song.duracion)}
                      </Text>
                    </View>
                  ) : null}
                  
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => handlePlaySong(song.id_cancion)}
                  >
                    {currentPlaying === song.id_cancion && isPlaying ? (
                      <Pause size={20} color="#3B82F6" />
                    ) : (
                      <Play size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#171717',
  },
  container: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#F4EFFA',
    fontSize: 18,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#F4EFFA',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    color: '#F4EFFA',
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    color: '#F4EFFA',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 70, // Ancho aproximado del botón "Atrás"
  },
  albumCoverContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  albumCover: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 16,
    backgroundColor: '#2D2D2D',
  },
  albumInfo: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  albumTitle: {
    color: '#F4EFFA',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  genreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  genreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  genreText: {
    color: '#93C5FD',
    fontSize: 14,
    fontWeight: '500',
  },
  songCount: {
    color: '#94A3B8',
    fontSize: 14,
  },
  albumDescription: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  songsSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: '#F4EFFA',
    fontSize: 20,
    fontWeight: '600',
  },
  emptySongs: {
    alignItems: 'center',
    padding: 40,
  },
  emptySongsText: {
    color: '#6B7280',
    fontSize: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  activeSongItem: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  songNumber: {
    width: 32,
    alignItems: 'center',
  },
  songNumberText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    color: '#F4EFFA',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  songArtist: {
    color: '#94A3B8',
    fontSize: 14,
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  playButton: {
    padding: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});