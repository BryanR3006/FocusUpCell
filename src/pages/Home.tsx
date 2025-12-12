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
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../ui/Sidebar';
import { API_ENDPOINTS } from '../utils/constants';
import { apiClient } from '../clientes/apiClient';
import { ApiResponse, StudyMethod as ApiStudyMethod, MethodReport, SessionReport } from '../types/api';
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
  Check,
  Coffee,
  RotateCcw,
  FileText,
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
  bgDark: '#0b0b0b',
  card: '#0f0f10',
  surface: '#1A2536',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  textPrimary: '#E6EEF8',
  textSecondary: '#9CA3AF',
  textMuted: '#64748B',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
};

const METHOD_COLORS = [
  "#8B5CF6", // Pomodoro
  "#10B981", // Mapas Mentales
  "#7C3AED", // Repaso Espaciado
  "#059669", // Práctica Activa
  "#F59E0B", // Método Feynman
  "#2563EB", // Método Cornell
];

const getEventTypeColor = (tipo: string) => {
  switch (tipo) {
    case 'sesion_estudio':
      return METHOD_COLORS[0]; // Rojo para estudio
    case 'descanso':
      return METHOD_COLORS[1]; // Verde para descanso
    case 'repaso':
      return METHOD_COLORS[2]; // Morado para repaso
    case 'evaluacion':
      return METHOD_COLORS[3]; // Verde claro para evaluación
    default:
      return COLORS.primary;
  }
};

const getEventTypeIcon = (tipo: string) => {
  switch (tipo) {
    case 'sesion_estudio':
      return BookOpen;
    case 'descanso':
      return Coffee;
    case 'repaso':
      return RotateCcw;
    case 'evaluacion':
      return FileText;
    default:
      return Calendar;
  }
};

// ===== MAPEOS DE IMÁGENES =====
const METHOD_IMAGES: Record<string, any> = {
  'Método Pomodoro': require('../img/MetodoPomodoro.png'),
  'Mapas Mentales': require('../img/MapasMentales.png'),
  'Repaso Espaciado': require('../img/RepasoEspaciado.png'),
  'Práctica Activa': require('../img/PracticaActiva.png'),
  'Método Feynman': require('../img/Feynman.png'),
  'Método Cornell': require('../img/Cornell.png'),
};

const MUSIC_IMAGES: Record<string, any> = {
  'Lofi': require('../img/Album_Lofi.png'),
  'Naturaleza': require('../img/Album_Naturaleza.png'),
  'Relajante': require('../img/Album_Instrumental.png'),
  'Relajantes': require('../img/Album_Instrumental.png'),
  'Instrumental': require('../img/Album_Instrumental.png'),
  'Hip Hop': require('../img/Album_Lofi.png'),
  'Ambient': require('../img/Album_Naturaleza.png'),
  'Clásica': require('../img/Album_Instrumental.png'),
  'Jazz': require('../img/Album_Instrumental.png'),
  'Electrónica': require('../img/Album_Lofi.png'),
};

// ===== FUNCIONES HELPER =====
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

const mapStudyMethod = (apiData: any, userProgressData: any[] = []): StudyMethod => {
  // Encontrar el progreso del usuario para este método
  const userMethod = userProgressData.find(item =>
    item.idMetodo === apiData.id ||
    item.metodo_id === apiData.id ||
    item.metodoId === apiData.id ||
    item.methodId === apiData.id
  );

  const progreso = userMethod?.progreso || userMethod?.progress || 0;

  return {
    id: apiData.id || Math.random(),
    titulo: apiData.titulo || apiData.nombre || apiData.title || 'Método de Estudio',
    descripcion: apiData.descripcion || apiData.description || 'Descripción no disponible',
    icono: apiData.icono || apiData.icon || 'book-open',
    color: apiData.color || getMethodColor(0, Number(apiData.id)),
    progreso: Number(progreso),
    estado: progreso === 100 ? 'completado' :
           progreso > 0 ? 'activo' : 'pausado',
    duracion_recomendada: apiData.duracion_recomendada || apiData.duration,
    dificultad: apiData.dificultad || apiData.difficulty || 'medio'
  };
};

