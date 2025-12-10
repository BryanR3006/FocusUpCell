import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

interface CountdownOverlayProps {
  isVisible: boolean;
  onCountdownComplete: () => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
  duration?: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  isVisible,
  onCountdownComplete,
  onCancel,
  title = 'Preparándote para la concentración',
  subtitle = 'Enfoca tu mente y prepárate para una sesión productiva',
  duration = 5,
}) => {
  const [count, setCount] = useState(duration);
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isVisible && count > 0) {
      const timer = setInterval(() => {
        setCount(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onCountdownComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isVisible, count, onCountdownComplete]);

  useEffect(() => {
    if (isVisible) {
      setCount(duration);
      
      // Animación de pulso
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isVisible, duration, scaleAnim]);

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.countdownContainer}>
            <Animated.View style={[styles.countdownCircle, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={styles.countdownText}>{count}</Text>
            </Animated.View>
            <Text style={styles.countdownLabel}>
              La sesión comenzará en...
            </Text>
          </View>

          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.tipText}>Ajusta tu postura</Text>
            </View>
            <View style={styles.tip}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.tipText}>Prepara tu espacio de trabajo</Text>
            </View>
            <View style={styles.tip}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.tipText}>Silencia notificaciones</Text>
            </View>
            <View style={styles.tip}>
              <Icon name="check-circle" size={20} color="#10b981" />
              <Text style={styles.tipText}>Respira profundamente</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Icon name="close" size={20} color="#ef4444" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 24,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  countdownLabel: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  tipsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#d1d5db',
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});

// Export como default también
export default CountdownOverlay;