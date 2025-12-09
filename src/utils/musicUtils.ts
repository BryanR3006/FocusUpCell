// utils/mobileMusicUtils.ts
/**
 * Maps album ID to corresponding image path for React Native
 * @param albumId - The ID of the album
 * @returns The image source object for React Native
 */
export const getLocalAlbumImage = (albumId: number): any => {
  switch (albumId) {
    case 1:
      return require('../../assets/img/Album_Lofi.png');
    case 2:
      return require('../../assets/img/Album_Naturaleza.png');
    case 3:
      return require('../../assets/img/Album_Instrumental.png');
    default:
      return require('../../assets/img/Album_Lofi.png');
  }
};

/**
 * Gets album image URL for remote images
 * @param albumId - The ID of the album
 * @returns The image URL
 */
export const getAlbumImageUrl = (albumId: number): string => {
  // Si tus imágenes están en un servidor
  const baseUrl = 'https://tu-dominio.com/img';
  
  switch (albumId) {
    case 1:
      return `${baseUrl}/Album_Lofi.png`;
    case 2:
      return `${baseUrl}/Album_Naturaleza.png`;
    case 3:
      return `${baseUrl}/Album_Instrumental.png`;
    default:
      return `${baseUrl}/fondo-album.png`;
  }
};

/**
 * Formats duration in seconds to mm:ss format
 * @param duration - Duration in seconds
 * @returns Formatted duration string
 */
export const formatDuration = (duration: number): string => {
  if (!duration || duration < 0) return '0:00';

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Para mantener compatibilidad con tu código existente
export const getAlbumImage = (albumId: any): string => {
  // Esta función ahora devuelve una URL para usar con Image en React Native
  const id = typeof albumId === 'string' ? parseInt(albumId, 10) : albumId;
  return getAlbumImageUrl(id);
};