const getMethodColor = (index: number, methodId?: number) => {
   if (methodId) {
     return METHOD_COLORS[methodId % METHOD_COLORS.length];
   }
   return METHOD_COLORS[index % METHOD_COLORS.length];
 };

const getMethodColorByName = (methodName?: string) => {
   const methodMap: Record<string, number> = {
     'Pomodoro': 0,
     'Mapas Mentales': 1,
     'Repaso Espaciado': 2,
     'Práctica Activa': 3,
     'Feynman': 4,
     'Cornell': 5,
   };
   const index = methodMap[methodName || ''] || 0;
   return METHOD_COLORS[index];
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

const formatTime = (minutes: number): string => {
  const totalSeconds = minutes * 60;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatDateShort = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  } catch {
    return '';
  }
};

// ===== COMPONENTE BARRA DE PROGRESO CIRCULAR =====
const CircularProgressBar = ({ progress, size = 60, strokeWidth = 6, color }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Fondo */}
        <Circle
          stroke="rgba(255,255,255,0.1)"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progreso */}
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={[styles.circularProgressText, { color }]}>
          {progress}%
        </Text>
      </View>
    </View>
  );
};

// ===== FUNCIÓN PARA EXTRAER DATOS DE RESPUESTAS DE API =====
const extractDataFromResponse = (response: any): any[] => {
  // Caso 1: Respuesta con campo 'data' que es array
  if (response && response.data !== undefined) {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Si data es objeto, buscar arrays dentro
    if (typeof response.data === 'object') {
      for (const key in response.data) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }
    }
  }

  // Caso 2: La respuesta es directamente un array
  if (Array.isArray(response)) {
    return response;
  }

  // Caso 3: Respuesta con campo 'result'
  if (response && response.result && Array.isArray(response.result)) {
    return response.result;
  }

  return [];
};

// ===== COMPONENTES UI =====
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
      useNativeDriver: false, // ← CAMBIAR de true a false para compatibilidad con React Native Web
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

