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
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Clock,
  Settings,
  ArrowLeft,
  Brain,
  CheckCircle,
  RotateCcw,
  BookOpen,
  Timer as TimerIcon,
  AlertCircle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProgressCircle from '../ui/ProgressCircle';
import FinishLaterModal from '../ui/FinishLaterModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StudyMethod {
  id_metodo: number;
  titulo: string;
  descripcion: string;
  url_imagen?: string;
  color_hexa?: string;
}

interface ActiveRecallConfig {
  step1Time: number;
  step3Time: number;
  step4Time: number;
}

const LOCAL_METHOD_ASSETS = {
  'Práctica Activa': {
    color: '#43A047',
    image: ('../img/PracticaActiva.png')
  }
};

// Funciones de utilidad para el progreso
const getActiveRecallColorByProgress = (progress: number): string => {
  if (progress <= 20) return '#43A047';
  if (progress <= 40) return '#10B981';
  if (progress <= 60) return '#0D9488';
  if (progress <= 80) return '#0891B2';
  return '#22C55E';
};

const getActiveRecallLabelByProgress = (progress: number): string => {
  if (progress === 20) return 'Paso 1/4';
  if (progress === 40) return 'Paso 2/4';
  if (progress === 60) return 'Paso 3/4';
  if (progress === 80) return 'Paso 4/4';
  if (progress === 100) return '¡Completado!';
  return 'Iniciando...';
};

const getActiveRecallStatusByProgress = (progress: number): string => {
  if (progress < 100) return 'En_proceso';
  return 'Terminado';
};

