import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Animated,
  Easing,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../ui/Sidebar';
import { API_ENDPOINTS } from '../utils/constants';
import { apiClient } from '../clientes/apiClient';
import {
  BookOpen,
  Calendar,
  Music,
  Zap,
  Menu,
  User,
  Play,
  Clock,
  Target,
  BarChart3,
  TrendingUp,
  House,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Brain,
  Target as TargetIcon,
  Timer,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ===== TIPOS UNIFICADOS =====
interface StudyMethod {
  id: number | string;
  nombre?: string;
  titulo?: string;
  descripcion: string;
  icono?: string;
  color?: string;
  progreso?: number;
  estado?: 'activo' | 'pausado' | 'completado';
  duracion_recomendada?: number;
  dificultad?: 'facil' | 'medio' | 'dificil';
}

interface MusicAlbum {
  id: number | string;
  nombre?: string;
  titulo?: string;
  artista: string;
  genero: string;
  portada_url?: string;
  duracion_total?: number;
}

interface StudySession {
  id: number | string;
  titulo: string;
  metodo_id?: number;
  metodo?: string;
  duracion_minutos: number;
  fecha_inicio: string;
  fecha_fin?: string;
  estado: 'completada' | 'en_curso' | 'pendiente' | 'cancelada';
  concentracion?: number;
  productividad?: number;
  notas?: string;
}

interface StudyEvent {
  id: number | string;
  titulo: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: 'sesion_estudio' | 'descanso' | 'repaso' | 'evaluacion';
  estado: 'pendiente' | 'en_curso' | 'completado' | 'cancelado';
  metodo_id?: number;
  recordatorio?: boolean;
}

interface UserProgress {
  totalMethods: number;
  completedMethods: number;
  totalSessions: number;
  totalMusic: number;
  activeMethods: number;
  upcomingEvents: number;
  totalStudyTime: number;
  averageConcentration: number;
  streakDays: number;
}

// ===== CONSTANTES Y CONFIGURACIÓN =====
const COLORS = {
  // Colores base
  bgDark: '#0B1020',
  card: '#0F1724',
  surface: '#1A2536',
  
  // Colores primarios
  primary: '#8B5CF6',      // Violeta
  primaryLight: '#A78BFA',
  secondary: '#06B6D4',    // Cyan
  secondaryLight: '#22D3EE',
  success: '#10B981',      // Verde
  successLight: '#34D399',
  warning: '#F59E0B',      // Ámbar
  warningLight: '#FBBF24',
  error: '#EF4444',        // Rojo
  errorLight: '#F87171',
  
  // Colores de texto
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  
  // Colores adicionales
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
};

const METHOD_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  COLORS.pink,
  COLORS.indigo,
  COLORS.purple,
];

// ===== FUNCIONES HELPER MEJORADAS =====
const getMethodIcon = (iconName?: string) => {
  const icons: Record<string, any> = {
    'clock': Clock,
    'target': Target,
    'bar-chart': BarChart3,
    'book-open': BookOpen,
    'zap': Zap,
    'trending-up': TrendingUp,
    'calendar': Calendar,
    'music': Music,
    'brain': Brain,
    'timer': Timer,
    'target-icon': TargetIcon,
  };
  return icons[iconName || 'book-open'] || BookOpen;
};

const getMethodColor = (index: number, methodId?: number) => {
  if (methodId) {
    return METHOD_COLORS[methodId % METHOD_COLORS.length];
  }
  return METHOD_COLORS[index % METHOD_COLORS.length];
};

