import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CheckCircle, 
  RotateCcw, 
  BookOpen, 
  Brain, 
  ArrowLeft} from 'lucide-react-native';

// Assets locales - ajusta estas rutas según tu estructura
const LOCAL_METHOD_ASSETS = {
  'Práctica Activa': {
    color: '#43A047',
    image: ('../img/PracticaActiva.png')
  }
};

const API_ENDPOINTS = {
  STUDY_METHODS: '/study-methods'
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StudyMethod {
  id_metodo: number;
  nombre_metodo: string;
  descripcion: string;
  url_imagen?: string;
  color_hexa?: string;
  beneficios?: Array<{
    id_beneficio: number;
    descripcion_beneficio: string;
  }>;
}

export const ActiveRecallIntroView: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { methodId } = route.params as { methodId: string };

  const [method, setMethod] = useState<StudyMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    if (method && !loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [method, loading]);

  // Simular carga de datos - reemplaza con tu API real
  useEffect(() => {
    const fetchMethodData = async () => {
      try {
        setLoading(true);
        // Simular llamada API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockMethod: StudyMethod = {
          id_metodo: Number.parseInt(methodId),
          nombre_metodo: 'Práctica Activa',
          descripcion: 'Método de práctica activa para fortalecer la memoria',
          beneficios: [
            { id_beneficio: 1, descripcion_beneficio: 'Mejora la retención a largo plazo' },
            { id_beneficio: 2, descripcion_beneficio: 'Fortalece las conexiones neuronales' },
            { id_beneficio: 3, descripcion_beneficio: 'Identifica brechas en el conocimiento' },
            { id_beneficio: 4, descripcion_beneficio: 'Desarrolla confianza en el recuerdo' }
          ]
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

  const handleStartMethod = () => {
    navigation.navigate('ActiveRecallSteps', { methodId });
  };

  const handleBack = () => {
    navigation.navigate('StudyMethods');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#171717', '#1a1a1a', '#171717']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Background decorative elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.glowCircle, styles.glowCircle1]} />
          <View style={[styles.glowCircle, styles.glowCircle2]} />
          <View style={[styles.glowCircle, styles.glowCircle3]} />
        </View>

        <View style={styles.loadingContent}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#43A047" />
          </View>
          <Text style={styles.loadingTitle}>Cargando método...</Text>
          <Text style={styles.loadingSubtitle}>Preparando tu técnica de práctica activa</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !method) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#171717', '#1a1a1a', '#171717']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.backgroundElements}>
          <View style={[styles.glowCircle, styles.glowCircle1]} />
          <View style={[styles.glowCircle, styles.glowCircle2]} />
        </View>

        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorEmoji}>⚠️</Text>
            </View>
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>!</Text>
            </View>
          </View>
          
          <Text style={styles.errorTitle}>Error al cargar datos</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Volver a métodos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const localAssets = LOCAL_METHOD_ASSETS[method.nombre_metodo];
  const methodColor = localAssets?.color || '#43A047';
  const methodImage = localAssets?.image;

  const steps = [
    {
      icon: Brain,
      title: '1. Intento inicial de recuerdo',
      description: 'Intenta recuperar conceptos sin mirar tus notas. Este esfuerzo inicial fortalece las conexiones neuronales en tu cerebro.',
      color: '#43A047'
    },
    {
      icon: CheckCircle,
      title: '2. Comparar con notas',
      description: 'Compara tu recuerdo con las notas. Identifica errores o puntos faltantes para corregir y completar tu comprensión.',
      color: '#10B981'
    },
    {
      icon: RotateCcw,
      title: '3. Segunda sesión de recuerdo',
      description: 'Intenta un segundo recuerdo, idealmente verbalizando o resumiendo. La práctica repetida consolida el aprendizaje.',
      color: '#0D9488'
    },
    {
      icon: BookOpen,
      title: '4. Sesión final de recuerdo',
      description: 'Sesión final de recuerdo para confirmar la retención a largo plazo. Evalúa cuánto has mejorado tu memoria.',
      color: '#0891B2'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#171717', '#1a1a1a', '#171717']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Background decorative elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.glowCircle, styles.glowCircle1]} />
        <View style={[styles.glowCircle, styles.glowCircle2]} />
        <View style={[styles.glowCircle, styles.glowCircle3]} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Práctica Activa</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Hero Section */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(67, 160, 71, 0.2)', 'rgba(16, 185, 129, 0.2)']}
            style={styles.heroGlow}
          />
          
          <View style={styles.heroContent}>
            <View style={styles.methodBadge}>
              <Brain size={20} color="#43A047" />
              <Text style={styles.methodBadgeText}>Práctica Activa</Text>
            </View>

            <View style={styles.methodImageContainer}>
              {methodImage ? (
                <Image
                  source={methodImage}
                  style={styles.methodImage}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(false)}
                />
              ) : (
                <View style={[styles.methodImage, styles.methodImageFallback]}>
                  <Text style={styles.methodEmoji}>🧠</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroTitle}>Fortalece tu Memoria</Text>
            
            <Text style={styles.heroDescription}>
              Practica la recuperación de información sin mirar tus notas para fortalecer la memoria
              y profundizar la comprensión de manera efectiva.
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureTag}>
                <View style={[styles.featureDot, { backgroundColor: '#43A047' }]} />
                <Text style={styles.featureText}>Memoria Mejorada</Text>
              </View>
              <View style={styles.featureTag}>
                <View style={[styles.featureDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.featureText}>Comprensión Profunda</Text>
              </View>
              <View style={styles.featureTag}>
                <View style={[styles.featureDot, { backgroundColor: '#0D9488' }]} />
                <Text style={styles.featureText}>Retención Duradera</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* How it works section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>¿Cómo Funciona la Práctica Activa?</Text>
            <Text style={styles.sectionSubtitle}>
              Un proceso sistemático para fortalecer tu memoria y comprensión
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <LinearGradient
                    colors={[step.color, `${step.color}DD`]}
                    style={styles.stepIconContainer}
                  >
                    <step.icon size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.stepTitle, { color: step.color }]}>
                    {step.title}
                  </Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Benefits section */}
        {method.beneficios && method.beneficios.length > 0 && (
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Beneficios de la Práctica Activa</Text>
              <Text style={styles.sectionSubtitle}>
                Descubre cómo esta técnica transforma tu capacidad de aprendizaje
              </Text>
            </View>

            <View style={styles.benefitsGrid}>
              {method.beneficios.map((beneficio, index) => (
                <View key={beneficio.id_beneficio} style={styles.benefitCard}>
                  <View style={styles.benefitNumber}>
                    <Text style={styles.benefitNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.benefitText}>
                    {beneficio.descripcion_beneficio}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Action button */}
        <Animated.View 
          style={[
            styles.actionSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: methodColor }]}
            onPress={handleStartMethod}
          >
            <Text style={styles.startButtonText}>Comenzar Práctica Activa</Text>
            <ArrowLeft 
              size={20} 
              color="#FFFFFF" 
              style={{ transform: [{ rotate: '180deg' }] }} 
            />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  glowCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  glowCircle1: {
    top: 80,
    left: 40,
    width: 320,
    height: 320,
    backgroundColor: '#43A047',
    opacity: 0.08,
  },
  glowCircle2: {
    bottom: 80,
    right: 40,
    width: 384,
    height: 384,
    backgroundColor: '#10B981',
    opacity: 0.06,
  },
  glowCircle3: {
    top: '50%',
    left: '50%',
    marginLeft: -144,
    marginTop: -144,
    width: 288,
    height: 288,
    backgroundColor: '#0D9488',
    opacity: 0.05,
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  spinnerContainer: {
    marginBottom: 32,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 400,
  },
  errorIconContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  errorIcon: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorEmoji: {
    fontSize: 40,
  },
  errorBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(35, 35, 35, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.6)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 48,
  },
  heroSection: {
    marginHorizontal: 24,
    marginBottom: 48,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  heroContent: {
    padding: 32,
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 160, 71, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(67, 160, 71, 0.3)',
    marginBottom: 32,
  },
  methodBadgeText: {
    color: '#43A047',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  methodImageContainer: {
    marginBottom: 32,
  },
  methodImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
  },
  methodImageFallback: {
    backgroundColor: 'rgba(67, 160, 71, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(67, 160, 71, 0.3)',
  },
  methodEmoji: {
    fontSize: 48,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  heroDescription: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  featureText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 48,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: 'rgba(35, 35, 35, 0.9)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 24,
  },
  stepDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 24,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitCard: {
    backgroundColor: 'rgba(35, 35, 35, 0.9)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(67, 160, 71, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#43A047',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  benefitNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 24,
    flex: 1,
  },
  actionSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#43A047',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActiveRecallIntroView;