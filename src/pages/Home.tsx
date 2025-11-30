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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../ui/Sidebar';
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
  AlertCircle,
} from 'lucide-react-native';

const { height } = Dimensions.get('window');

// Tipos simplificados
interface StudyMethod {
  id: string;
  titulo: string;
  descripcion: string;
  progreso: number;
  color: string;
  icono?: string;
}

interface MusicAlbum {
  id: string;
  titulo: string;
  artista: string;
  genero: string;
  portada_url?: string;
}

interface UserProgress {
  totalMethods: number;
  completedMethods: number;
  totalSessions: number;
  totalMusic: number;
  activeMethods: number;
  upcomingEvents: number;
}

const COLORS = {
  primary: '#8B5CF6',
  secondary: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  bgDark: '#070812',
  card: '#0B1020',
  surface: '#0F1724',
  textPrimary: '#E6EDFF',
  textSecondary: '#9AA7C7',
};

// Componentes helper (mantener igual que en el primer código)
const Stat = ({ Icon, value, label, color }: any) => (
  <View style={styles.statItem}>
    <Icon size={20} color={color} />
    <Text style={styles.statNumber}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const EmptyState = ({ title, subtitle, actionLabel, onPress, icon: Icon }: any) => (
  <View style={styles.emptyState}>
    {Icon && <Icon size={32} color={COLORS.textSecondary} style={{ marginBottom: 12 }} />}
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {actionLabel && (
      <TouchableOpacity style={styles.emptyButton} onPress={onPress}>
        <Text style={styles.emptyButtonText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const AnimatedDropdown = ({ open, children }: any) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: open ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [open]);

  const heightAnim = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View style={[styles.sectionDrop, { height: heightAnim, opacity }]}>
      {children}
    </Animated.View>
  );
};

const ExpandableCard = ({ title, description, icon: Icon, iconColor, isOpen, onToggle, children, count }: any) => (
  <View style={styles.expandableCard}>
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: iconColor }]} 
      onPress={onToggle} 
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.cardIcon, { backgroundColor: `${iconColor}22` }]}>
          <Icon size={22} color={iconColor} />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <View style={styles.cardRight}>
        {count > 0 && (
          <View style={[styles.badge, { backgroundColor: `${iconColor}22` }]}>
            <Text style={[styles.badgeText, { color: iconColor }]}>{count}</Text>
          </View>
        )}
        {isOpen ? <AlertCircle size={20} color={COLORS.textSecondary} /> : <AlertCircle size={20} color={COLORS.textSecondary} />}
      </View>
    </TouchableOpacity>
    <AnimatedDropdown open={isOpen}>{children}</AnimatedDropdown>
  </View>
);

