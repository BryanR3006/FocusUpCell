import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PageLayout from '../../ui/PageLayout';
import { CountdownOverlay } from '../../ui/CountdownOverlay';
import { MethodSelectionModal } from '../../components/MethodSelectionModal';
import { AlbumSelectionModal } from '../../components/AlbumSelectionModal';

// Define tipos
interface Method {
  id: string;
  nombre_metodo: string;
  descripcion?: string;
  duracion?: number;
}

interface Album {
  id: string;
  nombre_album: string;
  artista?: string;
  duracion_total?: number;
}

interface SessionConfig {
  title: string;
  description: string;
  method: Method | null;
  album: Album | null;
  startTime: string;
  duration?: number;
}

export const StartSession: React.FC = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [descriptionExpanded, setDescriptionExpanded] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState<boolean>(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState<boolean>(false);
  const [sessionDuration, setSessionDuration] = useState<number>(25); // 25 minutos por defecto

  // Cargar selecciones guardadas
  useEffect(() => {
    const loadSelections = async () => {
      try {
        const [savedMethod, savedAlbum, savedTitle, savedDesc] = await Promise.all([
          AsyncStorage.getItem('selectedMethod'),
          AsyncStorage.getItem('selectedAlbum'),
          AsyncStorage.getItem('sessionTitle'),
          AsyncStorage.getItem('sessionDescription'),
        ]);
        
        if (savedMethod) setSelectedMethod(JSON.parse(savedMethod));
        if (savedAlbum) setSelectedAlbum(JSON.parse(savedAlbum));
        if (savedTitle) setTitle(savedTitle);
        if (savedDesc) setDescription(savedDesc);
      } catch (error) {
        console.error('Error cargando selecciones:', error);
      }
    };
    
    loadSelections();
  }, []);

  // Guardar título y descripción cuando cambien
  useEffect(() => {
    const saveSessionData = async () => {
      try {
        await AsyncStorage.setItem('sessionTitle', title);
        await AsyncStorage.setItem('sessionDescription', description);
      } catch (error) {
        console.error('Error guardando datos de sesión:', error);
      }
    };
    
    const timeoutId = setTimeout(saveSessionData, 500);
    return () => clearTimeout(timeoutId);
  }, [title, description]);

  const handleSubmit = async () => {
    // Validaciones
    if (!title.trim()) {
      setTitle('Sesión de concentración');
    }

    if (selectedMethod?.duracion) {
      setSessionDuration(selectedMethod.duracion);
    }

    try {
      setIsLoading(true);
      
      // Preparar configuración de sesión
      const sessionConfig: SessionConfig = {
        title: title || 'Sesión de concentración',
        description,
        method: selectedMethod,
        album: selectedAlbum,
        startTime: new Date().toISOString(),
        duration: sessionDuration,
      };

      // Guardar configuración
      await AsyncStorage.setItem('currentSession', JSON.stringify(sessionConfig));
      
      // Iniciar cuenta regresiva
      setShowCountdown(true);
      
    } catch (error) {
      console.error('Error iniciando sesión:', error);
      Alert.alert('Error', 'No se pudo iniciar la sesión. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  const handleCountdownComplete = async () => {
    try {
      // Obtener configuración actual
      const sessionConfigStr = await AsyncStorage.getItem('currentSession');
      if (!sessionConfigStr) {
        throw new Error('No se encontró configuración de sesión');
      }

      const sessionConfig: SessionConfig = JSON.parse(sessionConfigStr);
      
      // Marcar sesión como activa
      await AsyncStorage.setItem('sessionActive', 'true');
      
      // Guardar en historial
      const historyStr = await AsyncStorage.getItem('sessionHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.unshift({
        ...sessionConfig,
        endTime: new Date().toISOString(),
        completed: false,
      });
      await AsyncStorage.setItem('sessionHistory', JSON.stringify(history.slice(0, 50))); // Limitar a 50 sesiones
      
      // Navegar al dashboard
      Alert.alert(
        '¡Sesión Iniciada!',
        'Tu sesión de concentración ha comenzado. ¡Enfócate y sé productivo!',
        [{ text: 'Continuar', onPress: () => navigation.navigate('sesis') }]
      );
      
    } catch (error) {
      console.error('Error después de cuenta regresiva:', error);
      Alert.alert('Error', 'No se pudo completar el inicio de sesión');
    } finally {
      setIsLoading(false);
      setShowCountdown(false);
    }
  };

  const handleCountdownCancel = () => {
    Alert.alert(
      'Cancelar Sesión',
      '¿Estás seguro de que quieres cancelar el inicio de la sesión?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, cancelar', 
          style: 'destructive',
          onPress: () => {
            setShowCountdown(false);
            setIsLoading(false);
            AsyncStorage.removeItem('currentSession').catch(console.error);
          }
        }
      ]
    );
  };

  const handleMethodSelect = async (method: Method) => {
    try {
      await AsyncStorage.setItem('selectedMethod', JSON.stringify(method));
      setSelectedMethod(method);
      setIsMethodModalOpen(false);
      
      // Si el método tiene duración específica, actualizar
      if (method.duracion) {
        setSessionDuration(method.duracion);
      }
    } catch (error) {
      console.error('Error guardando método:', error);
      Alert.alert('Error', 'No se pudo guardar la selección del método');
    }
  };

  const handleAlbumSelect = async (album: Album) => {
    try {
      await AsyncStorage.setItem('selectedAlbum', JSON.stringify(album));
      setSelectedAlbum(album);
      setIsAlbumModalOpen(false);
    } catch (error) {
      console.error('Error guardando álbum:', error);
      Alert.alert('Error', 'No se pudo guardar la selección del álbum');
    }
  };

  const removeMethod = async () => {
    try {
      await AsyncStorage.removeItem('selectedMethod');
      setSelectedMethod(null);
      setSessionDuration(25); // Restaurar duración por defecto
    } catch (error) {
      console.error('Error eliminando método:', error);
    }
  };

  const removeAlbum = async () => {
    try {
      await AsyncStorage.removeItem('selectedAlbum');
      setSelectedAlbum(null);
    } catch (error) {
      console.error('Error eliminando álbum:', error);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const clearAllSelections = () => {
    Alert.alert(
      'Limpiar Todo',
      '¿Estás seguro de que quieres limpiar todas las selecciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpiar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem('selectedMethod'),
                AsyncStorage.removeItem('selectedAlbum'),
                AsyncStorage.removeItem('sessionTitle'),
                AsyncStorage.removeItem('sessionDescription'),
              ]);
              setSelectedMethod(null);
              setSelectedAlbum(null);
              setTitle('');
              setDescription('');
              setSessionDuration(25);
            } catch (error) {
              console.error('Error limpiando selecciones:', error);
            }
          }
        }
      ]
    );
  };

  const features = [
    {
      number: '1',
      title: 'Configuración Personalizada',
      description: 'Configura tu sesión con título, método de estudio y música opcionales según tus necesidades',
      color: '#3b82f6'
    },
    {
      number: '2',
      title: 'Ejecución Automática',
      description: 'La sesión se minimiza automáticamente si seleccionas un método, permitiendo enfoque total',
      color: '#06b6d4'
    },
    {
      number: '3',
      title: 'Audio Continuo',
      description: 'La música continúa reproduciendo sin interrupciones durante toda tu sesión',
      color: '#8b5cf6'
    },
    {
      number: '4',
      title: 'Persistencia Automática',
      description: 'Tu sesión se guarda automáticamente y puede reanudarse en cualquier momento',
      color: '#ec4899'
    },
  ];

  const isMobile = width < 768;

  return (
    <PageLayout title="Sesiones de Concentración" showBackButton={true}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              Configura tu sesión de concentración
            </Text>
            <Text style={styles.heroSubtitle}>
              Personaliza tu experiencia con las herramientas perfectas para maximizar tu productividad
            </Text>
            
            <View style={styles.badgesContainer}>
              <View style={styles.badge}>
                <View style={[styles.badgeDot, styles.badgeDotBlue]} />
                <Text style={styles.badgeText}>Temporizador Inteligente</Text>
              </View>
              <View style={styles.badge}>
                <View style={[styles.badgeDot, styles.badgeDotCyan]} />
                <Text style={styles.badgeText}>Métodos de Estudio</Text>
              </View>
              <View style={styles.badge}>
                <View style={[styles.badgeDot, styles.badgeDotIndigo]} />
                <Text style={styles.badgeText}>Música Ambiental</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearAllSelections}
            >
              <Icon name="delete-sweep" size={20} color="#ef4444" />
              <Text style={styles.clearButtonText}>Limpiar todo</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.content, { flexDirection: isMobile ? 'column' : 'row' }]}>
            {/* Columna izquierda: Formulario */}
            <View style={[styles.leftColumn, { flex: isMobile ? 1 : 2 }]}>
              <View style={styles.formContainer}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Configurar Sesión</Text>
                  <Text style={styles.formSubtitle}>Personaliza tu experiencia de concentración</Text>
                </View>

                <View style={styles.form}>
                  {/* Título */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Título de la sesión
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Sesión de concentración #1"
                      placeholderTextColor="#6b7280"
                      maxLength={50}
                    />
                    <Text style={styles.charCount}>
                      {title.length}/50 caracteres
                    </Text>
                  </View>

                  {/* Descripción expandable */}
                  <View style={styles.inputGroup}>
                    <TouchableOpacity
                      onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                      style={styles.descriptionToggle}
                      activeOpacity={0.7}
                    >
                      <Icon 
                        name={descriptionExpanded ? 'expand-less' : 'expand-more'} 
                        size={20} 
                        color="#9ca3af" 
                      />
                      <Text style={styles.descriptionToggleText}>
                        Descripción avanzada {descriptionExpanded ? '(Opcional)' : ''}
                      </Text>
                    </TouchableOpacity>

                    {descriptionExpanded && (
                      <>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={description}
                          onChangeText={setDescription}
                          placeholder="Describe el propósito de esta sesión, tus objetivos, o cualquier nota importante..."
                          placeholderTextColor="#6b7280"
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          maxLength={200}
                        />
                        <Text style={styles.charCount}>
                          {description.length}/200 caracteres
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Configuración de la sesión */}
                  <View style={styles.configSection}>
                    <Text style={styles.configTitle}>Configuración de la sesión</Text>
                    <Text style={styles.configSubtitle}>
                      Elige las herramientas que potenciarán tu concentración
                    </Text>

                    {/* Botón de selección de método */}
                    <TouchableOpacity
                      style={styles.selectionButton}
                      onPress={() => setIsMethodModalOpen(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.selectionButtonContent}>
                        <View style={[styles.selectionIcon, styles.methodIcon]}>
                          <Icon name="menu-book" size={24} color="#ffffff" />
                        </View>
                        <View style={styles.selectionText}>
                          <Text style={styles.selectionTitle}>
                            {selectedMethod ? selectedMethod.nombre_metodo : 'Seleccionar método'}
                          </Text>
                          <Text style={styles.selectionSubtitle}>
                            {selectedMethod 
                              ? `Método de estudio seleccionado • ${formatDuration(selectedMethod.duracion || 25)}`
                              : 'Método de estudio (opcional)'
                            }
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#9ca3af" />
                      </View>
                    </TouchableOpacity>

                    {/* Botón de selección de álbum */}
                    <TouchableOpacity
                      style={[styles.selectionButton, styles.albumButton]}
                      onPress={() => setIsAlbumModalOpen(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.selectionButtonContent}>
                        <View style={[styles.selectionIcon, styles.albumIcon]}>
                          <Icon name="music-note" size={24} color="#ffffff" />
                        </View>
                        <View style={styles.selectionText}>
                          <Text style={styles.selectionTitle}>
                            {selectedAlbum ? selectedAlbum.nombre_album : 'Seleccionar álbum'}
                          </Text>
                          <Text style={styles.selectionSubtitle}>
                            {selectedAlbum 
                              ? `Álbum de música seleccionado${selectedAlbum.artista ? ` • ${selectedAlbum.artista}` : ''}`
                              : 'Música de fondo (opcional)'
                            }
                          </Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#9ca3af" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Duración de sesión */}
                  <View style={styles.durationContainer}>
                    <Text style={styles.durationLabel}>
                      Duración estimada de la sesión:
                    </Text>
                    <View style={styles.durationBadge}>
                      <Icon name="timer" size={16} color="#3b82f6" />
                      <Text style={styles.durationText}>
                        {formatDuration(sessionDuration)}
                      </Text>
                    </View>
                  </View>

                  {/* Chips de selección */}
                  {(selectedMethod || selectedAlbum) && (
                    <View style={styles.chipsContainer}>
                      {selectedMethod && (
                        <View style={styles.chip}>
                          <View style={[styles.chipIcon, styles.methodChipIcon]}>
                            <Icon name="menu-book" size={16} color="#ffffff" />
                          </View>
                          <Text style={styles.chipText}>{selectedMethod.nombre_metodo}</Text>
                          <TouchableOpacity 
                            onPress={removeMethod} 
                            style={styles.chipRemove}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Icon name="close" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                        </View>
                      )}

                      {selectedAlbum && (
                        <View style={[styles.chip, styles.albumChip]}>
                          <View style={[styles.chipIcon, styles.albumChipIcon]}>
                            <Icon name="music-note" size={16} color="#ffffff" />
                          </View>
                          <Text style={styles.chipText}>{selectedAlbum.nombre_album}</Text>
                          <TouchableOpacity 
                            onPress={removeAlbum} 
                            style={styles.chipRemove}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Icon name="close" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Botón de envío */}
                  <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.submitButtonContent}>
                      {isLoading ? (
                        <ActivityIndicator color="#ffffff" size={24} />
                      ) : (
                        <>
                          <Icon name="play-arrow" size={24} color="#ffffff" />
                          <Text style={styles.submitButtonText}>
                            Iniciar sesión de concentración
                          </Text>
                        </>
                      )}
                    </View>
                    <Text style={styles.submitButtonSubtext}>
                      {isLoading 
                        ? 'Preparando tu entorno de concentración...' 
                        : `Duración: ${formatDuration(sessionDuration)}`
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Columna derecha: Preview */}
            <View style={[styles.rightColumn, { flex: isMobile ? 1 : 3 }]}>
              <View style={styles.previewContainer}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>Vista Previa</Text>
                  <Text style={styles.previewSubtitle}>Así se verá tu sesión</Text>
                </View>

                <View style={styles.previewContent}>
                  <View style={styles.previewHeaderContent}>
                    <View style={styles.previewIcon}>
                      <Icon name="timer" size={32} color="#ffffff" />
                    </View>
                    <View style={styles.previewText}>
                      <Text style={styles.previewSessionTitle} numberOfLines={1}>
                        {title || 'Sesión de concentración'}
                      </Text>
                      <Text style={styles.previewSessionInfo} numberOfLines={2}>
                        {selectedMethod 
                          ? `Con método: ${selectedMethod.nombre_metodo}` 
                          : 'Sesión rápida'
                        }
                        {selectedAlbum && ` • Música: ${selectedAlbum.nombre_album}`}
                      </Text>
                    </View>
                  </View>

                  {description ? (
                    <View style={styles.previewDescription}>
                      <Text style={styles.previewDescriptionLabel}>Descripción:</Text>
                      <Text style={styles.previewDescriptionText} numberOfLines={3}>
                        {description}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.previewPlaceholder}>
                      <Icon name="info" size={20} color="#6b7280" />
                      <Text style={styles.previewPlaceholderText}>
                        Sin descripción adicional
                      </Text>
                    </View>
                  )}

                  <View style={styles.previewTimer}>
                    <Text style={styles.timerText}>
                      {sessionDuration.toString().padStart(2, '0')}:00
                    </Text>
                    <Text style={styles.timerSubtitle}>
                      El temporizador comenzará cuando inicies la sesión
                    </Text>
                    <View style={styles.timerProgress}>
                      <View style={[styles.timerProgressFill, { width: '0%' }]} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Características */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>¿Cómo Funciona?</Text>
                <Text style={styles.featuresSubtitle}>Descubre las ventajas de nuestras sesiones</Text>

                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={[styles.featureNumber, { backgroundColor: feature.color }]}>
                      <Text style={styles.featureNumberText}>{feature.number}</Text>
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Modales */}
        <MethodSelectionModal
          isOpen={isMethodModalOpen}
          onClose={() => setIsMethodModalOpen(false)}
          onSelect={handleMethodSelect}
          selectedMethod={selectedMethod}
        />

        <AlbumSelectionModal
          isOpen={isAlbumModalOpen}
          onClose={() => setIsAlbumModalOpen(false)}
          onSelect={handleAlbumSelect}
          selectedAlbum={selectedAlbum}
        />

        {/* Overlay de cuenta regresiva */}
        <CountdownOverlay
          isVisible={showCountdown}
          onCountdownComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
          title="Preparándote para la concentración"
          subtitle="Enfoca tu mente y prepárate para una sesión productiva"
          duration={5} // 5 segundos de cuenta regresiva
        />
      </KeyboardAvoidingView>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeDotBlue: {
    backgroundColor: '#3b82f6',
  },
  badgeDotCyan: {
    backgroundColor: '#06b6d4',
  },
  badgeDotIndigo: {
    backgroundColor: '#8b5cf6',
  },
  badgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },
  leftColumn: {},
  rightColumn: {
    gap: 24,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  input: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.5)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  descriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  descriptionToggleText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  configSection: {
    gap: 16,
  },
  configTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  configSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  selectionButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(51, 51, 51, 0.5)',
    borderRadius: 16,
    padding: 20,
    borderStyle: 'dashed',
  },
  albumButton: {
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  selectionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  methodIcon: {
    backgroundColor: '#3b82f6',
  },
  albumIcon: {
    backgroundColor: '#06b6d4',
  },
  selectionText: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  durationLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  durationText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  albumChip: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  chipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  methodChipIcon: {
    backgroundColor: '#3b82f6',
  },
  albumChipIcon: {
    backgroundColor: '#06b6d4',
  },
  chipText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    marginRight: 8,
    maxWidth: 120,
  },
  chipRemove: {
    padding: 2,
  },
  submitButton: {
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  submitButtonDisabled: {
    backgroundColor: '#4b5563',
    shadowColor: '#4b5563',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  submitButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingBottom: 12,
  },
  previewContainer: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  previewContent: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.5)',
  },
  previewHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewText: {
    flex: 1,
  },
  previewSessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  previewSessionInfo: {
    fontSize: 14,
    color: '#9ca3af',
  },
  previewDescription: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.3)',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  previewDescriptionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 6,
  },
  previewDescriptionText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  previewPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.2)',
    borderStyle: 'dashed',
    gap: 10,
  },
  previewPlaceholderText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  previewTimer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 51, 51, 0.3)',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 12,
    letterSpacing: 2,
  },
  timerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(51, 51, 51, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  featuresContainer: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  featuresSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.5)',
  },
  featureNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  featureNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
});

export default StartSession;