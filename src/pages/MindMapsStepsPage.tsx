import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiClient } from '../clientes/apiClient';
import { 
  ArrowLeft, 
  Clock,
  CheckCircle,
  Target,
  Sprout,
  Palette,
  Link,
  Monitor
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Colores para la temática de mapas mentales
const COLORS = {
  primary: '#10B981',
  secondary: '#059669',
  accent: '#34D399',
  background: '#0F172A',
  card: '#1E293B',
  surface: '#334155',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  error: '#EF4444',
  success: '#22C55E',
};

interface StudyMethod {
  id_metodo: number;
  titulo: string;
  descripcion: string;
  url_imagen?: string;
  color_hexa?: string;
}

interface SessionData {
  id: string;
  methodId: number;
  id_metodo_realizado: number;
  startTime: string;
  progress: number;
  status: string;
}

// Componente de círculo de progreso
const ProgressCircle = ({ percentage, size = 140 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getProgressColor = (progress: number) => {
    if (progress < 30) return COLORS.error;
    if (progress < 70) return COLORS.accent;
    return COLORS.success;
  };

  const getProgressLabel = (progress: number) => {
    if (progress === 20) return 'Tema elegido';
    if (progress === 40) return 'Ramas creadas';
    if (progress === 60) return 'Colores añadidos';
    if (progress === 80) return 'Conceptos conectados';
    if (progress === 100) return 'Completado';
    return `${progress}%`;
  };

  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressCircle, { width: size, height: size }]}>
        <View style={styles.progressBackground} />
        <View
          style={[
            styles.progressFill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: getProgressColor(percentage),
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressPercentage}>{percentage}%</Text>
          <Text style={styles.progressLabel}>{getProgressLabel(percentage)}</Text>
        </View>
      </View>
    </View>
  );
};

