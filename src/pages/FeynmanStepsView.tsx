import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft,
  Clock,
  BookOpen,
  MessageSquare,
  Search,
  Lightbulb
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressCircle from '../ui/ProgressCircle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StudyMethod {
  id_metodo: number;
  titulo: string;
  descripcion: string;
  url_imagen?: string;
  color_hexa?: string;
}

const LOCAL_METHOD_ASSETS = {
  'Método Feynman': {
    color: '#FFD54F',
    image: ('../img/Feynman.png')
  }
};

const getFeynmanColorByProgress = (progress: number): string => {
  if (progress <= 20) return '#FFD54F';
  if (progress <= 40) return '#FFB74D';
  if (progress <= 60) return '#FF9800';
  if (progress <= 80) return '#F57C00';
  return '#22C55E';
};

const getFeynmanLabelByProgress = (progress: number): string => {
  if (progress === 20) return 'Paso 1/4';
  if (progress === 40) return 'Paso 2/4';
  if (progress === 60) return 'Paso 3/4';
  if (progress === 80) return 'Paso 4/4';
  if (progress === 100) return '¡Completado!';
  return 'Iniciando...';
};

const getFeynmanStatusByProgress = (progress: number): string => {
  if (progress < 100) return 'En_proceso';
  return 'Terminado';
};

