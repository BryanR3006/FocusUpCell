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
} from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { Picker } from '@react-native-picker/picker';
// import Icon from 'react-native-vector-icons/MaterialIcons';
import type { IEvento, IEventoUpdate } from '../types/events';
// import { MethodSelectionModal } from '../components/MethodSelectionModal';
// import { AlbumSelectionModal } from '../components/AlbumSelectionModal';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventId: number, data: IEventoUpdate) => Promise<void>;
  event: IEvento | null;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
}) => {
  const [formData, setFormData] = useState({
    nombreEvento: '',
    fechaEvento: '',
    hours: 1,
    minutes: 0,
    period: 'AM',
    descripcionEvento: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);

  const getProperty = (snakeCase: string, camelCase: string) => {
    if (!event) return '';
    return event[snakeCase] || event[camelCase] || '';
  };

  const getId = () => {
    if (!event) return 0;
    return event.id_evento || event.idEvento || 0;
  };

  const convertTo12Hour = (time24h: string) => {
    if (!time24h) return { hours: 1, minutes: 0, period: 'AM' };

    const [hours24, minutes] = time24h.split(':').map(Number);
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

    return { hours: hours12, minutes: minutes || 0, period };
  };

  useEffect(() => {
    if (event && isOpen) {
      const timeData = convertTo12Hour(getProperty('hora_evento', 'horaEvento'));
      
      setFormData({
        nombreEvento: getProperty('nombre_evento', 'nombreEvento'),
        fechaEvento: getProperty('fecha_evento', 'fechaEvento'),
        hours: timeData.hours,
        minutes: timeData.minutes,
        period: timeData.period,
        descripcionEvento: getProperty('descripcion_evento', 'descripcionEvento'),
      });


      setSelectedMethod(null);
      setSelectedAlbum(null);
      setErrors({});
    }
  }, [event, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombreEvento.trim()) {
      newErrors.nombreEvento = 'El nombre del evento es requerido';
    }

    if (!formData.fechaEvento) {
      newErrors.fechaEvento = 'La fecha del evento es requerida';
    } else {
      const eventDate = new Date(formData.fechaEvento);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        newErrors.fechaEvento = 'La fecha no puede ser anterior a hoy';
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

  const handleSubmit = async () => {
    if (!validateForm() || !event) {
      return;
    }

    setLoading(true);
    try {
      const eventData: IEventoUpdate = {
        nombre_evento: formData.nombreEvento.trim(),
        fecha_evento: new Date(formData.fechaEvento).toISOString().split('T')[0],
        hora_evento: convertTo24Hour(formData.hours, formData.period),
        descripcion_evento: formData.descripcionEvento.trim() || undefined,
        ...(selectedMethod && { id_metodo: selectedMethod.id_metodo }),
        ...(selectedAlbum && { id_album: selectedAlbum.id_album }),
      };

      await onSave(getId(), eventData);
      onClose();
    } catch (error: any) {
      console.error('Error editando evento:', error);
      
      Alert.alert(
        'Error al editar el evento',
        error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Error desconocido',
        [{ text: 'Aceptar' }]
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


  const handleAddMethod = () => {
    // Temporarily disabled - MethodSelectionModal not available
    Alert.alert('Función no disponible', 'La selección de métodos estará disponible próximamente.');
  };
  const handleAddAlbum = () => {
    // Temporarily disabled - AlbumSelectionModal not available
    Alert.alert('Función no disponible', 'La selección de álbumes estará disponible próximamente.');
  };
  
  const handleMethodSelect = (method: any) => {
    setSelectedMethod(method);
    setIsMethodModalOpen(false);
  };

  const handleAlbumSelect = (album: any) => {
    setSelectedAlbum(album);
    setIsAlbumModalOpen(false);
  };

  const handleRemoveMethod = () => setSelectedMethod(null);
  const handleRemoveAlbum = () => setSelectedAlbum(null);

  if (!isOpen || !event) return null;

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
                  <Text style={{color: '#60a5fa', fontSize: 24}}>📅</Text>
                </View>
                <View>
                  <Text style={styles.title}>Editar Evento</Text>
                  <Text style={styles.subtitle}>Modifica los detalles de tu evento</Text>
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
                  style={[styles.input, errors.fechaEvento && styles.inputError]}
                  value={formData.fechaEvento}
                  onChangeText={(text) => handleInputChange('fechaEvento', text)}
                  placeholder="YYYY-MM-DD (ej: 2025-12-06)"
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
                <TextInput
                  style={[styles.input, errors.horaEvento && styles.inputError]}
                  value={`${formData.hours.toString().padStart(2, '0')}:${formData.minutes.toString().padStart(2, '0')} ${formData.period}`}
                  onChangeText={(text) => {
                    // Simple parsing for HH:MM AM/PM format
                    const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                    if (match) {
                      const [, hours, minutes, period] = match;
                      setFormData(prev => ({
                        ...prev,
                        hours: parseInt(hours),
                        minutes: parseInt(minutes),
                        period: period.toUpperCase()
                      }));
                    }
                  }}
                  placeholder="HH:MM AM/PM (ej: 02:30 PM)"
                  placeholderTextColor="#6b7280"
                />
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

              {/* Concentration Session Options */}
              {(getProperty('id_metodo', 'idMetodo') || getProperty('id_album', 'idAlbum')) && (
                <View style={styles.concentrationSection}>
                  <View style={styles.sectionDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.sectionTitle}>Configuración de concentración</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Method Selection */}
                  <TouchableOpacity
                    onPress={handleAddMethod}
                    style={styles.selectionButton}
                  >
                    <View style={styles.selectionButtonContent}>
                      <View style={styles.selectionIcon}>
                        <Text style={{color: '#60a5fa', fontSize: 20}}>📚</Text>
                      </View>
                      <View style={styles.selectionText}>
                        <Text style={styles.selectionTitle}>
                          {selectedMethod ? selectedMethod.nombre_metodo : 'Seleccionar método'}
                        </Text>
                        <Text style={styles.selectionSubtitle}>
                          {selectedMethod ? 'Método de estudio seleccionado' : 'Método de estudio (opcional)'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Album Selection */}
                  <TouchableOpacity
                    onPress={handleAddAlbum}
                    style={[styles.selectionButton, styles.albumButton]}
                  >
                    <View style={styles.selectionButtonContent}>
                      <View style={[styles.selectionIcon, styles.albumIcon]}>
                        <Text style={{color: '#a78bfa', fontSize: 20}}>🎵</Text>
                      </View>
                      <View style={styles.selectionText}>
                        <Text style={styles.selectionTitle}>
                          {selectedAlbum ? selectedAlbum.nombre_album : 'Seleccionar álbum'}
                        </Text>
                        <Text style={styles.selectionSubtitle}>
                          {selectedAlbum ? 'Álbum de música seleccionado' : 'Música de fondo (opcional)'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Selected Items Display */}
                  {(selectedMethod || selectedAlbum) && (
                    <View style={styles.selectedItems}>
                      {selectedMethod && (
                        <View style={styles.selectedItem}>
                          <View style={styles.selectedItemIcon}>
                            <Text style={{color: '#fff', fontSize: 16}}>📚</Text>
                          </View>
                          <Text style={styles.selectedItemText}>{selectedMethod.nombre_metodo}</Text>
                          <TouchableOpacity onPress={handleRemoveMethod}>
                            <Icon name="close" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {selectedAlbum && (
                        <View style={[styles.selectedItem, styles.selectedAlbumItem]}>
                          <View style={[styles.selectedItemIcon, styles.albumItemIcon]}>
                            <Text style={{color: '#fff', fontSize: 16}}>🎵</Text>
                          </View>
                          <Text style={styles.selectedItemText}>{selectedAlbum.nombre_album}</Text>
                          <TouchableOpacity onPress={handleRemoveAlbum}>
                            <Icon name="close" size={16} color="#9ca3af" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
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
              style={[styles.button, styles.saveButton]}
            >
              {loading ? (
                <Text style={styles.saveButtonText}>Guardando...</Text>
              ) : (
                <>
                  <Text style={{color: '#fff', fontSize: 20}}>💾</Text>
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Selection Modals - Temporarily disabled */}
        {/* <MethodSelectionModal
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
        /> */}
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
    borderColor: 'rgba(59, 130, 246, 0.2)',
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
    borderBottomColor: 'rgba(59, 130, 246, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  concentrationSection: {
    gap: 16,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  selectionButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  albumButton: {
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  selectionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumIcon: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  selectionText: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  selectedItems: {
    gap: 8,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    padding: 12,
  },
  selectedAlbumItem: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  selectedItemIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumItemIcon: {
    backgroundColor: 'rgba(167, 139, 250, 0.8)',
  },
  selectedItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
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
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditEventModal;