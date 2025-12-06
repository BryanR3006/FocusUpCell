import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Music, AlertCircle, ChevronRight, RefreshCw, Search, Menu } from 'lucide-react-native';
import Sidebar from '../ui/Sidebar'; // Importa tu Sidebar
import { getAlbums } from '../utils/musicApi';
import { getLocalAlbumImage } from '../utils/musicUtils';
import type { Album } from '../types/api';
import type { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export const MusicAlbums: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [sidebarVisible, setSidebarVisible] = useState(false); // Estado para el Sidebar
  
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAlbums();
      setAlbums(data);
    } catch (err: any) {
      console.error('Error fetching albums:', err);
      const errorMessage = err?.message || 'Error al cargar los álbumes';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlbums();
  };

  const handleAlbumClick = (album: Album) => {
    navigation.navigate('MusicSongs', {
      albumId: album.id_album,
      albumName: album.nombre_album
    });
  };

  const filteredAlbums = albums.filter(album =>
    album.nombre_album.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.genero.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <Sidebar 
          visible={sidebarVisible} 
          onClose={() => setSidebarVisible(false)} 
          currentPage="music"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando álbumes...</Text>
          <Text style={styles.loadingSubtext}>Preparando tu colección musical</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Sidebar */}
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        currentPage="music"
      />
      
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header con botón de menú */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <Menu size={24} color="#F4EFFA" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Álbumes de Música</Text>
            <Text style={styles.subtitle}>
              Explora nuestra colección curada de álbumes
            </Text>
          </View>
          
          {/* Espaciador para mantener la alineación */}
          <View style={styles.headerRightSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputGroup}>
            <Search size={20} color="#94A3B8" />
            <TextInput
              placeholder="Buscar álbumes..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Error State */}
        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={60} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Error al cargar datos</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchAlbums}
            >
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAlbums.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Music size={48} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No se encontraron resultados' : 'No hay álbumes disponibles'}
            </Text>
            <Text style={styles.emptyMessage}>
              {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Estamos trabajando para traerte nueva música'}
            </Text>
          </View>
        ) : (
          <>
            {/* Results count */}
            {searchQuery.length > 0 && (
              <View style={styles.resultsInfo}>
                <Text style={styles.resultsText}>
                  {filteredAlbums.length} {filteredAlbums.length === 1 ? 'resultado' : 'resultados'} encontrados
                </Text>
              </View>
            )}

            {/* Albums Grid */}
            <View style={styles.albumsGrid}>
              {filteredAlbums.map((album) => (
                <TouchableOpacity
                  key={album.id_album}
                  style={styles.albumCard}
                  onPress={() => handleAlbumClick(album)}
                  activeOpacity={0.7}
                >
                  {/* Album Image */}
                  <Image
                    source={getLocalAlbumImage(album.id_album)}
                    style={styles.albumImage}
                    resizeMode="cover"
                    defaultSource={require('../../assets/img/fondo-album.png')}
                  />
                  
                  {/* Album Info */}
                  <View style={styles.cardContent}>
                    <Text style={styles.albumName} numberOfLines={2}>
                      {album.nombre_album}
                    </Text>
                    
                    <View style={styles.genreBadge}>
                      <Text style={styles.genreText}>{album.genero}</Text>
                    </View>

                    <Text style={styles.albumDescription} numberOfLines={2}>
                      {album.descripcion}
                    </Text>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleAlbumClick(album)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionButtonText}>Ver canciones</Text>
                      <ChevronRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
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
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#94A3B8',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    marginBottom: 16,
  },
  menuButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRightSpacer: {
    width: 40, // Mismo ancho que el botón de menú para mantener simetría
  },
  title: {
    color: '#F4EFFA',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  searchInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  searchInput: {
    flex: 1,
    color: '#F4EFFA',
    paddingVertical: 14,
    fontSize: 16,
    marginLeft: 8,
  },
  clearSearch: {
    color: '#94A3B8',
    fontSize: 18,
    paddingHorizontal: 8,
  },
  resultsInfo: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  resultsText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    color: '#F4EFFA',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#D1D5DB',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  albumsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  albumCard: {
    width: CARD_WIDTH,
    backgroundColor: '#2D2D2D',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  albumImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#3D3D3D', // Color de fondo mientras carga
  },
  cardContent: {
    padding: 12,
  },
  albumName: {
    color: '#F4EFFA',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    minHeight: 40,
  },
  genreBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Color azul como en tu login
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  genreText: {
    color: '#93C5FD', // Azul más claro
    fontSize: 12,
    fontWeight: '500',
  },
  albumDescription: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
    minHeight: 36,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6', // Mismo azul que tu botón de login
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});