const getStatusColor = (estado?: string) => {
  switch (estado?.toLowerCase()) {
    case 'activo':
    case 'en_curso':
    case 'pendiente':
      return COLORS.success;
    case 'pausado':
      return COLORS.warning;
    case 'completado':
    case 'completada':
      return COLORS.primary;
    case 'cancelado':
    case 'cancelada':
      return COLORS.error;
    default:
      return COLORS.textSecondary;
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `Hace ${diffMinutes} min`;
      }
      return `Hace ${diffHours} h`;
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Fecha inválida';
  }
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const formatStudyTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// ===== COMPONENTES UI MEJORADOS =====
const StatCard = ({ Icon, value, label, color, subtitle }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
      <Icon size={22} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const EmptyState = ({ 
  title, 
  subtitle, 
  actionLabel, 
  onPress, 
  icon: Icon,
  secondaryAction
}: any) => (
  <View style={styles.emptyState}>
    {Icon && (
      <View style={styles.emptyIcon}>
        <Icon size={36} color={COLORS.textSecondary} />
      </View>
    )}
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    <View style={styles.emptyActions}>
      {actionLabel && (
        <TouchableOpacity style={styles.emptyButton} onPress={onPress}>
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
      {secondaryAction && (
        <TouchableOpacity 
          style={[styles.emptyButton, styles.emptySecondaryButton]} 
          onPress={secondaryAction.onPress}
        >
          <Text style={styles.emptySecondaryButtonText}>{secondaryAction.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const AnimatedDropdown = ({ open, children, maxHeight = 400 }: any) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: open ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [open]);

  const heightAnim = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <Animated.View style={[styles.sectionDrop, { 
      height: heightAnim,
      opacity,
      maxHeight: open ? maxHeight : 0,
    }]}>
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={{ paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
};

const ExpandableSection = ({ 
  title, 
  description, 
  icon: Icon, 
  iconColor, 
  isOpen, 
  onToggle, 
  children, 
  count,
  badgeColor 
}: any) => (
  <View style={styles.expandableSection}>
    <TouchableOpacity
      style={[styles.sectionHeader, { 
        borderLeftColor: iconColor,
        borderBottomLeftRadius: isOpen ? 0 : 16,
        borderBottomRightRadius: isOpen ? 0 : 16,
      }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={22} color={iconColor} />
        </View>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.sectionHeaderRight}>
        {count !== undefined && count > 0 && (
          <View style={[styles.sectionBadge, { backgroundColor: badgeColor || `${iconColor}15` }]}>
            <Text style={[styles.sectionBadgeText, { color: iconColor }]}>{count}</Text>
          </View>
        )}
        {isOpen ? (
          <ChevronUp size={22} color={COLORS.textSecondary} />
        ) : (
          <ChevronDown size={22} color={COLORS.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
    <AnimatedDropdown open={isOpen} maxHeight={300}>
      {children}
    </AnimatedDropdown>
  </View>
);

// ===== COMPONENTE PRINCIPAL MEJORADO =====
const Home: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studyMethods, setStudyMethods] = useState<StudyMethod[]>([]);
  const [musicAlbums, setMusicAlbums] = useState<MusicAlbum[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<StudyEvent[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalMethods: 0,
    completedMethods: 0,
    totalSessions: 0,
    totalMusic: 0,
    activeMethods: 0,
    upcomingEvents: 0,
    totalStudyTime: 0,
    averageConcentration: 75,
    streakDays: 0,
  });

  const [openSections, setOpenSections] = useState({
    methods: true,
    music: false,
    sessions: false,
    events: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ===== INTEGRACIÓN CON API MEJORADA =====
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo para mejor performance
      const [
        methodsResponse,
        progressResponse,
        musicResponse,
        sessionsResponse,
        eventsResponse,
        userStatsResponse
      ] = await Promise.allSettled([
        apiClient.get(API_ENDPOINTS.STUDY_METHODS),
        apiClient.get(API_ENDPOINTS.METHOD_PROGRESS),
        apiClient.get(`${API_ENDPOINTS.MUSIC_LIBRARY}?limit=3`),
        apiClient.get(`${API_ENDPOINTS.USER_SESSIONS}?limit=5&sort=-fecha_inicio`),
        apiClient.get(`${API_ENDPOINTS.STUDY_EVENTS}?estado=pendiente&limit=3`),
        apiClient.get(API_ENDPOINTS.USER_STATS)
      ]);

      // Procesar métodos de estudio
      if (methodsResponse.status === 'fulfilled') {
        const methodsData = methodsResponse.value.data?.data || [];
        const progressData = progressResponse.status === 'fulfilled' 
          ? progressResponse.value.data?.data || []
          : [];

        const processedMethods = methodsData.map((method: any, index: number) => {
          const methodProgress = progressData.find((p: any) => p.metodo_id === method.id);
          return {
            id: method.id,
            titulo: method.nombre || method.titulo,
            descripcion: method.descripcion,
            icono: method.icono || 'book-open',
            color: method.color || getMethodColor(index, method.id),
            progreso: methodProgress?.progreso || 0,
            estado: methodProgress?.progreso === 100 ? 'completado' : 
                   methodProgress?.progreso > 0 ? 'activo' : 'pausado',
          };
        });

        setStudyMethods(processedMethods.slice(0, 3));
      }

      // Procesar música
      if (musicResponse.status === 'fulfilled') {
        const musicData = musicResponse.value.data?.data || [];
        setMusicAlbums(musicData.slice(0, 3));
      }

      // Procesar sesiones
      if (sessionsResponse.status === 'fulfilled') {
        const sessionsData = sessionsResponse.value.data?.data || [];
        setRecentSessions(sessionsData);
      }

      // Procesar eventos
      if (eventsResponse.status === 'fulfilled') {
        const eventsData = eventsResponse.value.data?.data || [];
        setUpcomingEvents(eventsData);
      }

      // Procesar estadísticas del usuario
      if (userStatsResponse.status === 'fulfilled') {
        const statsData = userStatsResponse.value.data?.data || {};
        setUserProgress(prev => ({
          ...prev,
          totalStudyTime: statsData.total_study_time || 0,
          averageConcentration: statsData.avg_concentration || 75,
          streakDays: statsData.streak_days || 0,
          totalMethods: statsData.total_methods || 0,
          completedMethods: statsData.completed_methods || 0,
          totalSessions: statsData.total_sessions || 0,
          activeMethods: statsData.active_methods || 0,
        }));
      }

      // Calcular estadísticas adicionales
      const completedMethods = studyMethods.filter(m => m.progreso === 100).length;
      const activeMethods = studyMethods.filter(m => (m.progreso || 0) > 0 && (m.progreso || 0) < 100).length;

      setUserProgress(prev => ({
        ...prev,
        completedMethods,
        activeMethods,
        totalMusic: musicAlbums.length,
        upcomingEvents: upcomingEvents.length,
      }));

    } catch (err: any) {
      console.error('Error cargando datos:', err);
      
      // Fallback a datos mock si la API falla (solo en desarrollo)
      if (__DEV__) {
        console.log('Usando datos de ejemplo para desarrollo');
        
        // Datos mock para desarrollo
        const mockMethods: StudyMethod[] = [
          {
            id: 1,
            titulo: 'Método Pomodoro',
            descripcion: 'Técnica de gestión del tiempo en intervalos',
            icono: 'timer',
            color: COLORS.primary,
            progreso: 75,
            estado: 'activo',
          },
          {
            id: 2,
            titulo: 'Mapas Mentales',
            descripcion: 'Organización visual de ideas y conceptos',
            icono: 'brain',
            color: COLORS.success,
            progreso: 45,
            estado: 'activo',
          },
          {
            id: 3,
            titulo: 'Técnica Feynman',
            descripcion: 'Aprender enseñando a otros',
            icono: 'book-open',
            color: COLORS.secondary,
            progreso: 20,
            estado: 'pausado',
          },
        ];

        const mockAlbums: MusicAlbum[] = [
          {
            id: 1,
            titulo: 'Lo-Fi Study Beats',
            artista: 'Study Vibes',
            genero: 'Lo-Fi Hip Hop',
            portada_url: 'https://picsum.photos/200/200?random=1',
          },
          {
            id: 2,
            titulo: 'Classical Focus',
            artista: 'Mozart & Friends',
            genero: 'Clásica',
            portada_url: 'https://picsum.photos/200/200?random=2',
          },
          {
            id: 3,
            titulo: 'Nature Sounds',
            artista: 'Forest Studio',
            genero: 'Ambient',
            portada_url: 'https://picsum.photos/200/200?random=3',
          },
        ];

        const mockSessions: StudySession[] = [
          {
            id: 1,
            titulo: 'Sesión de Matemáticas',
            metodo: 'Pomodoro',
            duracion_minutos: 45,
            fecha_inicio: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            estado: 'completada',
            concentracion: 85,
          },
          {
            id: 2,
            titulo: 'Repaso de Historia',
            metodo: 'Feynman',
            duracion_minutos: 30,
            fecha_inicio: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            estado: 'completada',
            concentracion: 78,
          },
        ];

        const mockEvents: StudyEvent[] = [
          {
            id: 1,
            titulo: 'Sesión de Repaso General',
            descripcion: 'Repaso de todos los temas vistos esta semana',
            fecha_inicio: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            fecha_fin: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            tipo: 'repaso',
            estado: 'pendiente',
          },
        ];

        setStudyMethods(mockMethods);
        setMusicAlbums(mockAlbums);
        setRecentSessions(mockSessions);
        setUpcomingEvents(mockEvents);

        setUserProgress({
          totalMethods: mockMethods.length,
          completedMethods: mockMethods.filter(m => m.progreso === 100).length,
          totalSessions: mockSessions.length,
          totalMusic: mockAlbums.length,
          activeMethods: mockMethods.filter(m => m.estado === 'activo').length,
          upcomingEvents: mockEvents.length,
          totalStudyTime: 4520,
          averageConcentration: 82,
          streakDays: 7,
        });
      } else {
        setError('Error al conectar con el servidor. Verifica tu conexión.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Efecto para cargar datos
  useEffect(() => {
    loadUserData();
  }, []);

  // Recargar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadUserData();
      }
    }, [loadUserData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, [loadUserData]);

  const navigateTo = (screen: string, params?: any) => {
    try {
      navigation.navigate(screen as never, params as never);
    } catch (err) {
      console.warn('Navigation error:', err);
      Alert.alert('Error', 'No se pudo navegar a esta pantalla');
    }
  };

  const handleStartSession = (method?: StudyMethod) => {
    if (method?.titulo?.toLowerCase().includes('pomodoro')) {
      navigateTo('PomodoroIntro', { methodId: method.id });
    } else {
      navigateTo('QuickSession', { 
        methodId: method?.id,
        methodName: method?.titulo 
      });
    }
  };

  const handlePlayMusic = (album: MusicAlbum) => {
    // Implementar lógica de reproducción
    Alert.alert(
      'Reproducir Música',
      `¿Reproducir ${album.titulo || album.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reproducir',
          onPress: () => {
            // Navegar a reproductor o iniciar reproducción
            navigateTo('MusicPlayer', { album });
          },
        },
      ]
    );
  };

  const handleStartEvent = (event: StudyEvent) => {
    Alert.alert(
      'Iniciar Evento',
      `¿Comenzar "${event.titulo}" ahora?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Comenzar',
          onPress: () => {
            // Lógica para iniciar evento
            navigateTo('Session', { eventId: event.id });
          },
        },
      ]
    );
  };

  // Estadísticas mejoradas
  const statsData = [
    {
      Icon: Clock,
      value: formatStudyTime(userProgress.totalStudyTime),
      label: 'Tiempo Total',
      subtitle: 'de estudio',
      color: COLORS.primary,
    },
    {
      Icon: TrendingUp,
      value: `${userProgress.averageConcentration}%`,
      label: 'Concentración',
      subtitle: 'promedio',
      color: COLORS.success,
    },
    {
      Icon: Target,
      value: userProgress.streakDays,
      label: 'Racha',
      subtitle: 'días seguidos',
      color: COLORS.warning,
    },
    {
      Icon: BookOpen,
      value: userProgress.activeMethods,
      label: 'Métodos',
      subtitle: 'activos',
      color: COLORS.secondary,
    },
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tu progreso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
      
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      {/* HEADER MEJORADO */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Menu size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>EstudioFocus</Text>
          <Text style={styles.headerSubtitle}>Dashboard</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigateTo('Profile')}
        >
          <User size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorAlert}>
          <AlertCircle size={18} color={COLORS.error} />
          <Text style={styles.errorAlertText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorAlertClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressBackgroundColor={COLORS.card}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* SECCIÓN DE BIENVENIDA */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeTitle}>
              ¡Hola, {user?.nombre_usuario || 'Estudiante'}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Tu progreso de estudio hoy
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.quickStartButton}
            onPress={() => navigateTo('QuickSession')}
          >
            <Zap size={18} color="#fff" />
            <Text style={styles.quickStartText}>Inicio Rápido</Text>
          </TouchableOpacity>
        </View>

        {/* ESTADÍSTICAS */}
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </View>

        {/* SECCIONES EXPANDIBLES */}
        <View style={styles.sectionsContainer}>
          
          {/* MÉTODOS DE ESTUDIO */}
          <ExpandableSection
            title="Métodos Activos"
            description={userProgress.activeMethods > 0 
              ? `${userProgress.activeMethods} en progreso` 
              : "Explora nuevos métodos"}
            icon={BookOpen}
            iconColor={COLORS.primary}
            isOpen={openSections.methods}
            onToggle={() => toggleSection('methods')}
            count={userProgress.activeMethods}
            badgeColor={`${COLORS.primary}20`}
          >
            {studyMethods.length === 0 ? (
              <EmptyState
                title="Sin métodos activos"
                subtitle="Comienza a explorar métodos para mejorar tu productividad"
                actionLabel="Explorar Métodos"
                onPress={() => navigateTo('StudyMethods')}
                icon={BookOpen}
                secondaryAction={{
                  label: "Ver Tutorial",
                  onPress: () => navigateTo('Tutorial'),
                }}
              />
            ) : (
              <>
                <FlatList
                  data={studyMethods}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item, index }) => {
                    const IconComponent = getMethodIcon(item.icono);
                    const color = item.color || getMethodColor(index, Number(item.id));
                    return (
                      <TouchableOpacity
                        style={styles.methodItem}
                        onPress={() => handleStartSession(item)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.methodIcon, { backgroundColor: `${color}15` }]}>
                          <IconComponent size={20} color={color} />
                        </View>
                        <View style={styles.methodInfo}>
                          <Text style={styles.methodTitle}>
                            {item.titulo || item.nombre}
                          </Text>
                          <Text style={styles.methodDescription} numberOfLines={1}>
                            {item.descripcion}
                          </Text>
                          <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                              <View
                                style={[
                                  styles.progressFill,
                                  { 
                                    width: `${item.progreso || 0}%`,
                                    backgroundColor: color,
                                  }
                                ]}
                              />
                            </View>
                            <Text style={[styles.progressText, { color }]}>
                              {item.progreso || 0}%
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[styles.startButton, { backgroundColor: `${color}15` }]}
                          onPress={() => handleStartSession(item)}
                        >
                          <Play size={14} color={color} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  }}
                  scrollEnabled={false}
                />
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigateTo('StudyMethods')}
                >
                  <Text style={styles.viewAllText}>Ver todos los métodos</Text>
                  <ChevronDown size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </ExpandableSection>

          {/* MÚSICA PARA CONCENTRACIÓN */}
          <ExpandableSection
            title="Música para Estudiar"
            description={`${musicAlbums.length} álbumes disponibles`}
            icon={Music}
            iconColor={COLORS.secondary}
            isOpen={openSections.music}
            onToggle={() => toggleSection('music')}
            count={musicAlbums.length}
            badgeColor={`${COLORS.secondary}20`}
          >
            {musicAlbums.length === 0 ? (
              <EmptyState
                title="Sin música disponible"
                subtitle="Descubre música para mejorar tu concentración"
                actionLabel="Explorar Música"
                onPress={() => navigateTo('MusicAlbums')}
                icon={Music}
              />
            ) : (
              <>
                <FlatList
                  data={musicAlbums}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.musicItem}
                      onPress={() => handlePlayMusic(item)}
                      activeOpacity={0.7}
                    >
                      {item.portada_url ? (
                        <Image 
                          source={{ uri: item.portada_url }} 
                          style={styles.albumCover}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.albumPlaceholder, { backgroundColor: `${COLORS.secondary}15` }]}>
                          <Music size={24} color={COLORS.secondary} />
                        </View>
                      )}
                      <View style={styles.musicInfo}>
                        <Text style={styles.musicTitle}>
                          {item.titulo || item.nombre}
                        </Text>
                        <Text style={styles.musicArtist}>{item.artista}</Text>
                        <Text style={styles.musicGenre}>{item.genero}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => handlePlayMusic(item)}
                      >
                        <Play size={16} color="#fff" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigateTo('MusicAlbums')}
                >
                  <Text style={styles.viewAllText}>Descubrir más música</Text>
                  <ChevronDown size={16} color={COLORS.secondary} />
                </TouchableOpacity>
              </>
            )}
          </ExpandableSection>

          {/* SESIONES RECIENTES */}
          <ExpandableSection
            title="Sesiones Recientes"
            description={`${userProgress.totalSessions} sesiones completadas`}
            icon={Clock}
            iconColor={COLORS.warning}
            isOpen={openSections.sessions}
            onToggle={() => toggleSection('sessions')}
            count={recentSessions.length}
            badgeColor={`${COLORS.warning}20`}
          >
            {recentSessions.length === 0 ? (
              <EmptyState
                title="Aún sin sesiones"
                subtitle="Comienza tu primera sesión para ver tu progreso"
                actionLabel="Comenzar Sesión"
                onPress={() => navigateTo('QuickSession')}
                icon={Clock}
              />
            ) : (
              <>
                <FlatList
                  data={recentSessions}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.sessionItem}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionTitleContainer}>
                          <Text style={styles.sessionTitle}>{item.titulo}</Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: `${getStatusColor(item.estado)}15` }
                          ]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.estado) }]}>
                              {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.sessionTime}>
                          {formatDate(item.fecha_inicio)}
                        </Text>
                      </View>
                      
                      <View style={styles.sessionDetails}>
                        <View style={styles.sessionDetail}>
                          <BookOpen size={12} color={COLORS.textSecondary} />
                          <Text style={styles.sessionDetailText}>{item.metodo || 'Método'}</Text>
                        </View>
                        <View style={styles.sessionDetail}>
                          <Timer size={12} color={COLORS.textSecondary} />
                          <Text style={styles.sessionDetailText}>
                            {formatDuration(item.duracion_minutos)}
                          </Text>
                        </View>
                        {item.concentracion && (
                          <View style={styles.sessionDetail}>
                            <Brain size={12} color={COLORS.textSecondary} />
                            <Text style={styles.sessionDetailText}>
                              {item.concentracion}% concentración
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      {item.estado === 'en_curso' && (
                        <TouchableOpacity
                          style={styles.continueButton}
                          onPress={() => navigateTo('Session', { sessionId: item.id })}
                        >
                          <Play size={12} color="#fff" />
                          <Text style={styles.continueButtonText}>Continuar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  scrollEnabled={false}
                />
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigateTo('Sessions')}
                >
                  <Text style={styles.viewAllText}>Ver historial completo</Text>
                  <ChevronDown size={16} color={COLORS.warning} />
                </TouchableOpacity>
              </>
            )}
          </ExpandableSection>

          {/* EVENTOS PROGRAMADOS */}
          <ExpandableSection
            title="Eventos Próximos"
            description="Organiza tus sesiones de estudio"
            icon={Calendar}
            iconColor={COLORS.success}
            isOpen={openSections.events}
            onToggle={() => toggleSection('events')}
            count={upcomingEvents.length}
            badgeColor={`${COLORS.success}20`}
          >
            {upcomingEvents.length === 0 ? (
              <EmptyState
                title="Sin eventos programados"
                subtitle="Programa eventos para organizar mejor tu tiempo"
                actionLabel="Crear Evento"
                onPress={() => navigateTo('Events')}
                icon={Calendar}
              />
            ) : (
              <>
                <FlatList
                  data={upcomingEvents}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.eventItem}
                      onPress={() => handleStartEvent(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.eventHeader}>
                        <Text style={styles.eventTitle}>{item.titulo}</Text>
                        <View style={[
                          styles.eventTypeBadge,
                          { 
                            backgroundColor: item.tipo === 'descanso' ? `${COLORS.secondary}15` : 
                                          item.tipo === 'repaso' ? `${COLORS.warning}15` : 
                                          `${COLORS.primary}15` 
                          }
                        ]}>
                          <Text style={[
                            styles.eventTypeText,
                            { 
                              color: item.tipo === 'descanso' ? COLORS.secondary : 
                                    item.tipo === 'repaso' ? COLORS.warning : 
                                    COLORS.primary 
                            }
                          ]}>
                            {item.tipo === 'descanso' ? 'Descanso' : 
                             item.tipo === 'repaso' ? 'Repaso' : 'Estudio'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.eventDescription} numberOfLines={2}>
                        {item.descripcion}
                      </Text>
                      
                      <View style={styles.eventTime}>
                        <Calendar size={14} color={COLORS.textSecondary} />
                        <Text style={styles.eventTimeText}>
                          {formatDate(item.fecha_inicio)} - {formatDate(item.fecha_fin)}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.startEventButton}
                        onPress={() => handleStartEvent(item)}
                      >
                        <Text style={styles.startEventButtonText}>Comenzar</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigateTo('Events')}
                >
                  <Text style={styles.viewAllText}>Programar más eventos</Text>
                  <ChevronDown size={16} color={COLORS.success} />
                </TouchableOpacity>
              </>
            )}
          </ExpandableSection>
        </View>

        {/* CONSEJO DEL DÍA */}
        <View style={styles.tipContainer}>
          <View style={[styles.tipIcon, { backgroundColor: `${COLORS.info}15` }]}>
            <Brain size={22} color={COLORS.info} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Consejo del día</Text>
            <Text style={styles.tipText}>
              Estudia en intervalos de 25-30 minutos con descansos de 5 minutos.
              Esta técnica mejora la retención y reduce la fatiga mental.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* NAVEGACIÓN INFERIOR MEJORADA */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <View style={[styles.navIcon, styles.navIconActive]}>
            <House size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.navLabelActive}>Inicio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateTo('StudyMethods')}
        >
          <View style={styles.navIcon}>
            <BookOpen size={20} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.navLabel}>Métodos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateTo('QuickSession')}
        >
          <View style={styles.navIcon}>
            <Zap size={20} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.navLabel}>Sesión</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateTo('MusicAlbums')}
        >
          <View style={styles.navIcon}>
            <Music size={20} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.navLabel}>Música</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigateTo('Stats')}
        >
          <View style={styles.navIcon}>
            <BarChart3 size={20} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.navLabel}>Estadísticas</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Home;

// ===== ESTILOS MEJORADOS =====
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 100,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgDark,
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  welcomeTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  quickStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  quickStartText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: width > 400 ? '48%' : '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  statSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sectionsContainer: {
    gap: 16,
  },
  expandableSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontWeight: '900',
    fontSize: 12,
  },
  sectionDrop: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 0,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptySecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
  },
  emptySecondaryButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  methodDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontWeight: '800',
    fontSize: 13,
    minWidth: 36,
  },
  startButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  albumCover: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 12,
  },
  albumPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  musicInfo: {
    flex: 1,
  },
  musicTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 2,
  },
  musicArtist: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  musicGenre: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sessionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
  },
  sessionTime: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionDetailText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  eventItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  eventDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  eventTimeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  startEventButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  startEventButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    alignItems: 'flex-start',
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  navIcon: {
    marginBottom: 4,
  },
  navIconActive: {
    transform: [{ scale: 1.1 }],
  },
  navLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}15`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    gap: 12,
  },
  errorAlertText: {
    flex: 1,
    color: COLORS.error,
    fontWeight: '600',
    fontSize: 14,
  },
  errorAlertClose: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
});