export const ActiveRecallStepsView: React.FC = () => {
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
  const [config, setConfig] = useState<ActiveRecallConfig>({ 
    step1Time: 5, 
    step3Time: 10, 
    step4Time: 15 
  });
  const [isResuming, setIsResuming] = useState(false);
  const [showFinishLaterModal, setShowFinishLaterModal] = useState(false);
  const [showTimerConfigModal, setShowTimerConfigModal] = useState(false);
  const [tempConfig, setTempConfig] = useState<ActiveRecallConfig>(config);
  const [timerKey, setTimerKey] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const steps = [
    {
      id: 0,
      title: "1. Intento inicial de recuerdo",
      description: "Intenta recuperar conceptos sin mirar tus notas.",
      instruction: "Toma 5-10 minutos para recordar tanta información como sea posible sin referirte a tus notas.",
      hasTimer: true,
      timerMinutes: config.step1Time,
    },
    {
      id: 1,
      title: "2. Comparar con notas",
      description: "Compara tu recuerdo con las notas. Identifica errores o puntos faltantes.",
      instruction: "Revisa tus notas y compáralas con lo que recordaste. Nota cualquier brecha o inexactitud.",
      hasTimer: false,
    },
    {
      id: 2,
      title: "3. Segunda sesión de recuerdo",
      description: "Intenta un segundo recuerdo, idealmente verbalizando o resumiendo.",
      instruction: "Intenta recordar la información nuevamente, esta vez verbalizando o resumiendo los conceptos.",
      hasTimer: true,
      timerMinutes: config.step3Time,
    },
    {
      id: 3,
      title: "4. Sesión final de recuerdo",
      description: "Sesión final de recuerdo para confirmar la retención a largo plazo.",
      instruction: "Realiza un intento final de recuerdo para reforzar la información en tu memoria a largo plazo.",
      hasTimer: true,
      timerMinutes: config.step4Time,
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
        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockMethod: StudyMethod = {
          id_metodo: parseInt(methodId),
          titulo: 'Práctica Activa',
          descripcion: 'Método de práctica activa para fortalecer la memoria',
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

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('active-recall-config');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          setConfig(parsedConfig);
          setTempConfig(parsedConfig);
        }
      } catch (e) {
        console.error('Error loading config:', e);
      }
    };

    loadConfig();
  }, []);

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
      // Simular inicio de sesión
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
      await AsyncStorage.setItem('active-recall-session', JSON.stringify(mockSession));
      
      Alert.alert('Éxito', `Sesión de ${method?.titulo || 'Práctica Activa'} iniciada correctamente`);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      Alert.alert('Error', 'Error al iniciar la sesión de Práctica Activa');
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
      await AsyncStorage.setItem('active-recall-session', JSON.stringify(updatedSession));
      
      console.log('Progreso actualizado:', progress, status);
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
    }
  };

  const completeStep = async () => {
    if (currentStep === 0 && !isResuming && !sessionData) {
      await startSession();
    }

    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      const newProgress = (nextStepIndex + 1) * 20;
      setProgressPercentage(newProgress);

      const status = getActiveRecallStatusByProgress(newProgress);
      await updateSessionProgress(newProgress, status);
    }
  };

  const finishMethod = async () => {
    setProgressPercentage(100);
    await updateSessionProgress(100, 'Terminado');
    
    await AsyncStorage.removeItem('active-recall-session');
    await AsyncStorage.removeItem('activeMethodId');
    
    Alert.alert(
      '¡Completado!',
      `Sesión de ${method?.titulo || 'Método Práctica Activa'} guardada`,
      [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
    );
  };

  const handleBack = () => {
    navigation.navigate('ActiveRecallIntro', { methodId });
  };

  const startTimer = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setTimerRunning(true);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      Alert.alert('¡Tiempo terminado!', 'El temporizador ha finalizado');
    }
    
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#171717', '#1a1a1a', '#171717']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#43A047" />
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
          <AlertCircle size={64} color="#EF4444" />
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
  const methodColor = localAssets?.color || '#43A047';
  const currentStepData = steps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#171717', '#1a1a1a', '#171717']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
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
          
          {sessionData && currentStep >= 2 && (
            <TouchableOpacity
              style={styles.finishLaterButton}
              onPress={() => setShowFinishLaterModal(true)}
            >
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.finishLaterText}>Terminar más tarde</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <ProgressCircle
            percentage={progressPercentage}
            size={140}
            getTextByPercentage={getActiveRecallLabelByProgress}
            getColorByPercentage={getActiveRecallColorByProgress}
          />
          <Text style={styles.stepCounter}>
            Paso {currentStep + 1} de {steps.length}
          </Text>
        </View>

        {/* Current Step */}
        <View style={styles.stepContainer}>
          <View style={[styles.stepCard, { borderColor: methodColor + '33' }]}>
            <Text style={[styles.stepTitle, { color: methodColor }]}>
              {currentStepData.title}
            </Text>
            
            <Text style={styles.stepDescription}>
              {currentStepData.description}
            </Text>

            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>
                {currentStepData.instruction}
              </Text>
            </View>

            {/* Tips based on step */}
            {(currentStep === 2 || currentStep === 3) && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  ⏱️ <Text style={styles.tipBold}>Nota:</Text> El temporizador puede usarse como tiempo de memorización dedicado.
                </Text>
              </View>
            )}

            {currentStep === 0 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Tip:</Text> Evita mirar tus notas durante los intentos de recuerdo.
                </Text>
              </View>
            )}

            {currentStep === 1 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Recuerda:</Text> Explica conceptos verbalmente para reforzar la retención.
                </Text>
              </View>
            )}

            {currentStep === 2 && (
              <View style={[styles.tipCard, { borderLeftColor: methodColor }]}>
                <Text style={styles.tipText}>
                  💡 <Text style={styles.tipBold}>Tip:</Text> Repite el recuerdo incluso si te sientes confiado.
                </Text>
              </View>
            )}

            {/* Timer if applicable */}
            {currentStepData.hasTimer && (
              <View style={styles.timerContainer}>
                <View style={styles.timerHeader}>
                  <Text style={styles.timerTitle}>Temporizador de estudio</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setTempConfig(config);
                      setShowTimerConfigModal(true);
                    }}
                    style={styles.configButton}
                  >
                    <Settings size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.timerDisplay}>
                  <TimerIcon size={24} color={methodColor} />
                  <Text style={[styles.timerText, { color: methodColor }]}>
                    {formatTime(timeLeft || currentStepData.timerMinutes! * 60)}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.timerControlButton, { backgroundColor: methodColor }]}
                    onPress={() => startTimer(currentStepData.timerMinutes!)}
                  >
                    <Text style={styles.timerControlText}>
                      {timerRunning ? 'Reiniciar' : 'Iniciar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Step Navigation */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => {
                if (currentStep > 0) {
                  const prevStepIndex = currentStep - 1;
                  setCurrentStep(prevStepIndex);
                  const fixedPercentages = [20, 40, 60, 80, 100];
                  const newProgress = fixedPercentages[prevStepIndex];
                  setProgressPercentage(newProgress);
                  updateSessionProgress(newProgress, getActiveRecallStatusByProgress(newProgress));
                }
              }}
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
                onPress={completeStep}
              >
                <Text style={styles.navButtonText}>Siguiente →</Text>
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
              Tu progreso actual se guardará para que puedas retomar esta sesión de {method?.titulo || 'Práctica Activa'} más tarde.
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
                    await updateSessionProgress(progressPercentage, getActiveRecallStatusByProgress(progressPercentage));
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

      {/* Timer Configuration Modal */}
      <Modal
        visible={showTimerConfigModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#232323' }]}>
            <Text style={styles.modalTitle}>Configurar Temporizador</Text>
            
            <View style={styles.configInputContainer}>
              <View style={styles.configInputGroup}>
                <Text style={styles.configLabel}>Paso 1 - Intento inicial de recuerdo:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.configInput}
                    value={tempConfig.step1Time.toString()}
                    onChangeText={(text) => {
                      const newTime = Math.max(1, Math.min(60, parseInt(text) || 1));
                      setTempConfig(prev => ({ ...prev, step1Time: newTime }));
                    }}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor="#6B7280"
                  />
                  <Text style={styles.inputUnit}>minutos</Text>
                </View>
              </View>

              <View style={styles.configInputGroup}>
                <Text style={styles.configLabel}>Paso 3 - Segunda sesión de recuerdo:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.configInput}
                    value={tempConfig.step3Time.toString()}
                    onChangeText={(text) => {
                      const newTime = Math.max(1, Math.min(60, parseInt(text) || 1));
                      setTempConfig(prev => ({ ...prev, step3Time: newTime }));
                    }}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#6B7280"
                  />
                  <Text style={styles.inputUnit}>minutos</Text>
                </View>
              </View>

              <View style={styles.configInputGroup}>
                <Text style={styles.configLabel}>Paso 4 - Sesión final de recuerdo:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.configInput}
                    value={tempConfig.step4Time.toString()}
                    onChangeText={(text) => {
                      const newTime = Math.max(1, Math.min(60, parseInt(text) || 1));
                      setTempConfig(prev => ({ ...prev, step4Time: newTime }));
                    }}
                    keyboardType="numeric"
                    placeholder="15"
                    placeholderTextColor="#6B7280"
                  />
                  <Text style={styles.inputUnit}>minutos</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowTimerConfigModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButtonPrimary, { backgroundColor: methodColor }]}
                onPress={async () => {
                  setConfig(tempConfig);
                  await AsyncStorage.setItem('active-recall-config', JSON.stringify(tempConfig));
                  setShowTimerConfigModal(false);
                  setTimerKey(prev => prev + 1); // Force timer refresh
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Aplicar</Text>
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
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 24,
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
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
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
  timerContainer: {
    marginTop: 16,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  configButton: {
    padding: 4,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    padding: 16,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timerControlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timerControlText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#43A047',
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
  configInputContainer: {
    gap: 20,
    marginBottom: 24,
  },
  configInputGroup: {
    gap: 8,
  },
  configLabel: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 16,
    minWidth: 80,
  },
  inputUnit: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default ActiveRecallStepsView;