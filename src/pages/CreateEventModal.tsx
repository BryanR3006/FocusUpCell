import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import type { IEventoCreate } from '../types/events';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Target, Timer, Brain, TrendingUp, Music, Calendar, Clock, Type, ChevronDown, ChevronUp, X, Sparkles, Headphones, Notebook, CheckCircle, Plus } from 'lucide-react-native';
import { getAlbums } from '../utils/musicApi';
import { getLocalAlbumImage } from '../utils/musicUtils';
import type { Album } from '../types/api';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: IEventoCreate) => Promise<void>;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nombreEvento: '',
    fechaEvento: '',
    horaEvento: '09:00:00',
    descripcionEvento: '',
    tipoEvento: 'concentracion',
    idMetodo: undefined as number | undefined,
    idAlbum: undefined as number | undefined,
  });

  const [isMethodsExpanded, setIsMethodsExpanded] = useState(false);
  const [isAlbumsExpanded, setIsAlbumsExpanded] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  const metodosDisponibles = [
    { 
      id: 1, 
      nombre_metodo: 'Método Pomodoro', 
      descripcion: 'Técnica de gestión de tiempo con intervalos de trabajo y descanso', 
      icono: Timer, 
      color: '#8B5CF6',
    },
    { 
      id: 2, 
      nombre_metodo: 'Mapas Mentales', 
      descripcion: 'Organización visual de ideas y conceptos', 
      icono: Brain, 
      color: '#10B981',
    },
    { 
      id: 3, 
      nombre_metodo: 'Método Feynman', 
      descripcion: 'Explicación de conceptos en términos simples', 
      icono: BookOpen, 
      color: '#06B6D4',
    },
    { 
      id: 4, 
      nombre_metodo: 'Repaso Espaciado', 
      descripcion: 'Técnica de memorización con intervalos crecientes', 
      icono: TrendingUp, 
      color: '#F59E0B',
    },
    { 
      id: 5, 
      nombre_metodo: 'Método Cornell', 
      descripcion: 'Sistema de toma de notas estructurado', 
      icono: Notebook, 
      color: '#3B82F6',
    },
    { 
      id: 6, 
      nombre_metodo: 'Práctica Activa', 
      descripcion: 'Aprendizaje mediante aplicación práctica de conocimientos', 
      icono: Target, 
      color: '#EC4899',
    },
  ];

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      setFormData({
        nombreEvento: '',
        fechaEvento: formattedDate,
        horaEvento: '09:00:00',
        descripcionEvento: '',
        tipoEvento: 'concentracion',
        idMetodo: undefined,
        idAlbum: undefined,
      });
      setIsMethodsExpanded(false);
      setIsAlbumsExpanded(false);
      setErrors({});
      fetchAlbums();
    }
  }, [isOpen]);

  const fetchAlbums = async () => {
    try {
      setLoadingAlbums(true);
      const albumsData = await getAlbums();
      setAlbums(albumsData);
    } catch (error) {
      console.error('Error fetching albums:', error);
      Alert.alert('Error', 'No se pudieron cargar los álbumes');
    } finally {
      setLoadingAlbums(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombreEvento.trim()) {
      newErrors.nombreEvento = 'El nombre del evento es requerido';
    }

    if (!formData.fechaEvento) {
      newErrors.fechaEvento = 'La fecha del evento es requerida';
    } else {
      // Validate date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.fechaEvento)) {
        newErrors.fechaEvento = 'Formato de fecha inválido. Use YYYY-MM-DD';
      } else {
        const [year, month, day] = formData.fechaEvento.split('-').map(Number);
        if (month < 1 || month > 12) {
          newErrors.fechaEvento = 'Mes inválido. Debe ser entre 01-12';
        } else if (day < 1 || day > 31) {
          newErrors.fechaEvento = 'Día inválido. Debe ser entre 01-31';
        } else {
          const eventDateTime = new Date(`${formData.fechaEvento}T${formData.horaEvento}`);
          const now = new Date();

          if (isNaN(eventDateTime.getTime())) {
            newErrors.fechaEvento = 'Fecha u hora inválida';
          } else if (eventDateTime <= now) {
            newErrors.fechaEvento = 'La fecha y hora deben ser futuras';
          }
        }
      }
    }

    if (!formData.horaEvento) {
      newErrors.horaEvento = 'La hora del evento es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const autoCompleteEventFromMethod = (methodId: number) => {
    const metodo = metodosDisponibles.find(m => m.id === methodId);
    if (!metodo) return;

    const eventName = `Sesión de ${metodo.nombre_metodo}`;
    const eventDescription = `Sesión dedicada al método ${metodo.nombre_metodo}. ${metodo.descripcion}`;

    setFormData(prev => ({
      ...prev,
      nombreEvento: eventName,
      descripcionEvento: eventDescription,
      idMetodo: methodId,
      tipoEvento: 'concentracion',
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const eventData: IEventoCreate = {
        nombreEvento: formData.nombreEvento.trim(),
        fechaEvento: formData.fechaEvento,
        horaEvento: formData.horaEvento,
        descripcionEvento: formData.descripcionEvento.trim() || undefined,
        tipoEvento: formData.tipoEvento || undefined,
        idUsuario: user?.id_usuario || 1,
        idMetodo: formData.idMetodo,
        idAlbum: formData.idAlbum,
        estado: 'pending',
      };

      await onSave(eventData);
      Alert.alert('¡Evento creado!', 'Tu evento ha sido guardado correctamente.');
      onClose();

      setTimeout(() => {
        navigation.navigate('Home' as never);
      }, 300);
    } catch (error: any) {
      console.error('Error creando evento:', error);
      
      Alert.alert(
        'Error al crear el evento',
        error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Error desconocido'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatTimeForDisplay = (time: string) => {
    if (!time) return '09:00';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} importantForAccessibility="no">
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Sparkles size={24} color="#10B981" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Crear Nuevo Evento</Text>
                <Text style={styles.subtitle}>Programa tu próxima sesión de estudio o evento</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Type size={16} color="#10B981" style={styles.labelIcon} />
                  <Text style={styles.label}>
                    Nombre del Evento <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    errors.nombreEvento && styles.inputError,
                  ]}
                  value={formData.nombreEvento}
                  onChangeText={(text) => handleInputChange('nombreEvento', text)}
                  placeholder="Ej: Sesión de estudio matutina"
                  placeholderTextColor="#6b7280"
                />
                {errors.nombreEvento && (
                  <Text style={styles.errorText}>{errors.nombreEvento}</Text>
                )}
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <View style={styles.labelContainer}>
                    <Calendar size={16} color="#10B981" style={styles.labelIcon} />
                    <Text style={styles.label}>
                      Fecha <Text style={styles.required}>*</Text>
                    </Text>
                  </View>
                  <View style={[styles.dateInput, errors.fechaEvento && styles.inputError]}>
                    <Calendar size={20} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.dateTextInput}
                      value={formData.fechaEvento}
                      onChangeText={(text) => handleInputChange('fechaEvento', text)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#6b7280"
                    />
                  </View>
                  {errors.fechaEvento && (
                    <Text style={styles.errorText}>{errors.fechaEvento}</Text>
                  )}
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <View style={styles.labelContainer}>
                    <Clock size={16} color="#10B981" style={styles.labelIcon} />
                    <Text style={styles.label}>
                      Hora <Text style={styles.required}>*</Text>
                    </Text>
                  </View>
                  <View style={[styles.timeInput, errors.horaEvento && styles.inputError]}>
                    <Clock size={20} color="#6b7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.timeTextInput}
                      value={formData.horaEvento}
                      onChangeText={(text) => handleInputChange('horaEvento', text)}
                      placeholder="HH:MM:SS"
                      placeholderTextColor="#6b7280"
                    />
                  </View>
                  <Text style={styles.timeHint}>
                    {formatTimeForDisplay(formData.horaEvento)}
                  </Text>
                  {errors.horaEvento && (
                    <Text style={styles.errorText}>{errors.horaEvento}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={[styles.labelIcon, { fontSize: 16 }]}>📄</Text>
                  <Text style={styles.label}>
                    Descripción <Text style={styles.optional}>(opcional)</Text>
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.descripcionEvento}
                  onChangeText={(text) => handleInputChange('descripcionEvento', text)}
                  placeholder="Describe tu evento (opcional)"
                  placeholderTextColor="#6b7280"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.eventTypeSection}>
                <Text style={styles.sectionTitle}>Tipo de Evento</Text>
                
                <TouchableOpacity
                  style={[
                    styles.eventTypeCard,
                    formData.tipoEvento === 'concentracion' && styles.eventTypeCardSelected,
                  ]}
                  onPress={() => handleInputChange('tipoEvento', 'concentracion')}
                >
                  <View style={styles.eventTypeCardHeader}>
                    <View style={styles.eventTypeIcon}>
                      <Sparkles size={20} color="#10B981" />
                    </View>
                    <View style={styles.eventTypeTitleContainer}>
                      <Text style={styles.eventTypeTitle}>
                        Sesión de Concentración
                      </Text>
                      {formData.tipoEvento === 'concentracion' && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recomendado</Text>
                        </View>
                      )}
                    </View>
                    {formData.tipoEvento === 'concentracion' && (
                      <CheckCircle size={20} color="#10B981" />
                    )}
                  </View>
                  <Text style={styles.eventTypeDescription}>
                    Incluye temporizador, métodos de estudio y música ambiental
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.eventTypeCard,
                    formData.tipoEvento === 'normal' && styles.eventTypeCardSelected,
                  ]}
                  onPress={() => handleInputChange('tipoEvento', 'normal')}
                >
                  <View style={styles.eventTypeCardHeader}>
                    <View style={[styles.eventTypeIcon, styles.eventTypeIconNormal]}>
                      <Calendar size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.eventTypeTitleContainer}>
                      <Text style={styles.eventTypeTitle}>
                        Evento Normal
                      </Text>
                    </View>
                    {formData.tipoEvento === 'normal' && (
                      <CheckCircle size={20} color="#3b82f6" />
                    )}
                  </View>
                  <Text style={styles.eventTypeDescription}>
                    Solo recordatorio de calendario básico
                  </Text>
                </TouchableOpacity>
              </View>

              {formData.tipoEvento === 'concentracion' && (
                <View style={styles.selectionSection}>
                  <TouchableOpacity
                    style={styles.selectionHeader}
                    onPress={() => setIsMethodsExpanded(!isMethodsExpanded)}
                  >
                    <View style={styles.selectionHeaderContent}>
                      <View style={styles.selectionIcon}>
                        <Brain size={20} color="#fff" />
                      </View>
                      <Text style={styles.selectionTitle}>
                        Método de Estudio {formData.idMetodo && '✓'}
                      </Text>
                    </View>
                    {isMethodsExpanded ? (
                      <ChevronUp size={20} color="#10B981" />
                    ) : (
                      <ChevronDown size={20} color="#10B981" />
                    )}
                  </TouchableOpacity>

                  {isMethodsExpanded && (
                    <View style={styles.selectionContent}>
                      <Text style={styles.selectionSubtitle}>
                        Elige el método que usarás durante tu sesión de concentración
                      </Text>
                      
                      <View style={styles.methodsGrid}>
                        {metodosDisponibles.map((metodo) => {
                          const IconComponent = metodo.icono;
                          const isSelected = formData.idMetodo === metodo.id;

                          return (
                            <TouchableOpacity
                              key={metodo.id}
                              style={[
                                styles.methodCard,
                                isSelected && styles.methodCardSelected
                              ]}
                              onPress={() => {
                                autoCompleteEventFromMethod(metodo.id);
                                setIsMethodsExpanded(false);
                              }}
                            >
                              <View style={styles.methodCardHeader}>
                                <View style={[styles.methodIconContainer, { backgroundColor: metodo.color }]}>
                                  <IconComponent size={20} color="#fff" />
                                </View>
                                <View style={styles.methodInfo}>
                                  <Text style={styles.methodName}>{metodo.nombre_metodo}</Text>
                                </View>
                                {isSelected && (
                                  <View style={styles.selectedBadge}>
                                    <CheckCircle size={16} color="#10B981" />
                                  </View>
                                )}
                              </View>
                              <Text style={styles.methodDescription}>
                                {metodo.descripcion}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {formData.tipoEvento === 'concentracion' && (
                <View style={styles.selectionSection}>
                  <TouchableOpacity
                    style={styles.selectionHeader}
                    onPress={() => setIsAlbumsExpanded(!isAlbumsExpanded)}
                  >
                    <View style={styles.selectionHeaderContent}>
                      <View style={[styles.selectionIcon, styles.albumIcon]}>
                        <Headphones size={20} color="#fff" />
                      </View>
                      <Text style={styles.selectionTitle}>
                        Álbum de Música {formData.idAlbum && '✓'}
                      </Text>
                    </View>
                    {isAlbumsExpanded ? (
                      <ChevronUp size={20} color="#8B5CF6" />
                    ) : (
                      <ChevronDown size={20} color="#8B5CF6" />
                    )}
                  </TouchableOpacity>

                  {isAlbumsExpanded && (
                    <View style={styles.selectionContent}>
                      <Text style={styles.selectionSubtitle}>
                        Elige el álbum que te ayudará a mantener la concentración
                      </Text>

                      {loadingAlbums ? (
                        <View style={styles.loadingContainer}>
                          <Text style={styles.loadingText}>Cargando álbumes...</Text>
                        </View>
                      ) : (
                        <View style={styles.albumsGrid}>
                          {albums.map((album) => {
                            const isSelected = formData.idAlbum === album.id_album;

                            return (
                              <TouchableOpacity
                                key={album.id_album}
                                style={[
                                  styles.albumCard,
                                  isSelected && styles.albumCardSelected
                                ]}
                                onPress={() => {
                                  handleInputChange('idAlbum', album.id_album);
                                  setIsAlbumsExpanded(false);
                                }}
                              >
                                <Image
                                  source={getLocalAlbumImage(album.id_album)}
                                  style={styles.albumImage}
                                  resizeMode="cover"
                                />
                                <View style={styles.albumInfo}>
                                  <Text style={styles.albumName}>{album.nombre_album}</Text>
                                  <Text style={styles.albumGenre}>{album.genero}</Text>
                                </View>
                                {isSelected && (
                                  <View style={styles.albumSelectedIndicator}>
                                    <CheckCircle size={16} color="#8B5CF6" />
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.button, styles.createButton]}
            >
              {loading ? (
                <Text style={styles.createButtonText}>Creando...</Text>
              ) : (
                <>
                  <Plus size={20} color="#fff" />
                  <Text style={styles.createButtonText}>Crear Evento</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Estilos (mantener igual que antes, solo ajustar nombres si es necesario)
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  scrollView: {
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#10B981',
    opacity: 0.9,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  form: {
    padding: 24,
    gap: 24,
    backgroundColor: '#000000',
  },
  inputGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelIcon: {
    marginRight: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  required: {
    color: '#ef4444',
  },
  optional: {
    color: '#6b7280',
    fontWeight: 'normal',
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  dateTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  timeTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  timeHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  eventTypeSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  eventTypeCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    padding: 20,
  },
  eventTypeCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  eventTypeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  eventTypeIconNormal: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  eventTypeTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  eventTypeDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  recommendedText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
  },
  selectionSection: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  selectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumIcon: {
    backgroundColor: '#8B5CF6',
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  selectionContent: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  methodsGrid: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  methodCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  methodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  methodDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  albumsGrid: {
    gap: 12,
  },
  albumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  albumCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  albumImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#333333',
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  albumGenre: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  albumSelectedIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#10B981',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});