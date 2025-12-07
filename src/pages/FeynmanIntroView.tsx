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
  Easing,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BookOpen, 
  MessageSquare, 
  Search, 
  Lightbulb,
  ArrowLeft,
  AlertCircle
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LOCAL_METHOD_ASSETS = {
  'Método Feynman': {
    color: '#FFD54F',
    image: ('../img/Feynman.png')
  }
};

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

export const FeynmanIntroView: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { methodId } = route.params as { methodId: string };

  const [method, setMethod] = useState<StudyMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    if (method && !loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
        })
      ]).start();
    }
  }, [method, loading]);

  useEffect(() => {
    const fetchMethodData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockMethod: StudyMethod = {
          id_metodo: parseInt(methodId),
          nombre_metodo: 'Método Feynman',
          descripcion: 'Explica conceptos complejos en términos simples',
          beneficios: [
            { id_beneficio: 1, descripcion_beneficio: 'Identifica lagunas en tu comprensión' },
            { id_beneficio: 2, descripcion_beneficio: 'Fortalece la comprensión profunda' },
            { id_beneficio: 3, descripcion_beneficio: 'Desarrolla habilidades de enseñanza' },
            { id_beneficio: 4, descripcion_beneficio: 'Mejora la retención a largo plazo' }
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
    navigation.navigate('FeynmanSteps', { methodId });
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
        
        <View style={styles.backgroundElements}>
          <View style={[styles.glowCircle, styles.glowCircle1]} />
          <View style={[styles.glowCircle, styles.glowCircle2]} />
          <View style={[styles.glowCircle, styles.glowCircle3]} />
        </View>

        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FFD54F" />
          <Text style={styles.loadingTitle}>Cargando método...</Text>
          <Text style={styles.loadingSubtitle}>Preparando el método Feynman</Text>
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
        
        <View style={styles.errorContent}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>⚠️</Text>
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
  const methodColor = localAssets?.color || '#FFD54F';

  const steps = [
    {
      icon: BookOpen,
      title: '1. Elegir y estudiar el tema',
      description: 'Selecciona un concepto que quieres aprender y estúdialo a fondo desde fuentes confiables.',
      color: '#FFD54F'
    },
    {
      icon: MessageSquare,
      title: '2. Enseñarlo en palabras simples',
      description: 'Explica el concepto como si lo enseñaras a alguien que no sabe nada sobre el tema.',
      color: '#FFB74D'
    },
    {
      icon: Search,
      title: '3. Identificar lagunas y aclarar',
      description: 'Revisa tu explicación e identifica áreas donde tuviste dificultades o usaste términos complejos.',
      color: '#FF9800'
    },
    {
      icon: Lightbulb,
      title: '4. Simplificar y crear analogías',
      description: 'Simplifica aún más tu explicación y crea analogías poderosas que hagan cristalino el concepto.',
      color: '#F57C00'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#171717', '#1a1a1a', '#171717']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.headerTitleText}>Método Feynman</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </Animated.View>

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
            colors={['rgba(255, 213, 79, 0.2)', 'rgba(255, 183, 77, 0.2)']}
            style={styles.heroGlow}
          />
          
          <View style={styles.heroContent}>
            <View style={[styles.methodBadge, { backgroundColor: 'rgba(255, 213, 79, 0.2)', borderColor: 'rgba(255, 213, 79, 0.3)' }]}>
              <Lightbulb size={20} color="#FFD54F" />
              <Text style={[styles.methodBadgeText, { color: '#FFD54F' }]}>Método Feynman</Text>
            </View>

            <View style={styles.methodImageContainer}>
              <View style={[styles.methodImage, styles.methodImageFallback, { backgroundColor: 'rgba(255, 213, 79, 0.2)', borderColor: 'rgba(255, 213, 79, 0.3)' }]}>
                <Text style={styles.methodEmoji}>🎓</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Aprende Enseñando</Text>
            
            <Text style={styles.heroDescription}>
              Explica conceptos complejos en términos simples para identificar lagunas
              en tu comprensión y fortalecer tu conocimiento de manera profunda.
            </Text>

            <View style={styles.featuresContainer}>
              <View style={styles.featureTag}>
                <View style={[styles.featureDot, { backgroundColor: '#FFD54F' }]} />
                <Text style={styles.featureText}>Comprensión Profunda</Text>
              </View>
              <View style={styles.featureTag}>
                <View style={[styles.featureDot, { backgroundColor: '#FFB74D' }]} />
                <Text style={styles.featureText}>Identifica Lagunas</Text>
              </View>
              <View style={styles.featureTag}>
                <View style={[styles.featureDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.featureText}>Conocimiento Sólido</Text>
              </View>
            </View>
          </View>
        </Animated.View>

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
            <Text style={styles.sectionTitle}>¿Cómo Funciona el Método?</Text>
            <Text style={styles.sectionSubtitle}>
              Una técnica revolucionaria que transforma cómo aprendes y comprendes
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepIconContainer, { backgroundColor: step.color }]}>
                    <step.icon size={24} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.stepTitle, { color: step.color }]}>
                    {step.title}
                  </Text>
                </View>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

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
              <Text style={styles.sectionTitle}>Beneficios del Método</Text>
              <Text style={styles.sectionSubtitle}>
                Descubre cómo esta técnica revolucionaria transforma tu aprendizaje
              </Text>
            </View>

            <View style={styles.benefitsGrid}>
              {method.beneficios.map((beneficio, index) => (
                <View key={beneficio.id_beneficio} style={styles.benefitCard}>
                  <View style={[styles.benefitNumber, { backgroundColor: methodColor }]}>
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
            <Text style={styles.startButtonText}>Comenzar Método Feynman</Text>
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
    backgroundColor: '#FFD54F',
    opacity: 0.08,
  },
  glowCircle2: {
    bottom: 80,
    right: 40,
    width: 384,
    height: 384,
    backgroundColor: '#FFB74D',
    opacity: 0.06,
  },
  glowCircle3: {
    top: '50%',
    left: '50%',
    marginLeft: -144,
    marginTop: -144,
    width: 288,
    height: 288,
    backgroundColor: '#FF9800',
    opacity: 0.05,
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
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
  errorIcon: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 32,
  },
  errorEmoji: {
    fontSize: 40,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 48,
  },
  heroSection: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  heroContent: {
    padding: 24,
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    marginBottom: 24,
  },
  methodBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  methodImageContainer: {
    marginBottom: 24,
  },
  methodImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  methodImageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  methodEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
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
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: 'rgba(35, 35, 35, 0.9)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitCard: {
    backgroundColor: 'rgba(35, 35, 35, 0.9)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 213, 79, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  benefitNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    flex: 1,
  },
  actionSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    gap: 12,
    shadowColor: '#FFD54F',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeynmanIntroView;