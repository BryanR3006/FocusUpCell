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
} from 'react-native';
import type { IEvento, IEventoUpdate } from '../types/events';
import { X, Calendar, Clock, BookOpen, Music, Check } from 'lucide-react-native';

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
    horaEvento: '',
    descripcionEvento: '',
    tipoEvento: '',
    idMetodo: undefined as number | undefined,
    idAlbum: undefined as number | undefined,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);

  const getProperty = (propertyName: keyof IEvento) => {
    if (!event) return '';
    return (event[propertyName] as any) || '';
  };

  const getId = () => {
    if (!event) return 0;
    return event.idEvento || 0;
  };

  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        nombreEvento: event.nombreEvento,
        fechaEvento: event.fechaEvento,
        horaEvento: event.horaEvento,
        descripcionEvento: event.descripcionEvento || '',
        tipoEvento: event.tipoEvento || '',
        idMetodo: event.metodo?.idMetodo,
        idAlbum: event.album?.idAlbum,
      });

      // Reset selected method and album
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

    if (!formData.horaEvento) {
      newErrors.horaEvento = 'La hora del evento es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !event) {
      return;
    }

    setLoading(true);
    try {
      const eventData: IEventoUpdate = {
        nombreEvento: formData.nombreEvento.trim(),
        fechaEvento: formData.fechaEvento,
        horaEvento: formData.horaEvento,
        descripcionEvento: formData.descripcionEvento.trim() || undefined,
        tipoEvento: formData.tipoEvento || undefined,
      };

      // Solo agregar método y álbum si son diferentes
      if (formData.idMetodo !== undefined) {
        eventData.idMetodo = formData.idMetodo;
      }
      if (formData.idAlbum !== undefined) {
        eventData.idAlbum = formData.idAlbum;
      }

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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddMethod = () => {
    Alert.alert('Función no disponible', 'La selección de métodos estará disponible próximamente.');
  };

  const handleAddAlbum = () => {
    Alert.alert('Función no disponible', 'La selección de álbumes estará disponible próximamente.');
  };

  const handleRemoveMethod = () => {
    setSelectedMethod(null);
    handleInputChange('idMetodo', undefined as any);
  };

  const handleRemoveAlbum = () => {
    setSelectedAlbum(null);
    handleInputChange('idAlbum', undefined as any);
  };

  if (!isOpen || !event) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} importantForAccessibility="no">
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                  <Calendar size={24} color="#10B981" />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Editar Evento</Text>
                  <Text style={styles.subtitle}>Modifica los detalles de tu evento</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.labelIcon}>📝</Text>
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

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Calendar size={16} color="#10B981" style={styles.labelIcon} />
                  <Text style={styles.label}>
                    Fecha del Evento <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, errors.fechaEvento && styles.inputError]}
                  value={formData.fechaEvento}
                  onChangeText={(text) => handleInputChange('fechaEvento', text)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#6b7280"
                />
                {errors.fechaEvento && (
                  <Text style={styles.errorText}>{errors.fechaEvento}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Clock size={16} color="#10B981" style={styles.labelIcon} />
                  <Text style={styles.label}>
                    Hora del Evento <Text style={styles.required}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, errors.horaEvento && styles.inputError]}
                  value={formData.horaEvento}
                  onChangeText={(text) => handleInputChange('horaEvento', text)}
                  placeholder="HH:MM:SS"
                  placeholderTextColor="#6b7280"
                />
                {errors.horaEvento && (
                  <Text style={styles.errorText}>{errors.horaEvento}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.labelIcon}>📄</Text>
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

              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.labelIcon}>🏷️</Text>
                  <Text style={styles.label}>
                    Tipo de Evento <Text style={styles.optional}>(opcional)</Text>
                  </Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.tipoEvento}
                  onChangeText={(text) => handleInputChange('tipoEvento', text)}
                  placeholder="Ej: concentracion, normal"
                  placeholderTextColor="#6b7280"
                />
              </View>

              {(formData.tipoEvento === 'concentracion' || event?.tipoEvento === 'concentracion') && (
                <View style={styles.concentrationSection}>
                  <View style={styles.sectionDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.sectionTitle}>Configuración de concentración</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    onPress={handleAddMethod}
                    style={styles.selectionButton}
                  >
                    <View style={styles.selectionButtonContent}>
                      <View style={styles.selectionIcon}>
                        <BookOpen size={20} color="#60a5fa" />
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

                  <TouchableOpacity
                    onPress={handleAddAlbum}
                    style={[styles.selectionButton, styles.albumButton]}
                  >
                    <View style={styles.selectionButtonContent}>
                      <View style={[styles.selectionIcon, styles.albumIcon]}>
                        <Music size={20} color="#a78bfa" />
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

                  {(selectedMethod || selectedAlbum) && (
                    <View style={styles.selectedItems}>
                      {selectedMethod && (
                        <View style={styles.selectedItem}>
                          <View style={styles.selectedItemIcon}>
                            <BookOpen size={16} color="#fff" />
                          </View>
                          <Text style={styles.selectedItemText}>{selectedMethod.nombre_metodo}</Text>
                          <TouchableOpacity onPress={handleRemoveMethod}>
                            <X size={16} color="#9ca3af" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {selectedAlbum && (
                        <View style={[styles.selectedItem, styles.selectedAlbumItem]}>
                          <View style={[styles.selectedItemIcon, styles.albumItemIcon]}>
                            <Music size={16} color="#fff" />
                          </View>
                          <Text style={styles.selectedItemText}>{selectedAlbum.nombre_album}</Text>
                          <TouchableOpacity onPress={handleRemoveAlbum}>
                            <X size={16} color="#9ca3af" />
                          </TouchableOpacity>
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
              style={[styles.button, styles.saveButton]}
            >
              {loading ? (
                <Text style={styles.saveButtonText}>Guardando...</Text>
              ) : (
                <>
                  <Check size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
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
    borderBottomColor: '#333333',
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
  headerText: {
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
    fontSize: 16,
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
  textArea: {
    minHeight: 100,
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
    width: 32,
    height: 32,
    borderRadius: 8,
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
    borderTopColor: '#333333',
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
  saveButton: {
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});