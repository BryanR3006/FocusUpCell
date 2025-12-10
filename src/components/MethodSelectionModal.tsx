import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Method {
  id: string;
  nombre_metodo: string;
  descripcion?: string;
  duracion?: number;
}

interface MethodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: Method) => void;
  selectedMethod: Method | null;
}

// Datos de ejemplo - reemplaza con tus datos reales
const EXAMPLE_METHODS: Method[] = [
  {
    id: '1',
    nombre_metodo: 'Pomodoro',
    descripcion: '25 minutos de trabajo, 5 minutos de descanso',
    duracion: 25,
  },
  {
    id: '2',
    nombre_metodo: 'Flow Time',
    descripcion: 'Trabaja sin interrupciones hasta completar la tarea',
    duracion: 50,
  },
  {
    id: '3',
    nombre_metodo: '52/17',
    descripcion: '52 minutos de trabajo, 17 minutos de descanso',
    duracion: 52,
  },
];

export const MethodSelectionModal: React.FC<MethodSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedMethod,
}) => {
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
          <View style={styles.header}>
            <Text style={styles.title}>Seleccionar Método</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {EXAMPLE_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodItem,
                  selectedMethod?.id === method.id && styles.selectedMethod,
                ]}
                onPress={() => onSelect(method)}
              >
                <View style={styles.methodIcon}>
                  <Icon name="menu-book" size={24} color="#ffffff" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.nombre_metodo}</Text>
                  <Text style={styles.methodDescription}>
                    {method.descripcion}
                  </Text>
                  <Text style={styles.methodDuration}>
                    {method.duracion} minutos
                  </Text>
                </View>
                {selectedMethod?.id === method.id && (
                  <Icon name="check-circle" size={24} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
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
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.5)',
  },
  selectedMethod: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  methodDuration: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default MethodSelectionModal;