// ===== COMPONENTE PRINCIPAL =====
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

  // ===== FUNCIONES DE API =====
  const fetchStudyMethods = async (): Promise<StudyMethod[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.STUDY_METHODS);
      const methods = extractDataFromResponse(response);

      // Obtener también los métodos activos del usuario
      const activeMethodsResponse = await apiClient.get(API_ENDPOINTS.USER_METHODS_REPORTS);
      const activeMethods = extractDataFromResponse(activeMethodsResponse);

      return methods.map((method: any, index: number) => {
        // CORREGIR: Buscar por id_metodo, no idMetodo
        const userMethod = activeMethods.find((am: any) =>
          am.id_metodo === method.id_metodo ||  // ← API usa id_metodo
          am.metodo_id === method.id_metodo
        );

        const progreso = userMethod?.progreso || 0;

        return {
          // CORREGIR: Usar id_metodo, no id
          id: method.id_metodo,
          // CORREGIR: Usar nombre_metodo, no nombre
          titulo: method.nombre_metodo,
          descripcion: method.descripcion,
          icono: method.icono || 'book-open',
          color: method.color || getMethodColor(index, method.id_metodo),
          progreso: Number(progreso),
          estado: progreso === 100 ? 'completado' :
                  progreso > 0 ? 'activo' : 'pausado',
          duracion_recomendada: method.duracion_recomendada,
          dificultad: method.dificultad || 'medio',
        } as StudyMethod;
      });
    } catch (error) {
      console.error('Error fetching study methods:', error);
      return [];
    }
  };

  const fetchMusicAlbums = async (): Promise<MusicAlbum[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MUSIC_ALBUMS);
      const albums = extractDataFromResponse(response);

      return albums.map((album: any) => ({
        id: album.id_album,
        // CORREGIR: Usar nombre_album, no titulo
        titulo: album.nombre_album,
        artista: album.artista || 'Artista desconocido',
        genero: album.genero || 'Sin género',
        portada_url: album.portada_url,
        duracion_total: album.duracion_total,
      }));
    } catch (error) {
      console.error('Error fetching music albums:', error);
      return [];
    }
  };

  const fetchRecentSessions = async (): Promise<StudySession[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_SESSIONS_REPORTS);
      const sessions = extractDataFromResponse(response);

      return sessions.map((session: any) => {
        // CORREGIR: Convertir tiempo_total (ms) a minutos
        const tiempoTotalMs = session.tiempo_total || 0;
        const duracionMinutos = Math.floor(tiempoTotalMs / (1000 * 60));

        return {
          id: session.id_sesion,
          // CORREGIR: Usar nombre_sesion, no titulo
          titulo: session.nombre_sesion,
          // CORREGIR: Acceder a metodo_asociado.nombre_metodo
          metodo: session.metodo_asociado?.nombre_metodo || 'Sin método',
          duracion_minutos: duracionMinutos,
          fecha_inicio: session.fecha_creacion,
          estado: (session.estado || 'pendiente').toLowerCase(),
          concentracion: session.concentracion || 75,
          productividad: session.productividad,
          notas: session.notas,
        };
      }).sort((a, b) =>
        new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
      );
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  };

  const fetchUpcomingEvents = async (): Promise<StudyEvent[]> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EVENTS);
      const events = extractDataFromResponse(response);
      console.log('📊 Datos crudos de API:', events);

      const now = new Date();

      // CORREGIR: Incluir eventos con estado null o pendiente
      const upcoming = events.filter((event: any) => {
        const estado = event.estado || event.status;
        // Incluir si es null, pendiente, o pending
        return estado === null ||
              estado === 'pendiente' ||
              estado === 'pending';
      });
  
      console.log('🔍 Después de filtro:', upcoming);
  
      const upcomingEventsData = upcoming.map((event: any) => {
        // CORREGIR: Combinar fechaEvento + horaEvento
        const fechaHora = `${event.fechaEvento}T${event.horaEvento || '00:00:00'}`;
        const fechaInicio = new Date(fechaHora);
        const fechaFin = new Date(fechaInicio.getTime() + 60 * 60 * 1000); // +1 hora
  
        return {
          id: event.idEvento,
          // CORREGIR: Usar nombreEvento, no titulo
          titulo: event.nombreEvento,
          descripcion: event.descripcionEvento || 'Sin descripción',
          fecha_inicio: fechaInicio.toISOString(),
          fecha_fin: fechaFin.toISOString(),
          tipo: event.tipoEvento || 'sesion_estudio',
          // CORREGIR: Asignar 'pendiente' si es null
          estado: event.estado || 'pendiente',
          metodo_id: event.idMetodo || event.metodo_id,
          recordatorio: event.recordatorio || false,
        };
      }).slice(0, 3); // Limitar a 3 eventos
  
      console.log('📋 Después de mapeo y limitación:', upcomingEventsData);
  
      return upcomingEventsData;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  };

  const fetchUserProgress = async (): Promise<UserProgress | null> => {
    try {
      // Obtener estadísticas del usuario
      const [methodsResponse, sessionsResponse, musicResponse, eventsResponse] = await Promise.all([
        apiClient.get(API_ENDPOINTS.USER_METHODS_REPORTS),
        apiClient.get(API_ENDPOINTS.USER_SESSIONS_REPORTS),
        apiClient.get(API_ENDPOINTS.MUSIC_ALBUMS),
        apiClient.get(API_ENDPOINTS.EVENTS),
      ]);

      const userMethods = extractDataFromResponse(methodsResponse) as MethodReport[];
      const userSessions = extractDataFromResponse(sessionsResponse) as SessionReport[];
      const userMusic = extractDataFromResponse(musicResponse);
      const userEvents = extractDataFromResponse(eventsResponse);

      // Calcular estadísticas
      const completedMethods = userMethods.filter((m: MethodReport) => m.progreso === 100).length;
      const activeMethods = userMethods.filter((m: MethodReport) => (m.progreso || 0) > 0 && (m.progreso || 0) < 100).length;
      const pendingEvents = userEvents.filter((e: any) => e.estado === 'pendiente' || e.status === 'pending').length;

      // Calcular tiempo total de estudio (en segundos)
      const totalStudyTime = userSessions
        .filter((s: SessionReport) => s.estado === 'completado')
        .reduce((total: number, session: SessionReport) => total + (session.tiempoTotal || 0) * 60, 0);

      // Calcular concentración promedio - no disponible en SessionReport, usar valor por defecto
      const averageConcentration = 75;

      // Calcular racha (días seguidos estudiando) - Esto necesitaría un cálculo más complejo
      // Por ahora, lo calculamos basado en sesiones en los últimos 7 días
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentSessions = userSessions.filter((s: SessionReport) => {
        const sessionDate = new Date(s.fechaCreacion);
        return sessionDate > weekAgo;
      });
      const uniqueDays = new Set(
        recentSessions.map((s: SessionReport) => {
          const date = new Date(s.fechaCreacion);
          return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        })
      );
      const streakDays = uniqueDays.size;

      return {
        totalMethods: userMethods.length,
        completedMethods,
        totalSessions: userSessions.length,
        totalMusic: userMusic.length,
        activeMethods,
        upcomingEvents: pendingEvents,
        totalStudyTime,
        averageConcentration: Math.round(averageConcentration),
        streakDays,
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return null;
    }
  };

  // ===== CARGA DE DATOS =====
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Timeout para evitar esperas infinitas
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout cargando datos')), 5000)
      );

      // Cargar datos reales
      const dataPromise = Promise.all([
        fetchStudyMethods(),
        fetchMusicAlbums(),
        fetchRecentSessions(),
        fetchUpcomingEvents(),
        fetchUserProgress(),
      ]);

      // Race entre timeout y datos reales
      const [methods, albums, sessions, events, progress] =
        await Promise.race([dataPromise, timeoutPromise.then(() => { throw new Error('Timeout'); })]);

      // Si tenemos datos, usarlos
      if (methods && methods.length > 0) {
        setStudyMethods(methods.slice(0, 3));
        setMusicAlbums(albums.slice(0, 3));
        setRecentSessions(sessions.slice(0, 5));
        setUpcomingEvents(events.slice(0, 3));

        console.log('📝 Estado upcomingEvents asignado con:', events.slice(0, 3));

        if (progress) {
          setUserProgress(progress);
        } else {
          // Calcular progreso basado en datos locales
          const completedMethods = methods.filter(m => m.progreso === 100).length;
          const activeMethods = methods.filter(m => (m.progreso || 0) > 0 && (m.progreso || 0) < 100).length;

          setUserProgress({
            totalMethods: methods.length,
            completedMethods,
            totalSessions: sessions.length,
            totalMusic: albums.length,
            activeMethods,
            upcomingEvents: events.length,
            totalStudyTime: 0,
            averageConcentration: 75,
            streakDays: 0,
          });
        }
      } else {
        // Si no hay datos reales, cargar mock
        loadMockData();
      }

    } catch (err: any) {
      console.error('Error general cargando datos:', err);

      // En desarrollo, siempre cargar mock data
      if (__DEV__) {
        loadMockData();
      } else {
        setError('Error al cargar los datos. Verifica tu conexión e intenta de nuevo.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ===== DATOS MOCK (solo para desarrollo) =====
  const loadMockData = () => {
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
        portada_url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
      },
      {
        id: 2,
        titulo: 'Classical Focus',
        artista: 'Mozart & Friends',
        genero: 'Clásica',
        portada_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      },
      {
        id: 3,
        titulo: 'Nature Sounds',
        artista: 'Forest Studio',
        genero: 'Ambient',
        portada_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop',
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
      completedMethods: 1,
      totalSessions: mockSessions.length,
      totalMusic: mockAlbums.length,
      activeMethods: 2,
      upcomingEvents: mockEvents.length,
      totalStudyTime: 4520,
      averageConcentration: 82,
      streakDays: 7,
    });
  };

  // ===== EFECTOS =====
  useEffect(() => {
    loadUserData();
  }, []);

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

  // ===== MANEJADORES DE NAVEGACIÓN =====
  const navigateTo = (screen: string, params?: any) => {
    try {
      const screenMap: Record<string, string> = {
        'QuickSession': 'Session',
        'Sessions': 'SessionHistory',
        'Events': 'Events',
        'Stats': 'Statistics',
        'MusicPlayer': 'MusicPlayer',
        'Profile': 'Profile',
        'StudyMethods': 'StudyMethods',
        'Tutorial': 'Tutorial',
        'MusicAlbums': 'MusicAlbums',
        'SessionHistory': 'SessionHistory',
        'Statistics': 'Statistics',
      };
      
      const targetScreen = screenMap[screen] || screen;
      
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate(targetScreen as never);
      }
    } catch (err) {
      console.warn(`Error navegando a ${screen}:`, err);
      Alert.alert('Error', 'No se puede navegar en este momento');
    }
  };

  const handleStartSession = (method?: StudyMethod) => {
    if (method?.titulo?.toLowerCase().includes('pomodoro')) {
      navigateTo('PomodoroIntro', { methodId: method.id });
    } else {
      navigateTo('Session', { 
        methodId: method?.id,
        methodName: method?.titulo 
      });
    }
  };

  const handlePlayMusic = (album: MusicAlbum) => {
    navigateTo('MusicPlayer', { album });
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
            navigateTo('Session', { eventId: event.id });
          },
        },
      ]
    );
  };

  // ===== DATOS DE ESTADÍSTICAS =====
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

  // ===== RENDERIZADO =====
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

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Menu size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Focus Up</Text>
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
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeTitle}>
              ¡Hola, {user?.nombre_usuario || 'Estudiante'}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Tu progreso de estudio hoy
            </Text>
          </View>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickStartButton}
              onPress={() => navigateTo('sessions')}
            >
              <Zap size={18} color="#fff" />
              <Text style={styles.quickStartText}>Sesiones</Text>
            </TouchableOpacity>
          
          </View>
        </View>

        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <StatCard key={`stat-${index}`} {...stat} />
          ))}
        </View>

        <View style={styles.sectionsContainer}>
          
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
                  keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                  renderItem={({ item, index }) => {
                    const color = item.color || getMethodColor(index, Number(item.id));
                    const methodImage = METHOD_IMAGES[item.titulo as keyof typeof METHOD_IMAGES];

                    return (
                      <TouchableOpacity
                        style={styles.methodItem}
                        onPress={() => handleStartSession(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.methodImageContainer}>
                          {methodImage ? (
                            <Image
                              source={methodImage}
                              style={styles.methodImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={[styles.methodIcon, { backgroundColor: `${color}15` }]}>
                              {(() => {
                                const IconComponent = getMethodIcon(item.icono);
                                return <IconComponent size={20} color={color} />;
                              })()}
                            </View>
                          )}
                        </View>
                        <View style={styles.methodInfo}>
                          <Text style={styles.methodTitle}>
                            {item.titulo || item.nombre}
                          </Text>
                          <Text style={styles.methodDescription} numberOfLines={1}>
                            {item.descripcion}
                          </Text>
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
                  keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                  renderItem={({ item }) => {
                    const musicImage = MUSIC_IMAGES[item.genero as keyof typeof MUSIC_IMAGES];

                    return (
                      <TouchableOpacity
                        style={styles.musicItem}
                        onPress={() => handlePlayMusic(item)}
                        activeOpacity={0.7}
                      >
                        {musicImage ? (
                          <Image
                            source={musicImage}
                            style={styles.albumCover}
                            resizeMode="cover"
                          />
                        ) : item.portada_url ? (
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
                    );
                  }}
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
                onPress={() => navigateTo('Session')}
                icon={Clock}
              />
            ) : (
              <>
                <FlatList
                  data={recentSessions}
                  keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                  renderItem={({ item }) => {
                    const isCompleted = item.estado === 'completada';
                    const methodColor = getMethodColorByName(item.metodo);

                    return (
                      <View
                        style={[styles.sessionItem, { backgroundColor: `${methodColor}08`, borderLeftWidth: 4, borderLeftColor: methodColor }]}
                      >
                        {/* Header con título y fecha */}
                        <View style={styles.sessionHeader}>
                          <View style={styles.sessionTitleContainer}>
                            <Text style={styles.sessionTitle} numberOfLines={1}>
                              {item.titulo}
                            </Text>
                            <Text style={styles.sessionDate}>
                              {formatDateShort(item.fecha_inicio)}
                            </Text>
                          </View>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: `${getStatusColor(item.estado)}20` }
                          ]}>
                            <View style={[
                              styles.statusDot,
                              { backgroundColor: getStatusColor(item.estado) }
                            ]} />
                            <Text style={[
                              styles.statusText,
                              { color: getStatusColor(item.estado) }
                            ]}>
                              {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                            </Text>
                          </View>
                        </View>

                        {/* Método y Música con checkboxes */}
                        <View style={styles.sessionOptions}>
                          <View style={styles.optionItem}>
                            <View style={[
                              styles.checkbox,
                              item.metodo ? styles.checkboxChecked : styles.checkboxUnchecked
                            ]}>
                              {item.metodo && <Check size={12} color="#fff" />}
                            </View>
                            <View style={styles.optionContent}>
                              <BookOpen size={14} color={COLORS.textSecondary} />
                              <Text style={styles.optionText}>
                                {item.metodo || 'Sin método'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.optionItem}>
                            <View style={[
                              styles.checkbox,
                              isCompleted ? styles.checkboxChecked : styles.checkboxUnchecked
                            ]}>
                              {isCompleted && <Check size={12} color="#fff" />}
                            </View>
                            <View style={styles.optionContent}>
                              <Music size={14} color={COLORS.textSecondary} />
                              <Text style={styles.optionText}>
                                {isCompleted ? 'Completada' : 'En progreso'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Duración y Estado */}
                        <View style={styles.sessionFooter}>
                          <View style={styles.durationContainer}>
                            <Clock size={14} color={COLORS.textSecondary} />
                            <Text style={styles.durationText}>
                              {formatTime(item.duracion_minutos)}
                            </Text>
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
                      </View>
                  );
                }}
                  scrollEnabled={false}
                />
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigateTo('SessionHistory')}
                >
                  <Text style={styles.viewAllText}>Ver historial completo</Text>
                  <ChevronDown size={16} color={COLORS.warning} />
                </TouchableOpacity>
              </>
            )}
          </ExpandableSection>

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
                  renderItem={({ item }) => {
                    const eventColor = item.metodo_id ? getMethodColor(0, item.metodo_id) : getEventTypeColor(item.tipo);

                    return (
                      <TouchableOpacity
                        style={styles.eventItem}
                        onPress={() => handleStartEvent(item)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[styles.eventGradient, { backgroundColor: `${eventColor}10`, borderLeftWidth: 4, borderLeftColor: eventColor }]}
                        >
                          <View style={styles.eventHeader}>
                            <Text style={styles.eventTitle}>{item.titulo}</Text>
                            <View style={[
                              styles.eventTypeBadge,
                              {
                                backgroundColor: `${eventColor}20`,
                                borderWidth: 1,
                                borderColor: `${eventColor}30`
                              }
                            ]}>
                              <Text style={[
                                styles.eventTypeText,
                                { color: eventColor }
                              ]}>
                                {item.tipo === 'descanso' ? 'Descanso' :
                                 item.tipo === 'repaso' ? 'Repaso' :
                                 item.tipo === 'evaluacion' ? 'Evaluación' : 'Estudio'}
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
                            style={[styles.startEventButton, { backgroundColor: eventColor }]}
                            onPress={() => handleStartEvent(item)}
                          >
                            <Text style={styles.startEventButtonText}>Comenzar</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
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
          onPress={() => navigateTo('Session')}
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
          onPress={() => navigateTo('Statistics')}
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

// ===== ESTILOS =====
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
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  sessionsButtonText: {
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
  methodImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  methodImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  progressInfo: {
    marginLeft: 12,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionTitleContainer: {
    flex: 1,
  },
  sessionTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  sessionDate: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  optionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.success,
  },
  checkboxUnchecked: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  eventItem: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
  },
  eventGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTypeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
  },
  startEventButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
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