import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AlbumData {
  id_album: number;
  nombre_album: string;
  descripcion: string;
  image: string;
}

interface AlbumSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (album: AlbumData) => void;
  selectedAlbum?: AlbumData | null;
}

const { width } = Dimensions.get('window');

const getAvailableAlbums = (): AlbumData[] => {
  return [
    {
      id_album: 1,
      nombre_album: 'Lofi',
      descripcion: 'Beats suaves y melódicos para mantener el foco',
      image: 'https://via.placeholder.com/300/8b5cf6/ffffff?text=Lofi'
    },
    {
      id_album: 2,
      nombre_album: 'Naturaleza',
      descripcion: 'Sonidos de la naturaleza para un ambiente tranquilo',
      image: 'https://via.placeholder.com/300/10b981/ffffff?text=Naturaleza'
    },
    {
      id_album: 3,
      nombre_album: 'Instrumental',
      descripcion: 'Música instrumental relajante para concentración profunda',
      image: 'https://via.placeholder.com/300/3b82f6/ffffff?text=Instrumental'
    }
  ];
};

export const AlbumSelectionModal: React.FC<AlbumSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedAlbum
}) => {
  const [albums] = useState<AlbumData[]>(getAvailableAlbums());
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    if (isOpen) {
      const currentIndex = selectedAlbum
        ? albums.findIndex(a => a.id_album === selectedAlbum.id_album)
        : -1;
      setSelectedIndex(currentIndex);
    }
  }, [isOpen, selectedAlbum, albums]);

  useEffect(() => {
    if (!isOpen || Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < albums.length) {
            onSelect(albums[selectedIndex]);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(albums.length - 1, prev + 1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, albums, onClose, onSelect]);

  const handleSelect = (album: AlbumData) => {
    onSelect(album);
    onClose();
  };

  const renderAlbumItem = ({ item, index }: { item: AlbumData; index: number }) => {
    const isSelected = selectedAlbum?.id_album === item.id_album;
    const isFocused = selectedIndex === index;

    return (
      <TouchableOpacity
        style={[
          styles.albumCard,
          isSelected && styles.albumCardSelected,
          isFocused && styles.albumCardFocused,
        ]}
        onPress={() => handleSelect(item)}
        onPressIn={() => setSelectedIndex(index)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`Seleccionar álbum ${item.nombre_album}. ${item.descripcion}`}
      >
        {/* Portada del álbum */}
        <View style={styles.albumImageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.albumImage}
            resizeMode="cover"
          />
          
          {/* Overlay de selección */}
          <View style={[
            styles.selectionOverlay,
            isSelected ? styles.selectionOverlayActive : styles.selectionOverlayInactive,
          ]}>
            <View style={styles.selectionIcon}>
              {isSelected ? (
                <Icon name="check" size={32} color="#ffffff" />
              ) : (
                <Icon name="music-note" size={32} color="#ffffff" />
              )}
            </View>
          </View>

          {/* Indicador de selección en esquina */}
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Icon name="check" size={16} color="#ffffff" />
            </View>
          )}
        </View>

        {/* Información del álbum */}
        <View style={styles.albumInfo}>
          <Text style={styles.albumName} numberOfLines={1}>
            {item.nombre_album}
          </Text>
          <Text style={styles.albumDescription} numberOfLines={2}>
            {item.descripcion}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                Seleccionar Álbum de Música
              </Text>
              <Text style={styles.headerSubtitle}>
                Elige el álbum que te ayudará a mantener la concentración
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Contenido - Grid de álbumes */}
          <ScrollView style={styles.content}>
            <FlatList
              data={albums}
              renderItem={renderAlbumItem}
              keyExtractor={(item) => item.id_album.toString()}
              numColumns={width < 768 ? 1 : width < 1024 ? 2 : 3}
              columnWrapperStyle={width >= 768 && styles.columnWrapper}
              contentContainerStyle={styles.albumsGrid}
              scrollEnabled={false}
            />
          </ScrollView>

          {/* Footer con acciones */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <Text style={styles.keyboardInstructions}>
                Usa las flechas para navegar, Enter para seleccionar, Escape para cerrar
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#232323',
    borderRadius: 20,
    maxWidth: 800,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  albumsGrid: {
    padding: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  albumCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 20,
    flex: 1,
    marginHorizontal: width >= 768 ? 8 : 0,
    maxWidth: width >= 768 ? (width >= 1024 ? 240 : 180) : '100%',
  },
  albumCardSelected: {
    borderColor: '#a78bfa',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  albumCardFocused: {
    borderColor: '#a78bfa',
    borderWidth: 2,
  },
  albumImageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionOverlayActive: {
    backgroundColor: 'rgba(167, 139, 250, 0.8)',
  },
  selectionOverlayInactive: {
    backgroundColor: 'transparent',
  },
  selectionIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    padding: 12,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumInfo: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  albumDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  keyboardInstructions: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});