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
} from 'react-native';
import type { IEventoCreate } from '../types/events';
import { useNavigation } from '@react-navigation/native';
import { BookOpen, Target, Timer, Brain, Zap, TrendingUp } from 'lucide-react-native';

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
  });

  const [isMethodsExpanded, setIsMethodsExpanded] = useState(false);

  // Lista de métodos disponibles
  const metodosDisponibles = [
    { id: 1, nombre: 'Método Pomodoro', descripcion: 'Intervalos de 25 minutos', icono: Timer, color: '#8B5CF6' },
    { id: 2, nombre: 'Mapas Mentales', descripcion: 'Organización visual', icono: Brain, color: '#10B981' },
    { id: 3, nombre: 'Técnica Feynman', descripcion: 'Aprender enseñando', icono: BookOpen, color: '#06B6D4' },
    { id: 4, nombre: 'Repaso Espaciado', descripcion: 'Memorización inteligente', icono: TrendingUp, color: '#F59E0B' },
    { id: 5, nombre: 'Método Cornell', descripcion: 'Notas estructuradas', icono: BookOpen, color: '#3B82F6' },
    { id: 6, nombre: 'Práctica Activa', descripcion: 'Aprendizaje práctico', icono: Target, color: '#EC4899' },
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
      });
      setIsMethodsExpanded(false);
      setErrors({});
    }
  }, [isOpen]);

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

  // Función para auto-completar evento basado en método seleccionado
  const autoCompleteEventFromMethod = (methodId: number) => {
    const metodo = metodosDisponibles.find(m => m.id === methodId);
    if (!metodo) return;

    // Auto-completar nombre del evento
    const eventName = `Sesión de ${metodo.nombre}`;

    // Auto-completar descripción
    const eventDescription = `Sesión dedicada al método ${metodo.nombre}. ${metodo.descripcion}`;

    // Auto-completar duración basada en el método
    const durationMap: { [key: number]: { hours: number; minutes: number } } = {
      1: { hours: 0, minutes: 25 }, // Pomodoro
      2: { hours: 0, minutes: 45 }, // Mapas Mentales
      3: { hours: 1, minutes: 0 },  // Técnica Feynman
      4: { hours: 0, minutes: 30 }, // Repaso Espaciado
      5: { hours: 0, minutes: 40 }, // Método Cornell
      6: { hours: 0, minutes: 50 }, // Práctica Activa
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
      };

      await onSave(eventData);
      Alert.alert('¡Evento creado!', 'Tu evento ha sido guardado correctamente.');
      onClose();

      // Navegar a Home después de crear el evento exitosamente
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
        <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
          <ScrollView style={styles.scrollView}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Text style={{color: '#10b981', fontSize: 24}}>📅</Text>
                </View>
                <View>
                  <Text style={styles.title}>Crear Nuevo Evento</Text>
                  <Text style={styles.subtitle}>Programa tu próxima sesión de estudio o evento</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={{color: '#9ca3af', fontSize: 20}}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Event Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Nombre del Evento <Text style={styles.required}>*</Text>
                </Text>
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

              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Fecha del Evento <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.dateInput}
                  value={formData.fechaEvento}
                  onChangeText={(text) => handleInputChange('fechaEvento', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                />
                {errors.fechaEvento && (
                  <Text style={styles.errorText}>{errors.fechaEvento}</Text>
                )}
              </View>

              {/* Time */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Hora del Evento <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.timeContainer}>
                  {/* Hours */}
                  <View style={styles.timeGroup}>
                    <Text style={styles.timeLabel}>Horas</Text>
                    <TouchableOpacity
                      style={styles.pickerContainer}
                      onPress={() => {
                        // Simple increment/decrement for demo
                        const newHour = formData.hours >= 12 ? 1 : formData.hours + 1;
                        setFormData(prev => ({ ...prev, hours: newHour }));
                      }}
                    >
                      <Text style={styles.pickerText}>
                        {formData.hours.toString().padStart(2, '0')}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Minutes */}
                  <View style={styles.timeGroup}>
                    <Text style={styles.timeLabel}>Minutos</Text>
                    <TouchableOpacity
                      style={styles.pickerContainer}
                      onPress={() => {
                        const newMinute = (formData.minutes + 5) % 60;
                        setFormData(prev => ({ ...prev, minutes: newMinute }));
                      }}
                    >
                      <Text style={styles.pickerText}>
                        {formData.minutes.toString().padStart(2, '0')}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* AM/PM */}
                  <View style={styles.timeGroup}>
                    <Text style={styles.timeLabel}>AM/PM</Text>
                    <TouchableOpacity
                      style={styles.pickerContainer}
                      onPress={() => {
                        const newPeriod = formData.period === 'AM' ? 'PM' : 'AM';
                        setFormData(prev => ({ ...prev, period: newPeriod }));
                      }}
                    >
                      <Text style={styles.pickerText}>
                        {formData.period}
                      </Text>
                      <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {errors.horaEvento && (
                  <Text style={styles.errorText}>{errors.horaEvento}</Text>
                )}
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
                <Text style={styles.label}>Tipo de Evento</Text>
                
                <TouchableOpacity
                  style={[
                    styles.eventTypeOption,
                    formData.tipoEvento === 'concentracion' && styles.eventTypeSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, tipoEvento: 'concentracion' }))}
                >
                  <View style={styles.eventTypeContent}>
                    <View style={styles.eventTypeRadio}>
                      {formData.tipoEvento === 'concentracion' && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <View style={styles.eventTypeText}>
                      <Text style={styles.eventTypeTitle}>
                        Sesión de Concentración
                      </Text>
                      <Text style={styles.eventTypeDescription}>
                        Incluye temporizador, métodos de estudio y música ambiental
                      </Text>
                    </View>
                  </View>
                  {formData.tipoEvento === 'concentracion' && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recomendado</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.eventTypeOption,
                    formData.tipoEvento === 'normal' && styles.normalSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, tipoEvento: 'normal' }))}
                >
                  <View style={styles.eventTypeContent}>
                    <View style={styles.eventTypeRadio}>
                      {formData.tipoEvento === 'normal' && (
                        <View style={[styles.radioSelected, styles.normalRadioSelected]} />
                      )}
                    </View>
                    <View style={styles.eventTypeText}>
                      <Text style={styles.eventTypeTitle}>
                        Evento Normal
                      </Text>
                      <Text style={styles.eventTypeDescription}>
                        Solo recordatorio de calendario básico
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Study Methods Selection - Collapsible */}
              <View style={styles.methodsSection}>
                <TouchableOpacity
                  style={styles.collapsibleHeader}
                  onPress={() => setIsMethodsExpanded(!isMethodsExpanded)}
                >
                  <Text style={styles.label}>
                    Métodos de Estudio
                  </Text>
                  <Text style={[styles.expandIcon, isMethodsExpanded && styles.expandedIcon]}>
                    ▼
                  </Text>
                </TouchableOpacity>

                {isMethodsExpanded && (
                  <View style={styles.collapsibleContent}>
                    <Text style={styles.methodsQuestion}>
                      ¿Cómo quieres añadir método?
                    </Text>

                    <View style={styles.methodsGrid}>
                      {metodosDisponibles.map((metodo) => {
                        const IconComponent = metodo.icono;
                        const isSelected = formData.metodoSeleccionado === metodo.id;

                        return (
                          <TouchableOpacity
                            key={metodo.id}
                            style={[
                              styles.methodOption,
                              isSelected && styles.methodOptionSelected
                            ]}
                            onPress={() => autoCompleteEventFromMethod(metodo.id)}
                          >
                            <View style={styles.methodRadio}>
                              <View style={[
                                styles.radio,
                                isSelected && styles.radioSelected
                              ]}>
                                {isSelected && <View style={styles.radioDot} />}
                              </View>
                            </View>

                            <View style={[styles.methodIcon, { backgroundColor: `${metodo.color}20` }]}>
                              <IconComponent size={20} color={metodo.color} />
                            </View>

                            <View style={styles.methodInfo}>
                              <Text style={[styles.methodName, isSelected && styles.methodNameSelected]} numberOfLines={2}>
                                {metodo.nombre}
                              </Text>
                              <Text style={[styles.methodDesc, isSelected && styles.methodDescSelected]} numberOfLines={2}>
                                {metodo.descripcion}
                              </Text>
                            </View>

                            {isSelected && (
                              <View style={styles.selectedBadge}>
                                <Text style={styles.selectedText}>Seleccionado</Text>
                              </View>
                            )}
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
                  <Text style={{color: '#fff', fontSize: 20}}>+</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  required: {
    color: '#f87171',
  },
  optional: {
    color: '#9ca3af',
    fontWeight: 'normal',
  },
  input: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.5)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  inputError: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    marginTop: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timeGroup: {
    flex: 1,
    gap: 8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
  },
  pickerContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.5)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  pickerArrow: {
    position: 'absolute',
    right: 8,
    color: '#9ca3af',
    fontSize: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  eventTypeSection: {
    gap: 12,
  },
  eventTypeOption: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  eventTypeSelected: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  normalSelected: {
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  eventTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eventTypeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(107, 114, 128, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  normalRadioSelected: {
    backgroundColor: '#3b82f6',
  },
  eventTypeText: {
    flex: 1,
  },
  eventTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventTypeDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  cancelButtonText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#10b981',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  methodsSection: {
    gap: 12,
  },
  methodsDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodOption: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.5)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  methodDesc: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedCount: {
    fontSize: 12,
    color: '#10b981',
    textAlign: 'center',
    marginTop: 8,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  expandIcon: {
    fontSize: 16,
    color: '#10b981',
    transform: [{ rotate: '0deg' }],
    transition: 'all 0.3s ease',
  },
  expandedIcon: {
    transform: [{ rotate: '180deg' }],
  },
  collapsibleContent: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  methodsQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  methodRadio: {
    marginRight: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(107, 114, 128, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  radioSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 1,
  },
  methodOptionSelected: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    transform: [{ scale: 1.02 }],
  },
  methodNameSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  methodDescSelected: {
    color: '#d1d5db',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  selectionHint: {
    fontSize: 14,
    color: '#10b981',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  methodInfo: {
    flex: 1,
  },
});

export default CreateEventModal;