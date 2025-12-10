import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import type { IEventoCreate } from '../types/events';
import { useNavigation } from '@react-navigation/native';
import { BookOpen, Target, Timer, Brain, Zap, TrendingUp, Music, Calendar, Clock, Type, ChevronDown, ChevronUp, X, Sparkles, Headphones, Notebook } from 'lucide-react-native';
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

  const [formData, setFormData] = useState({
    nombreEvento: '',
    fechaEvento: '',
    hours: 1,
    minutes: 0,
    period: 'AM',
    descripcionEvento: '',
    tipoEvento: 'concentracion' as 'normal' | 'concentracion',
    metodoSeleccionado: null as number | null,
    albumSeleccionado: null as number | null,
  });

  const [isMethodsExpanded, setIsMethodsExpanded] = useState(false);
  const [isAlbumsExpanded, setIsAlbumsExpanded] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(false);

  const metodosDisponibles = [
    { 
      id: 1, 
      nombre: 'Método Pomodoro', 
      descripcion: 'Técnica de gestión de tiempo con intervalos de trabajo y descanso', 
      icono: Timer, 
      color: '#8B5CF6',
      gradient: ['#8B5CF6', '#7C3AED']
    },
    { 
      id: 2, 
      nombre: 'Mapas Mentales', 
      descripcion: 'Organización visual de ideas y conceptos', 
      icono: Brain, 
      color: '#10B981',
      gradient: ['#10B981', '#059669']
    },
    { 
      id: 3, 
      nombre: 'Método Feynman', 
      descripcion: 'Explicación de conceptos en términos simples', 
      icono: BookOpen, 
      color: '#06B6D4',
      gradient: ['#06B6D4', '#0891B2']
    },
    { 
      id: 4, 
      nombre: 'Repaso Espaciado', 
      descripcion: 'Técnica de memorización con intervalos crecientes', 
      icono: TrendingUp, 
      color: '#F59E0B',
      gradient: ['#F59E0B', '#D97706']
    },
    { 
      id: 5, 
      nombre: 'Método Cornell', 
      descripcion: 'Sistema de toma de notas estructurado', 
      icono: Notebook, 
      color: '#3B82F6',
      gradient: ['#3B82F6', '#2563EB']
    },
    { 
      id: 6, 
      nombre: 'Práctica Activa', 
      descripcion: 'Aprendizaje mediante aplicación práctica de conocimientos', 
      icono: Target, 
      color: '#EC4899',
      gradient: ['#EC4899', '#DB2777']
    },
  ];

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombreEvento: '',
        fechaEvento: '',
        hours: 1,
        minutes: 0,
        period: 'AM',
        descripcionEvento: '',
        tipoEvento: 'concentracion',
        metodoSeleccionado: null,
        albumSeleccionado: null,
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
      const convertTo24Hour = (hours: number, period: string): string => {
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) {
          hour24 = hours + 12;
        } else if (period === 'AM' && hours === 12) {
          hour24 = 0;
        }
        return `${hour24.toString().padStart(2, '0')}:${formData.minutes.toString().padStart(2, '0')}:00`;
      };

      const eventDateTimeString = `${formData.fechaEvento}T${convertTo24Hour(formData.hours, formData.period)}`;
      const eventDateTime = new Date(eventDateTimeString);
      const now = new Date();

      if (eventDateTime <= now) {
        newErrors.fechaEvento = 'No se pueden crear eventos en el pasado. Para eventos del mismo día, la hora debe ser futura.';
      }
    }

    if (formData.hours < 1 || formData.hours > 12) {
      newErrors.horaEvento = 'La hora debe estar entre 1 y 12';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertTo24Hour = (hours: number, period: string): string => {
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${formData.minutes.toString().padStart(2, '0')}:00`;
  };

  const autoCompleteEventFromMethod = (methodId: number) => {
    const metodo = metodosDisponibles.find(m => m.id === methodId);
    if (!metodo) return;

    const eventName = `Sesión de ${metodo.nombre}`;
    const eventDescription = `Sesión dedicada al método ${metodo.nombre}. ${metodo.descripcion}`;
    const durationMap: { [key: number]: { hours: number; minutes: number } } = {
      1: { hours: 0, minutes: 25 },
      2: { hours: 0, minutes: 45 },
      3: { hours: 1, minutes: 0 },
      4: { hours: 0, minutes: 30 },
      5: { hours: 0, minutes: 40 },
      6: { hours: 0, minutes: 50 },
    };

    const duration = durationMap[methodId] || { hours: 1, minutes: 0 };

    setFormData(prev => ({
      ...prev,
      nombreEvento: eventName,
      descripcionEvento: eventDescription,
      hours: duration.hours,
      minutes: duration.minutes,
      metodoSeleccionado: methodId,
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
        fechaEvento: new Date(formData.fechaEvento).toISOString().split('T')[0],
        horaEvento: convertTo24Hour(formData.hours, formData.period),
        descripcionEvento: formData.descripcionEvento.trim() || undefined,
        tipoEvento: formData.tipoEvento,
        metodosSeleccionados: formData.metodoSeleccionado ? [formData.metodoSeleccionado] : undefined,
        albumSeleccionado: formData.albumSeleccionado || undefined,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
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
              {/* Event Name */}
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

              {/* Date and Time Row */}
              <View style={styles.row}>
                {/* Date */}
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
                      placeholder="dd/mm/aaaa"
                      placeholderTextColor="#6b7280"
                    />
                  </View>
                  {errors.fechaEvento && (
                    <Text style={styles.errorText}>{errors.fechaEvento}</Text>
                  )}
                </View>

                {/* Time */}
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <View style={styles.labelContainer}>
                    <Clock size={16} color="#10B981" style={styles.labelIcon} />
                    <Text style={styles.label}>
                      Hora <Text style={styles.required}>*</Text>
                    </Text>
                  </View>
                  <View style={[styles.timeInputContainer, errors.horaEvento && styles.inputError]}>
                    <View style={styles.timePickerGroup}>
                      <TouchableOpacity
                        style={styles.timePickerButton}
                        onPress={() => {
                          const newHour = formData.hours >= 12 ? 1 : formData.hours + 1;
                          setFormData(prev => ({ ...prev, hours: newHour }));
                        }}
                      >
                        <Text style={styles.timePickerText}>
                          {formData.hours.toString().padStart(2, '0')}
                        </Text>
                        <Text style={styles.timePickerLabel}>Horas</Text>
                      </TouchableOpacity>
                      <Text style={styles.timeSeparator}>:</Text>
                      <TouchableOpacity
                        style={styles.timePickerButton}
                        onPress={() => {
                          const newMinute = (formData.minutes + 5) % 60;
                          setFormData(prev => ({ ...prev, minutes: newMinute }));
                        }}
                      >
                        <Text style={styles.timePickerText}>
                          {formData.minutes.toString().padStart(2, '0')}
                        </Text>
                        <Text style={styles.timePickerLabel}>Minutos</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.periodSelector}>
                      <TouchableOpacity
                        style={[
                          styles.periodButton,
                          formData.period === 'AM' && styles.periodButtonActive
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, period: 'AM' }))}
                      >
                        <Text style={[
                          styles.periodText,
                          formData.period === 'AM' && styles.periodTextActive
                        ]}>AM</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.periodButton,
                          formData.period === 'PM' && styles.periodButtonActive
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, period: 'PM' }))}
                      >
                        <Text style={[
                          styles.periodText,
                          formData.period === 'PM' && styles.periodTextActive
                        ]}>PM</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {errors.horaEvento && (
                    <Text style={styles.errorText}>{errors.horaEvento}</Text>
                  )}
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Descripción <Text style={styles.optional}>(opcional)</Text>
                </Text>
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

              {/* Event Type */}
              <View style={styles.eventTypeSection}>
                <Text style={styles.sectionTitle}>Tipo de Evento</Text>
                
                <TouchableOpacity
                  style={[
                    styles.eventTypeCard,
                    formData.tipoEvento === 'concentracion' && styles.eventTypeCardSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, tipoEvento: 'concentracion' }))}
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
                    <View style={[
                      styles.eventTypeRadio,
                      formData.tipoEvento === 'concentracion' && styles.eventTypeRadioSelected
                    ]}>
                      {formData.tipoEvento === 'concentracion' && (
                        <View style={styles.radioSelectedDot} />
                      )}
                    </View>
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
                  onPress={() => setFormData(prev => ({ ...prev, tipoEvento: 'normal' }))}
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
                    <View style={[
                      styles.eventTypeRadio,
                      formData.tipoEvento === 'normal' && styles.eventTypeRadioSelectedNormal
                    ]}>
                      {formData.tipoEvento === 'normal' && (
                        <View style={[styles.radioSelectedDot, styles.radioSelectedDotNormal]} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.eventTypeDescription}>
                    Solo recordatorio de calendario básico
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Study Methods Selection */}
              <View style={styles.selectionSection}>
                <TouchableOpacity
                  style={styles.selectionHeader}
                  onPress={() => setIsMethodsExpanded(!isMethodsExpanded)}
                >
                  <View style={styles.selectionHeaderContent}>
                    <View style={styles.selectionIcon}>
                      <Brain size={20} color="#fff" />
                    </View>
                    <Text style={styles.selectionTitle}>Seleccionar Método de Estudio</Text>
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
                        const isSelected = formData.metodoSeleccionado === metodo.id;

                        return (
                          <TouchableOpacity
                            key={metodo.id}
                            style={[
                              styles.methodCard,
                              isSelected && styles.methodCardSelected
                            ]}
                            onPress={() => autoCompleteEventFromMethod(metodo.id)}
                          >
                            <View style={styles.methodCardHeader}>
                              <View style={[styles.methodIconContainer, { backgroundColor: metodo.gradient[0] }]}>
                                <IconComponent size={20} color="#fff" />
                              </View>
                              <View style={styles.methodInfo}>
                                <Text style={styles.methodName}>{metodo.nombre}</Text>
                              </View>
                              {isSelected && (
                                <View style={styles.selectedBadge}>
                                  <View style={styles.selectedBadgeDot} />
                                  <Text style={styles.selectedBadgeText}>Seleccionado</Text>
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

                    <Text style={styles.selectionHint}>
                      Selecciona un método para crear un evento automáticamente
                    </Text>
                  </View>
                )}
              </View>

              {/* Albums Selection */}
              <View style={styles.selectionSection}>
                <TouchableOpacity
                  style={styles.selectionHeader}
                  onPress={() => setIsAlbumsExpanded(!isAlbumsExpanded)}
                >
                  <View style={styles.selectionHeaderContent}>
                    <View style={[styles.selectionIcon, styles.albumIcon]}>
                      <Headphones size={20} color="#fff" />
                    </View>
                    <Text style={styles.selectionTitle}>Seleccionar Álbum de Música</Text>
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
                          const isSelected = formData.albumSeleccionado === album.id_album;

                          return (
                            <TouchableOpacity
                              key={album.id_album}
                              style={[
                                styles.albumCard,
                                isSelected && styles.albumCardSelected
                              ]}
                              onPress={() => setFormData(prev => ({ ...prev, albumSeleccionado: album.id_album }))}
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
                                  <View style={styles.albumSelectedIcon}>
                                    <Headphones size={12} color="#fff" />
                                  </View>
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
            </View>
          </ScrollView>

          {/* Footer */}
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
                  <Text style={styles.createButtonIcon}>+</Text>
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
  inputIcon: {
    marginRight: 12,
  },
  dateTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timeInputContainer: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 12,
  },
  timePickerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timePickerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  timePickerText: {
    color: '#10B981',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timePickerLabel: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  timeSeparator: {
    color: '#10B981',
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 4,
    alignSelf: 'center',
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#10B981',
  },
  periodText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  periodTextActive: {
    color: '#ffffff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eventTypeSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eventTypeDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  eventTypeRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventTypeRadioSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  eventTypeRadioSelectedNormal: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  radioSelectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  radioSelectedDotNormal: {
    backgroundColor: '#3b82f6',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  methodDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  selectedBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  selectedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectionHint: {
    fontSize: 13,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  albumGenre: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  albumSelectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  albumSelectedIcon: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  createButton: {
    backgroundColor: '#10B981',
  },
  createButtonIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default CreateEventModal;