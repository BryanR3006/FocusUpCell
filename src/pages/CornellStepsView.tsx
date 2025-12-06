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
  PenTool,
  CheckCircle,
  FileText,
  BookOpen
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
  'Método Cornell': {
    color: '#3B82F6',
    image: ('../img/Cornell.png')
  }
};

const getCornellColorByProgress = (progress: number): string => {
  if (progress <= 20) return '#3B82F6';
  if (progress <= 40) return '#2563EB';
  if (progress <= 60) return '#1D4ED8';
  if (progress <= 80) return '#1E40AF';
  return '#22C55E';
};

const STEPS = [
  {
    id: 0,
    title: "1. Tomar notas",
    description: "Divide tu página en secciones y toma notas detalladas del material.",
    instruction: "Dibuja líneas para dividir tu página: área principal (derecha), columna de palabras clave (izquierda), y sección de resumen (abajo). Toma notas detalladas en el área principal.",
    icon: PenTool
  },
  {
    id: 1,
    title: "2. Palabras clave",
    description: "Identifica las ideas principales y palabras clave más importantes.",
    instruction: "Revisa tus notas y escribe en la columna izquierda las palabras clave, preguntas o conceptos principales que capturen la esencia de cada sección.",
    icon: CheckCircle
  },
  {
    id: 2,
    title: "3. Resumen",
    description: "Redacta un resumen breve que capture los puntos más importantes.",
    instruction: "En la sección inferior, escribe un resumen de 3-5 frases que condense la información más importante de tus notas.",
    icon: FileText
  },
  {
    id: 3,
    title: "4. Revisión",
    description: "Usa las palabras clave para revisar y reforzar el aprendizaje.",
    instruction: "Cubre tus notas principales y usa solo las palabras clave para recordar la información. Haz preguntas basadas en las palabras clave para probar tu comprensión.",
    icon: BookOpen
  },
];

const getCornellLabelByProgress = (progress: number): string => {
  if (progress === 20) return 'Paso 1/4';
  if (progress === 40) return 'Paso 2/4';
  if (progress === 60) return 'Paso 3/4';
  if (progress === 80) return 'Paso 4/4';
  if (progress === 100) return '¡Completado!';
  return 'Iniciando...';
};

const getCornellStatusByProgress = (progress: number): string => {
  if (progress < 100) return 'En_proceso';
  return 'Terminado';
};

export const CornellStepsView: React.FC = () => {
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
          titulo: 'Método Cornell',
          descripcion: 'Organiza tus notas en secciones estructuradas',
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
      await AsyncStorage.setItem('cornell-session', JSON.stringify(mockSession));
      
      Alert.alert('Éxito', `Sesión de ${method?.titulo || 'Método Cornell'} iniciada correctamente`);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error', 'Error al iniciar la sesión del Método Cornell');
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
      await AsyncStorage.setItem('cornell-session', JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
    }
  };

  const nextStep = async () => {
    if (currentStep === 0 && !isResuming && !sessionData) {
      await startSession();
    }

    if (currentStep < STEPS.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      const newProgress = (nextStepIndex + 1) * 20;
      setProgressPercentage(newProgress);

      const status = getCornellStatusByProgress(newProgress);
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

      const status = getCornellStatusByProgress(newProgress);
      updateSessionProgress(newProgress, status);
    }
  };

  const finishMethod = async () => {
    setProgressPercentage(100);
    await updateSessionProgress(100, 'Terminado');
    
    await AsyncStorage.removeItem('cornell-session');
    await AsyncStorage.removeItem('activeMethodId');
    
    Alert.alert(
      '¡Completado!',
      `Sesión de ${method?.titulo || 'Método Cornell'} guardada`,
      [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
    );
  };

  const handleBack = () => {
    navigation.navigate('CornellIntro', { methodId });
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
          <ActivityIndicator size="large" color="#3B82F6" />
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
  const methodColor = localAssets?.color || '#3B82F6';
  const currentStepData = STEPS[currentStep];

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
          
          {sessionData && currentStep >= 1 && (
            <TouchableOpacity
              style={styles.finishLaterButton}
              onPress={() => setShowFinishLaterModal(true)}
            >
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.finishLaterText}>Terminar más tarde</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressSection}>
          <ProgressCircle
            percentage={progressPercentage}
            size={140}
            getTextByPercentage={getCornellLabelByProgress}
            getColorByPercentage={getCornellColorByProgress}
          />
          <Text style={styles.stepCounter}>
            Paso {currentStep + 1} de {STEPS.length}
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
                  💡 <Text style={styles.tipBold}>Tip:</Text> Reserva aproximadamente 1/3 de la página para palabras clave y 1/4 para el resumen.
                </Text>
              </View>
            )}

            {currentStep === 1 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Recuerda:</Text> Las palabras clave deben ser preguntas o conceptos que te permitan recordar la información principal.
                </Text>
              </View>
            )}

            {currentStep === 2 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Tip:</Text> El resumen debe ser conciso pero completo. Escribe como si explicaras el tema a alguien más.
                </Text>
              </View>
            )}

            {currentStep === 3 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Recuerda:</Text> Cubre tus notas y usa solo las palabras clave para recordar. Esto fortalece la memoria a largo plazo.
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
              {STEPS.map((_, index) => (
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

            {currentStep === STEPS.length - 1 ? (
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
            <Text style={styles.modalTitle}>¿Terminar más tarde?</Text>
            <Text style={styles.modalText}>
              Tu progreso actual se guardará para que puedas retomar esta sesión de {method?.titulo || 'Método Cornell'} más tarde.
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
                    await updateSessionProgress(progressPercentage, getCornellStatusByProgress(progressPercentage));
                  }
                  setShowFinishLaterModal(false);
                  navigation.navigate('Reports');
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
    backgroundColor: '#3B82F6',
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

export default CornellStepsView;