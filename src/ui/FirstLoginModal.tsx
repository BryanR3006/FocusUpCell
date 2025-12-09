import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';

interface FirstLoginModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  isOpen,
  onAccept,
  onDecline,
}) => {
  // Manejar tecla Escape (solo para web, en móvil manejamos con botón de atrás)
  useEffect(() => {
    if (!isOpen) return;
    
    // Aquí podrías manejar el botón de atrás físico en Android si lo necesitas
    // Por ahora, solo usamos el botón de cerrar en la UI
    
    return () => {
      // Cleanup si es necesario
    };
  }, [isOpen]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onDecline} // Para botón de atrás en Android
    >
      {/* Fondo con blur */}
      <View style={styles.overlay}>
        <View style={styles.blurBackground} />
        
        {/* Contenido del modal */}
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            
            {/* Botón de cerrar */}
            <TouchableOpacity
              onPress={onDecline}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/img/Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Contenido */}
            <View style={styles.content}>
              <Text style={styles.title}>
                ¡Bienvenido a Focus Up!
              </Text>
              <Text style={styles.description}>
                Para ofrecerte una mejor experiencia, nos gustaría conocerte un poco más.
                ¿Te gustaría completar tu perfil con información adicional?
              </Text>

              {/* Botones de acción */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  onPress={onAccept}
                  style={styles.acceptButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acceptButtonText}>De acuerdo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={onDecline}
                  style={styles.declineButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.declineButtonText}>No, gracias</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#232323',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 192,
    height: 67,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#D1D5DB',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  acceptButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#4B5563',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});