export const FeynmanStepsView: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { methodId } = route.params as { methodId: string };

  const [method, setMethod] = useState<StudyMethod | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState<{ 
    id: string; 
    methodId: number; 
    id_metodo_realizado: number; 
    startTime: string; 
    progress: number; 
    status: string 
  } | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [showFinishLaterModal, setShowFinishLaterModal] = useState(false);

  const steps = [
    {
      id: 0,
      title: "1. Elegir y estudiar el tema",
      description: "Selecciona un concepto que quieres aprender y estúdialo a fondo desde fuentes confiables.",
      instruction: "Elige un tema específico y dedica tiempo a estudiarlo profundamente antes de pasar al siguiente paso.",
      icon: BookOpen
    },
    {
      id: 1,
      title: "2. Enseñarlo en palabras simples",
      description: "Explica el concepto como si lo enseñaras a alguien que no sabe nada sobre el tema.",
      instruction: "Escribe o habla como si explicaras a un niño. Usa lenguaje simple y evita jerga técnica.",
      icon: MessageSquare
    },
    {
      id: 2,
      title: "3. Identificar lagunas y aclarar",
      description: "Revisa tu explicación e identifica áreas donde tuviste dificultades o usaste términos complejos.",
      instruction: "Regresa a tus fuentes y llena las lagunas en tu comprensión.",
      icon: Search
    },
    {
      id: 3,
      title: "4. Simplificar y crear analogías",
      description: "Simplifica aún más tu explicación y crea analogías poderosas que hagan cristalino el concepto.",
      instruction: "Crea analogías memorables y simplifica ideas complejas en su forma más básica.",
      icon: Lightbulb
    },
  ];

  useEffect(() => {
    if (!methodId) {
      navigation.navigate('StudyMethods');
    }
  }, [methodId, navigation]);

  useEffect(() => {
    const fetchMethodData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockMethod: StudyMethod = {
          id_metodo: parseInt(methodId),
          titulo: 'Método Feynman',
          descripcion: 'Explica conceptos complejos en términos simples',
        };
        
        setMethod(mockMethod);
      } catch {
        setError('Error al cargar los datos del método');
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
      const mockSession = {
        id: 'session-' + Date.now(),
        methodId: parseInt(methodId),
        id_metodo_realizado: Date.now(),
        startTime: new Date().toISOString(),
        progress: 20,
        status: 'En_proceso'
      };
      
      setSessionData(mockSession);
      await AsyncStorage.setItem('activeMethodId', mockSession.id_metodo_realizado.toString());
      await AsyncStorage.setItem('feynman-session', JSON.stringify(mockSession));
      
      Alert.alert('Éxito', `Sesión de ${method?.titulo || 'Método Feynman'} iniciada correctamente`);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error', 'Error al iniciar la sesión del Método Feynman');
    }
  };

  const updateSessionProgress = async (progress: number, status: string = 'En_proceso') => {
    if (!sessionData) return;

    try {
      const updatedSession = {
        ...sessionData,
        progress,
        status
      };
      
      setSessionData(updatedSession);
      await AsyncStorage.setItem('feynman-session', JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
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

      const status = getFeynmanStatusByProgress(newProgress);
      await updateSessionProgress(newProgress, status);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      const fixedPercentages = [20, 40, 60, 80, 100];
      const newProgress = fixedPercentages[prevStepIndex];
      setProgressPercentage(newProgress);

      const status = getFeynmanStatusByProgress(newProgress);
      updateSessionProgress(newProgress, status);
    }
  };

  const finishMethod = async () => {
    setProgressPercentage(100);
    await updateSessionProgress(100, 'Terminado');
    
    await AsyncStorage.removeItem('feynman-session');
    await AsyncStorage.removeItem('activeMethodId');
    
    Alert.alert(
      '¡Completado!',
      `Sesión de ${method?.titulo || 'Método Feynman'} guardada`,
      [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
    );
  };

  const handleBack = () => {
    navigation.navigate('FeynmanIntro', { methodId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#171717', '#1a1a1a', '#171717']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FFD54F" />
          <Text style={styles.loadingText}>Cargando método...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !method) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#171717', '#1a1a1a', '#171717']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.errorContent}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar datos</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('StudyMethods')}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Volver a métodos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const localAssets = LOCAL_METHOD_ASSETS[method.titulo];
  const methodColor = localAssets?.color || '#FFD54F';
  const currentStepData = steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#171717', '#1a1a1a', '#171717']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: methodColor }]}>
            {method.titulo}
          </Text>
          
          {sessionData && currentStep >= 0 && (
            <TouchableOpacity
              style={styles.finishLaterButton}
              onPress={() => setShowFinishLaterModal(true)}
            >
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.finishLaterText}>Terminar método</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressSection}>
          <ProgressCircle
            percentage={progressPercentage}
            size={140}
            getTextByPercentage={getFeynmanLabelByProgress}
            getColorByPercentage={getFeynmanColorByProgress}
          />
          <Text style={styles.stepCounter}>
            Paso {currentStep + 1} de {steps.length}
          </Text>
        </View>

        <View style={styles.stepContainer}>
          <View style={[styles.stepCard, { borderColor: methodColor + '33' }]}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIcon, { backgroundColor: methodColor }]}>
                <currentStepData.icon size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepTitle, { color: methodColor }]}>
                {currentStepData.title}
              </Text>
            </View>
            
            <Text style={styles.stepDescription}>
              {currentStepData.description}
            </Text>

            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>
                {currentStepData.instruction}
              </Text>
            </View>

            {/* Tips based on step */}
            {currentStep === 0 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Tip:</Text> Elige un tema que realmente te interese aprender.
                </Text>
              </View>
            )}

            {currentStep === 1 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Recuerda:</Text> Si no puedes explicarlo simplemente, no lo entiendes lo suficientemente bien.
                </Text>
              </View>
            )}

            {currentStep === 2 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Tip:</Text> Sé honesto contigo mismo sobre tus lagunas de conocimiento.
                </Text>
              </View>
            )}

            {currentStep === 3 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Recuerda:</Text> Los grandes maestros crean analogías que perduran.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={prevStep}
              disabled={currentStep === 0}
            >
              <Text style={styles.navButtonText}>← Anterior</Text>
            </TouchableOpacity>

            <View style={styles.stepIndicators}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.stepIndicator,
                    {
                      backgroundColor: index === currentStep 
                        ? methodColor 
                        : index < currentStep 
                          ? '#6B7280' 
                          : '#374151'
                    }
                  ]}
                />
              ))}
            </View>

            {currentStep === steps.length - 1 ? (
              <TouchableOpacity
                style={[styles.navButton, styles.finishButton]}
                onPress={finishMethod}
              >
                <Text style={styles.navButtonText}>Finalizar método</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton, { backgroundColor: methodColor }]}
                onPress={nextStep}
              >
                <Text style={styles.navButtonText}>
                  {currentStep === 0 ? 'Comenzar' : 'Siguiente'} →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Finish Later Modal */}
      <Modal
        visible={showFinishLaterModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Terminar método?</Text>
            <Text style={styles.modalText}>
              Tu progreso actual se guardará para que puedas retomar esta sesión de {method?.titulo || 'Método Feynman'} más tarde.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowFinishLaterModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButtonPrimary, { backgroundColor: methodColor }]}
                onPress={async () => {
                  if (sessionData) {
                    await updateSessionProgress(progressPercentage, getFeynmanStatusByProgress(progressPercentage));
                  }
                  setShowFinishLaterModal(false);
                  navigation.navigate('Home');
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  scrollView: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(35, 35, 35, 0.8)',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  finishLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  finishLaterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 24,
  },
  stepCounter: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  stepContainer: {
    paddingHorizontal: 20,
  },
  stepCard: {
    backgroundColor: 'rgba(35, 35, 35, 0.9)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  stepDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    marginBottom: 16,
  },
  instructionCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  tipCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  tipText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  prevButton: {
    backgroundColor: '#4B5563',
  },
  nextButton: {
    backgroundColor: '#FFD54F',
  },
  finishButton: {
    backgroundColor: '#22C55E',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  stepIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#4B5563',
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonTextSecondary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default FeynmanStepsView;