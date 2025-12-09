import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiClient } from '../clientes/apiClient';
import { 
  ArrowLeft, 
  Target, 
  Sprout, 
  Palette, 
  Monitor, 
  PenTool, 
  Map,
  CheckCircle
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

const MindMapsInfoPage: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { methodId } = route.params as { methodId: string };

  const [method, setMethod] = useState<StudyMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Obtener datos del método de estudio
  useEffect(() => {
    const fetchMethodData = async () => {
      try {
        setLoading(true);
        setError('');

        // En una implementación real, aquí iría la llamada a la API
        // Simulamos datos de ejemplo por ahora
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockMethod: StudyMethod = {
          id_metodo: parseInt(methodId),
          nombre_metodo: 'Mapas Mentales',
          descripcion: 'Los mapas mentales son una técnica de estudio que permite organizar y representar información de manera visual, conectando conceptos a través de una estructura radial que emula el pensamiento humano.',
          color_hexa: COLORS.primary,
          beneficios: [
            {
              id_beneficio: 1,
              descripcion_beneficio: 'Mejora la retención de información hasta un 30%'
            },
            {
              id_beneficio: 2,
              descripcion_beneficio: 'Facilita la comprensión de conceptos complejos'
            },
            {
              id_beneficio: 3,
              descripcion_beneficio: 'Estimula la creatividad y el pensamiento asociativo'
            },
            {
              id_beneficio: 4,
              descripcion_beneficio: 'Ayuda a organizar ideas de manera estructurada'
            },
            {
              id_beneficio: 5,
              descripcion_beneficio: 'Permite ver conexiones entre conceptos aparentemente desconectados'
            },
            {
              id_beneficio: 6,
              descripcion_beneficio: 'Es útil para planificar proyectos y estudios'
            }
          ]
        };

        setMethod(mockMethod);
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

  const handleStartMindMap = () => {
    navigation.navigate('MindMapsSteps', { methodId });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTitle}>Cargando método...</Text>
          <Text style={styles.loadingSubtitle}>Preparando mapas mentales</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !method) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorEmoji}>⚠️</Text>
          </View>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapas Mentales</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.methodBadge}>
            <Map size={20} color={COLORS.primary} />
            <Text style={styles.methodBadgeText}>Mapas Mentales</Text>
          </View>

          <View style={styles.methodImageContainer}>
            <View style={[styles.methodImage, { backgroundColor: `${COLORS.primary}20` }]}>
              <Text style={styles.methodEmoji}>🗺️</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Organiza tu Conocimiento</Text>

          <Text style={styles.heroDescription}>
            {method.descripcion}
          </Text>

          <View style={styles.objectiveBadge}>
            <Target size={16} color={COLORS.primary} />
            <Text style={styles.objectiveText}>
              Objetivo: organizar visualmente la información para fortalecer la comprensión y retención del conocimiento
            </Text>
          </View>

          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <View style={[styles.tagDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.tagText}>Organización Visual</Text>
            </View>
            <View style={styles.tag}>
              <View style={[styles.tagDot, { backgroundColor: COLORS.accent }]} />
              <Text style={styles.tagText}>Creatividad Activada</Text>
            </View>
            <View style={styles.tag}>
              <View style={[styles.tagDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.tagText}>Memoria Mejorada</Text>
            </View>
          </View>
        </View>

        {/* How it works section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Cómo Crear un Mapa Mental?</Text>
          <Text style={styles.sectionSubtitle}>
            Una guía paso a paso para organizar tus ideas de manera visual y efectiva
          </Text>

          <View style={styles.stepsContainer}>
            {/* Paso 1 */}
            <View style={[styles.stepCard, { borderLeftColor: COLORS.primary }]}>
              <View style={[styles.stepIcon, { backgroundColor: COLORS.primary }]}>
                <Target size={24} color="#fff" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>1. Elige un tema central</Text>
                <Text style={styles.stepDescription}>
                  Selecciona el tema principal que quieres estudiar y escríbelo en el centro
                  de tu hoja o lienzo digital. Este será el punto de partida de tu mapa mental.
                </Text>
              </View>
            </View>

            {/* Paso 2 */}
            <View style={[styles.stepCard, { borderLeftColor: COLORS.secondary }]}>
              <View style={[styles.stepIcon, { backgroundColor: COLORS.secondary }]}>
                <Sprout size={24} color="#fff" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>2. Crea ramas principales</Text>
                <Text style={styles.stepDescription}>
                  Dibuja líneas desde el centro hacia afuera para las ideas principales
                  relacionadas con el tema. Cada rama representa una categoría importante.
                </Text>
              </View>
            </View>

            {/* Paso 3 */}
            <View style={[styles.stepCard, { borderLeftColor: COLORS.accent }]}>
              <View style={[styles.stepIcon, { backgroundColor: COLORS.accent }]}>
                <Palette size={24} color="#fff" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>3. Añade colores y símbolos</Text>
                <Text style={styles.stepDescription}>
                  Utiliza colores, símbolos, dibujos e imágenes para conectar conceptos
                  y hacer el mapa más memorable. Los colores mejoran la retención visual.
                </Text>
              </View>
            </View>

            {/* Paso 4 */}
            <View style={[styles.stepCard, { borderLeftColor: '#06B6D4' }]}>
              <View style={[styles.stepIcon, { backgroundColor: '#06B6D4' }]}>
                <Monitor size={24} color="#fff" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>4. Herramientas digitales recomendadas</Text>
                <Text style={styles.stepDescription}>
                  Si prefieres trabajar digitalmente, prueba herramientas como MindMeister,
                  Coggle, Miro o XMind. Estas aplicaciones ofrecen plantillas avanzadas.
                </Text>
              </View>
            </View>

            {/* Paso 5 */}
            <View style={[styles.stepCard, { borderLeftColor: '#84CC16' }]}>
              <View style={[styles.stepIcon, { backgroundColor: '#84CC16' }]}>
                <PenTool size={24} color="#fff" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>5. ¡Hazlo tú mismo!</Text>
                <Text style={styles.stepDescription}>
                  Crear el mapa mental manualmente mejora significativamente la retención.
                  El proceso de dibujar y organizar ideas fortalece las conexiones neuronales.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits section */}
        {method.beneficios && method.beneficios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beneficios de los Mapas Mentales</Text>
            <Text style={styles.sectionSubtitle}>
              Descubre cómo esta técnica visual revoluciona tu forma de aprender
            </Text>

            <View style={styles.benefitsGrid}>
              {method.beneficios.map((beneficio, index) => (
                <View 
                  key={beneficio.id_beneficio} 
                  style={[styles.benefitCard, { borderLeftColor: COLORS.primary }]}
                >
                  <View style={styles.benefitNumber}>
                    <Text style={styles.benefitNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.benefitText}>
                    {beneficio.descripcion_beneficio}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartMindMap}
          >
            <Map size={24} color="#fff" />
            <Text style={styles.startButtonText}>Crear Mapa Mental</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorEmoji: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
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
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  heroSection: {
    padding: 20,
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 24,
  },
  methodBadgeText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  methodImageContainer: {
    marginBottom: 24,
  },
  methodImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  methodEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  heroDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  objectiveBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 20,
    width: '100%',
  },
  objectiveText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  stepsContainer: {
    gap: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    alignItems: 'flex-start',
  },
  benefitNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  benefitNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionSection: {
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    minWidth: '80%',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default MindMapsInfoPage;