// Modal para terminar más tarde
const FinishLaterModal = ({ visible, onConfirm, onCancel, methodName }) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>¿Terminar método?</Text>
        <Text style={styles.modalMessage}>
          Tu progreso en {methodName} se guardará y podrás retomarlo más tarde desde la sección de reportes.
        </Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.modalCancelButton} onPress={onCancel}>
            <Text style={styles.modalCancelText}>Continuar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalConfirmButton} onPress={onConfirm}>
            <Text style={styles.modalConfirmText}>Guardar y salir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const MindMapsStepsPage: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { methodId } = route.params as { methodId: string };

  const [method, setMethod] = useState<StudyMethod | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [showFinishLaterModal, setShowFinishLaterModal] = useState(false);

  // Pasos del método Mapas Mentales
  const steps = [
    {
      id: 0,
      title: "1. Elige un tema central 🗺️",
      description: "Selecciona el tema principal que quieres estudiar y escríbelo en el centro de tu hoja o lienzo digital.",
      instruction: "Elige un tema específico y escribe la palabra o frase principal en el centro de tu mapa.",
      icon: Target,
    },
    {
      id: 1,
      title: "2. Crea ramas principales 🌿",
      description: "Dibuja líneas desde el centro hacia afuera para las ideas principales relacionadas con el tema.",
      instruction: "Identifica 3-5 ideas principales y dibuja ramas desde el centro hacia afuera.",
      icon: Sprout,
    },
    {
      id: 2,
      title: "3. Añade colores y símbolos 🎨",
      description: "Utiliza colores, símbolos, dibujos e imágenes para conectar conceptos y hacer el mapa más memorable.",
      instruction: "Asigna colores diferentes a cada rama y añade símbolos o dibujos relacionados con cada idea.",
      icon: Palette,
    },
    {
      id: 3,
      title: "4. Revisa y conecta conceptos 🔗",
      description: "Revisa tu mapa, añade conexiones entre ideas relacionadas y completa cualquier rama faltante.",
      instruction: "Busca conexiones entre diferentes ramas y añade líneas o flechas para mostrar relaciones.",
      icon: Link,
    },
    {
      id: 4,
      title: "5. Herramientas digitales 💻",
      description: "Si prefieres trabajar digitalmente, prueba aplicaciones especializadas en mapas mentales.",
      instruction: "Considera usar MindMeister, Coggle, Miro o XMind para crear mapas mentales digitales.",
      icon: Monitor,
    },
  ];

  // Obtener datos del método
  useEffect(() => {
    const fetchMethodData = async () => {
      try {
        setLoading(true);
        setError('');

        // Simular carga de datos (en una app real, aquí iría la llamada a la API)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockMethod: StudyMethod = {
          id_metodo: parseInt(methodId),
          titulo: 'Mapas Mentales',
          descripcion: 'Método de organización visual de información',
          color_hexa: COLORS.primary,
        };

        setMethod(mockMethod);

        // Simular reanudación de sesión si es necesario
        const savedProgress = 20; // Ejemplo: 20% de progreso guardado
        if (savedProgress > 0) {
          setIsResuming(true);
          const step = getStepFromProgress(savedProgress);
          setCurrentStep(step);
          setProgressPercentage(savedProgress);
        }
      } catch (err) {
        setError('Error al cargar los datos del método');
        console.error('Error fetching method data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (methodId) {
      fetchMethodData();
    }
  }, [methodId]);

  const getStepFromProgress = (progress: number): number => {
    if (progress === 20) return 0;
    if (progress === 40) return 1;
    if (progress === 60) return 2;
    if (progress === 80) return 3;
    if (progress === 100) return 4;
    if (progress < 30) return 0;
    if (progress < 50) return 1;
    if (progress < 70) return 2;
    if (progress < 90) return 3;
    return 4;
  };

  const startSession = async () => {
    try {
      // En una app real, aquí iría la llamada a la API para iniciar sesión
      const mockSession: SessionData = {
        id: 'session-' + Date.now(),
        methodId: parseInt(methodId),
        id_metodo_realizado: 1,
        startTime: new Date().toISOString(),
        progress: 20,
        status: 'En_proceso'
      };

      setSessionData(mockSession);
      Alert.alert('Éxito', `Sesión de ${method?.titulo || 'Mapas Mentales'} iniciada correctamente`);
    } catch (error) {
      console.error('Error starting session:', error);
      Alert.alert('Error', 'Error al iniciar la sesión de Mapas Mentales');
    }
  };

  const updateSessionProgress = async (progress: number, status: string = 'En_proceso') => {
    try {
      // En una app real, aquí iría la llamada a la API para actualizar progreso
      console.log('Updating progress:', progress, status);
      
      if (sessionData) {
        setSessionData(prev => prev ? { ...prev, progress, status } : null);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const nextStep = async () => {
    if (currentStep === 0 && !isResuming && !sessionData) {
      await startSession();
    }

    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      const newProgress = (nextStepIndex + 1) * 20;
      setProgressPercentage(newProgress);

      const status = newProgress === 100 ? 'Terminado' : 'En_proceso';
      updateSessionProgress(newProgress, status);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      const fixedPercentages = [20, 40, 60, 80, 100];
      const newProgress = fixedPercentages[prevStepIndex];
      setProgressPercentage(newProgress);

      updateSessionProgress(newProgress, 'En_proceso');
    }
  };

  const finishMethod = async () => {
    setProgressPercentage(100);
    await updateSessionProgress(100, 'Terminado');
    
    Alert.alert(
      '¡Completado!',
      `Sesión de ${method?.titulo || 'Mapas Mentales'} guardada correctamente`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home' as never),
        },
      ]
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleFinishLater = async () => {
    // Guardar progreso actual antes de salir
    if (sessionData) {
      await updateSessionProgress(progressPercentage, 'En_proceso');
    }
    setShowFinishLaterModal(false);
    navigation.navigate('Home' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTitle}>Cargando método...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !method) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar datos</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={20} color="#fff" />
            <Text style={styles.backButtonText}>Volver a métodos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{method.titulo}</Text>
        {sessionData && currentStep >= 0 && (
          <TouchableOpacity
            style={styles.finishLaterButton}
            onPress={() => setShowFinishLaterModal(true)}
          >
            <Clock size={16} color="#fff" />
            <Text style={styles.finishLaterText}>Terminar método</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Indicador de progreso */}
        <View style={styles.progressSection}>
          <ProgressCircle percentage={progressPercentage} />
          <Text style={styles.stepCounter}>
            Paso {currentStep + 1} de {steps.length}
          </Text>
        </View>

        {/* Paso actual */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepIcon, { backgroundColor: `${COLORS.primary}20` }]}>
              <StepIcon size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          </View>
          
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>

          {/* Instrucción específica */}
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>{currentStepData.instruction}</Text>
          </View>

          {/* Consejos adicionales */}
          {currentStep === 2 && (
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Tip:</Text> Usa colores para categorizar información. Por ejemplo: azul para conceptos, verde para ejemplos, rojo para ideas importantes.
              </Text>
            </View>
          )}

          {currentStep === 4 && (
            <View style={styles.tipCard}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Herramientas recomendadas:</Text> MindMeister, Coggle, Miro, XMind, FreeMind
              </Text>
            </View>
          )}
        </View>

        {/* Navegación */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity 
            style={[
              styles.navButton,
              styles.prevButton,
              currentStep === 0 && styles.disabledButton
            ]}
            onPress={prevStep}
            disabled={currentStep === 0}
          >
            <Text style={[
              styles.navButtonText,
              styles.prevButtonText
            ]}>← Anterior</Text>
          </TouchableOpacity>

          {/* Indicadores de paso */}
          <View style={styles.stepIndicators}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepIndicator,
                  index === currentStep && [styles.stepIndicatorActive, { backgroundColor: COLORS.primary }],
                  index < currentStep && styles.stepIndicatorCompleted,
                ]}
              />
            ))}
          </View>

          {currentStep === steps.length - 1 ? (
            <TouchableOpacity 
              style={[styles.navButton, styles.finishButton]}
              onPress={finishMethod}
            >
              <CheckCircle size={20} color="#fff" />
              <Text style={[styles.navButtonText, styles.finishButtonText]}>Terminar método</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.navButton, styles.nextButton]}
              onPress={nextStep}
            >
              <Text style={[styles.navButtonText, styles.nextButtonText]}>Siguiente →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recordatorio final */}
        <View style={styles.reminderCard}>
          <Text style={styles.reminderEmoji}>✏️</Text>
          <Text style={styles.reminderText}>
            <Text style={styles.reminderBold}>Recuerda:</Text> Crear el mapa mental manualmente mejora significativamente la retención de información. El proceso de dibujar y organizar ideas fortalece las conexiones neuronales en tu cerebro.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal Terminar más tarde */}
      <FinishLaterModal
        visible={showFinishLaterModal}
        methodName={method.titulo}
        onConfirm={handleFinishLater}
        onCancel={() => setShowFinishLaterModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  finishLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  finishLaterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 70,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    position: 'absolute',
    borderWidth: 8,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  progressTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  stepCounter: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  stepCard: {
    backgroundColor: 'rgba(35, 35, 35, 0.9)',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  stepDescription: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  instructionCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    alignItems: 'flex-start',
  },
  tipEmoji: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  prevButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
  },
  finishButton: {
    backgroundColor: COLORS.success,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  prevButtonText: {
    color: COLORS.textPrimary,
  },
  nextButtonText: {
    color: '#fff',
  },
  finishButtonText: {
    color: '#fff',
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  stepIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepIndicatorActive: {
    backgroundColor: COLORS.primary,
  },
  stepIndicatorCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(35, 35, 35, 0.9)',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'flex-start',
  },
  reminderEmoji: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  reminderBold: {
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MindMapsStepsPage;