// Componente principal corregido
const Home: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeStudyMethods, setActiveStudyMethods] = useState<StudyMethod[]>([]);
  const [userAlbums, setUserAlbums] = useState<MusicAlbum[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalMethods: 0,
    completedMethods: 0,
    totalSessions: 0,
    totalMusic: 0,
    activeMethods: 0,
    upcomingEvents: 0,
  });

  const [openCards, setOpenCards] = useState({
    metodos: true,
    musica: false,
    sesiones: false,
    eventos: false,
  });

  const toggleCard = (key: string) => {
    setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Datos de ejemplo (reemplazar con llamadas reales a la API)
      const mockMethods: StudyMethod[] = [
        {
          id: '1',
          titulo: 'Pomodoro',
          descripcion: 'Técnica de gestión del tiempo',
          progreso: 75,
          color: COLORS.primary,
          icono: 'clock',
        },
        {
          id: '2', 
          titulo: 'Feynman',
          descripcion: 'Método de aprendizaje',
          progreso: 50,
          color: COLORS.secondary,
          icono: 'book-open',
        },
      ];

      const mockAlbums: MusicAlbum[] = [
        {
          id: '1',
          titulo: 'Lo-Fi Study',
          artista: 'Study Vibes',
          genero: 'Lo-Fi',
        },
        {
          id: '2',
          titulo: 'Classical Focus',
          artista: 'Mozart',
          genero: 'Clásica',
        },
      ];

      setActiveStudyMethods(mockMethods);
      setUserAlbums(mockAlbums);
      
      setUserProgress({
        totalMethods: mockMethods.length,
        completedMethods: mockMethods.filter(m => m.progreso >= 100).length,
        totalSessions: 12,
        totalMusic: mockAlbums.length,
        activeMethods: mockMethods.filter(m => m.progreso < 100).length,
        upcomingEvents: 2,
      });

    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [loadUserData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, [loadUserData]);

  const navigateTo = (screen: string) => {
    navigation.navigate(screen as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tu información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
      
      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconRound} onPress={() => setSidebarVisible(true)}>
          <Menu size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inicio</Text>
        <View style={styles.userRound}>
          <User size={18} color={COLORS.primary} />
        </View>
      </View>

      {error && (
        <View style={styles.errorAlert}>
          <AlertCircle size={16} color={COLORS.error} />
          <Text style={styles.errorAlertText}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>¡Hola, {user?.nombre_usuario || 'Usuario'}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Tu progreso de estudio hoy</Text>
        </View>

        <View style={styles.statsContainer}>
          <Stat Icon={BookOpen} value={userProgress.activeMethods} label="Activos" color={COLORS.primary} />
          <Stat Icon={Calendar} value={userProgress.completedMethods} label="Completados" color={COLORS.success} />
          <Stat Icon={Clock} value={userProgress.totalSessions} label="Sesiones" color={COLORS.warning} />
          <Stat Icon={Music} value={userProgress.totalMusic} label="Álbumes" color={COLORS.secondary} />
        </View>

        <View style={styles.cardsRow}>
          {/* Métodos de Estudio */}
          <ExpandableCard
            title="Tus Métodos"
            description="Métodos que estás utilizando"
            icon={BookOpen}
            iconColor={COLORS.primary}
            isOpen={openCards.metodos}
            onToggle={() => toggleCard('metodos')}
            count={activeStudyMethods.length}
          >
            {activeStudyMethods.length === 0 ? (
              <EmptyState
                title="Sin métodos activos"
                subtitle="Comienza a usar algún método de estudio"
                actionLabel="Explorar métodos"
                onPress={() => navigateTo('StudyMethods')}
                icon={BookOpen}
              />
            ) : (
              <FlatList
                data={activeStudyMethods}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.methodCard}>
                    <View style={[styles.methodIcon, { backgroundColor: `${item.color}22` }]}>
                      <BookOpen size={18} color={item.color} />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodName}>{item.titulo}</Text>
                      <Text style={styles.methodDesc}>{item.descripcion}</Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { width: `${item.progreso}%`, backgroundColor: item.color }
                          ]} 
                        />
                      </View>
                    </View>
                    <Text style={[styles.methodPercent, { color: item.color }]}>
                      {item.progreso}%
                    </Text>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </ExpandableCard>

          {/* Música */}
          <ExpandableCard
            title="Tu Música"
            description="Álbumes para concentrarte"
            icon={Music}
            iconColor={COLORS.secondary}
            isOpen={openCards.musica}
            onToggle={() => toggleCard('musica')}
            count={userAlbums.length}
          >
            {userAlbums.length === 0 ? (
              <EmptyState
                title="Sin álbumes"
                subtitle="Descubre música para mejorar tu concentración"
                actionLabel="Explorar música"
                onPress={() => navigateTo('MusicAlbums')}
                icon={Music}
              />
            ) : (
              <FlatList
                data={userAlbums}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.musicRow}>
                    <View style={styles.musicAvatar}>
                      <Music size={16} color={COLORS.secondary} />
                    </View>
                    <View style={styles.musicInfo}>
                      <Text style={styles.musicTitle}>{item.titulo}</Text>
                      <Text style={styles.musicSubtitle}>{item.artista} • {item.genero}</Text>
                    </View>
                    <TouchableOpacity style={styles.playBtn}>
                      <Play size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </ExpandableCard>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
          <BookOpen size={18} color={COLORS.primary} />
          <Text style={styles.navLabelActive}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigateTo('StudyMethods')}>
          <BookOpen size={18} color={COLORS.textSecondary} />
          <Text style={styles.navLabel}>Métodos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigateTo('MusicAlbums')}>
          <Music size={18} color={COLORS.textSecondary} />
          <Text style={styles.navLabel}>Música</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigateTo('QuickSession')}>
          <Zap size={18} color={COLORS.textSecondary} />
          <Text style={styles.navLabel}>Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Estilos (usar los mismos del primer código con algunas adiciones)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgDark },
  scrollView: { flex: 1 },
  scrollContainer: { paddingBottom: 200, paddingTop: 12 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  header: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconRound: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRound: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  welcomeSection: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 12,
  },
  welcomeTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '900',
  },
  welcomeSubtitle: {
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 16,
    borderRadius: 12,
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  cardsRow: {
    paddingHorizontal: 16,
    gap: 14,
  },
  expandableCard: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 6,
  },
  cardLeft: {
    width: 60,
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    paddingLeft: 12,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  cardDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 12,
  },
  sectionDrop: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 18,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  methodDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  methodPercent: {
    fontWeight: '800',
    marginLeft: 8,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  musicAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  musicInfo: {
    flex: 1,
  },
  musicTitle: {
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  musicSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  playBtn: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 10,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 14,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(11, 16, 32, 0.9)',
    borderRadius: 16,
    paddingVertical: 8,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  navBtnActive: {
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: 12,
  },
  navLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '800',
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.error}22`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  errorAlertText: {
    flex: 1,
    color: COLORS.error,
    fontWeight: '600',
  },
});

export default Home;