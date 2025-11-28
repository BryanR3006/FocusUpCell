import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  Target,
  BarChart3,
  TrendingUp,
  House,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

const { height } = Dimensions.get('window');

// Tipos
interface StudyMethod {
  id: string;
  nombre: string;
  descripcion: string;
  progreso?: number;
  color?: string;
  icono?: string;
}

interface MusicItem {
  id: string;
  nombre: string;
  artista: string;
  genero: string;
}

interface UserProgress {
  totalMethods: number;
  completedMethods: number;
  totalSessions: number;
}

// Colores
const COLORS = {
  primary: '#8B5CF6',     // morado principal
  secondary: '#06B6D4',   // cian/acento
  success: '#10B981',
  warning: '#F59E0B',
  bgDark: '#070812',      // fondo más oscuro y uniforme
  card: '#0B1020',        // color de tarjetas
  surface: '#0F1724',     // superficie para bordes/sombras
  textPrimary: '#E6EDFF', // texto principal con más contraste
  textSecondary: '#9AA7C7', // texto secundario
};

/* ---------- Helpers ---------- */
const getMethodIcon = (iconName?: string) => {
  const icons: Record<string, any> = {
    clock: Clock,
    target: Target,
    'bar-chart': BarChart3,
    'book-open': BookOpen,
    zap: Zap,
    'trending-up': TrendingUp,
  };
  return iconName ? icons[iconName] || BookOpen : BookOpen;
};

/* ---------- Componentes ---------- */
const Stat = ({ Icon, value, label, color }: any) => (
  <View style={styles.statItem}>
    <Icon size={20} color={color} />
    <Text style={styles.statNumber}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const EmptyState = ({ title, subtitle, actionLabel, onPress }: any) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    {actionLabel ? (
      <TouchableOpacity style={styles.emptyButton} onPress={onPress}>
        <Text style={styles.emptyButtonText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// Componente de Card Expandible
const ExpandableCard = ({ 
  title, 
  description, 
  icon: Icon, 
  iconColor, 
  isOpen, 
  onToggle,
  children 
}: any) => (
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
        {isOpen ? (
          <ChevronUp size={20} color={COLORS.textSecondary} />
        ) : (
          <ChevronDown size={20} color={COLORS.textSecondary} />
        )}
      </View>
    </TouchableOpacity>

    <AnimatedDropdown open={isOpen}>
      {children}
    </AnimatedDropdown>
  </View>
);

// Componente de Animación
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

  const height = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!open) return null;

  return (
    <Animated.View style={[styles.sectionDrop, { height, opacity }]}>
      {children}
    </Animated.View>
  );
};

/* ---------- Componente principal ---------- */
const Home: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const [studyMethods, setStudyMethods] = useState<StudyMethod[]>([]);
  const [musicItems, setMusicItems] = useState<MusicItem[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalMethods: 0,
    completedMethods: 0,
    totalSessions: 0,
  });

  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  /** Cards abiertas */
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    metodos: false,
    musica: false,
    sesion: false,
    eventos: false,
  });

  const toggleCard = (key: string) => {
    setOpenCards(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);

      const [methodsData, progressData] = await Promise.all([
        apiClient.getStudyMethods(),
        apiClient.getMethodProgress(),
      ]);

      setStudyMethods(Array.isArray(methodsData) ? methodsData.slice(0, 3) : []);

      setMusicItems([
        { id: 'm1', nombre: 'Lo-Fi Study Beats', artista: 'Study Vibes', genero: 'Lo-Fi' },
        { id: 'm2', nombre: 'Pianos Calm', artista: 'Relaxed', genero: 'Classical' },
      ]);

      setUserProgress({
        totalMethods: methodsData?.length || 0,
        completedMethods: progressData?.completedCount || 0,
        totalSessions: progressData?.totalSessions || 0,
      });

    } catch (err) {
      console.warn('Error cargando datos', err);
      setStudyMethods([]);
      setMusicItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateTo = (screen: string) => navigation.navigate(screen as never);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 120 }} size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tu información...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      <Sidebar visible={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconRound} onPress={() => setSidebarVisible(true)}>
          <Menu size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inicio</Text>
        <View style={styles.userRound}>
          <User size={18} color={COLORS.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setShowScrollIndicator(y + height < height * 1.6);
        }}
        scrollEventThrottle={16}
      >
        {/* Bienvenida */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>¡Hola, {user?.nombre_usuario ?? 'Usuario'}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Tu espacio para estudiar con foco</Text>
        </View>

        {/* --------- CARDS EXPANDIBLES --------- */}
        <View style={styles.cardsRow}>

          {/* MÉTODOS */}
          <ExpandableCard
            title="Métodos"
            description={`${userProgress.totalMethods} métodos disponibles`}
            icon={BookOpen}
            iconColor={COLORS.primary}
            isOpen={openCards.metodos}
            onToggle={() => toggleCard('metodos')}
          >
            {studyMethods.length === 0 ? (
              <EmptyState
                title="Sin métodos"
                subtitle="No tienes métodos en curso."
                actionLabel="Ver métodos"
                onPress={() => navigateTo('StudyMethods')}
              />
            ) : (
              <FlatList
                data={studyMethods}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => {
                  const Icon = getMethodIcon(item.icono);
                  const color = item.color || COLORS.primary;
                  return (
                    <View style={styles.methodCard}>
                      <View style={[styles.methodLeft, { backgroundColor: `${color}22` }]}>
                        <Icon size={18} color={color} />
                      </View>
                      <View style={styles.methodMiddle}>
                        <Text style={styles.methodName}>{item.nombre}</Text>
                        <Text style={styles.methodDesc} numberOfLines={1}>{item.descripcion}</Text>
                        <View style={styles.smallProgressBar}>
                          <View style={[styles.smallProgressFill, { width: `${item.progreso ?? 0}%`, backgroundColor: color }]} />
                        </View>
                      </View>
                      <Text style={[styles.methodPct]}>{item.progreso ?? 0}%</Text>
                    </View>
                  );
                }}
                scrollEnabled={false}
              />
            )}
          </ExpandableCard>

          {/* MÚSICA */}
          <ExpandableCard
            title="Música"
            description="Playlists para concentrarte"
            icon={Music}
            iconColor={COLORS.secondary}
            isOpen={openCards.musica}
            onToggle={() => toggleCard('musica')}
          >
            {musicItems.length === 0 ? (
              <EmptyState
                title="Sin playlists"
                subtitle="No tienes música aún."
                actionLabel="Explorar música"
                onPress={() => navigateTo('MusicAlbums')}
              />
            ) : (
              <FlatList
                data={musicItems}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <View style={styles.musicRow}>
                    <View style={styles.musicAvatar}><Music size={16} color={COLORS.secondary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.musicTitle}>{item.nombre}</Text>
                      <Text style={styles.musicSubtitle}>{item.artista}</Text>
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

          {/* SESIÓN RÁPIDA */}
          <ExpandableCard
            title="Sesión rápida"
            description="Comienza una sesión"
            icon={Zap}
            iconColor={COLORS.warning}
            isOpen={openCards.sesion}
            onToggle={() => toggleCard('sesion')}
          >
            {userProgress.totalSessions === 0 ? (
              <EmptyState
                title="Sin sesiones"
                subtitle="Aún no has iniciado sesiones."
                actionLabel="Iniciar sesión"
                onPress={() => navigateTo('QuickSession')}
              />
            ) : (
              <View>
                <Text style={styles.sessionText}>
                  Has completado{' '}
                  <Text style={{ fontWeight: '800' }}>{userProgress.totalSessions}</Text> sesiones
                </Text>

                <TouchableOpacity style={styles.sessionCTA} onPress={() => navigateTo('QuickSession')}>
                  <Play size={14} color="#fff" />
                  <Text style={styles.sessionCTAText}>Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            )}
          </ExpandableCard>

          {/* EVENTOS */}
          <ExpandableCard
            title="Eventos"
            description="Organiza tus sesiones"
            icon={Calendar}
            iconColor={COLORS.success}
            isOpen={openCards.eventos}
            onToggle={() => toggleCard('eventos')}
          >
            <EmptyState
              title="Sin eventos"
              subtitle="No hay eventos programados."
              actionLabel="Crear evento"
              onPress={() => navigateTo('Events')}
            />
          </ExpandableCard>

        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
          <House size={18} color={COLORS.primary} />
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
          <Text style={styles.navLabel}>Sesiones</Text>
        </TouchableOpacity>
      </View>

      {showScrollIndicator && <View style={styles.fabScroll} />}
    </SafeAreaView>
  );
};

export default Home;

/* ---------- Estilos ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgDark },
  scrollView: { flex: 1 },
  scrollContainer: { paddingBottom: 200, paddingTop: 12 },

  header: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
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
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800' },

  welcomeSection: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
  welcomeTitle: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900' },
  welcomeSubtitle: { color: COLORS.textSecondary, marginTop: 6 },

  cardsRow: { paddingHorizontal: 16, gap: 14 },

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
    borderLeftColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    marginVertical: 6,
  },

  sectionDrop: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 0.5,
    borderColor: COLORS.surface,
    marginTop: -6,
    overflow: 'hidden',
  },

  cardLeft: { width: 60, alignItems: 'center' },
  cardBody: { flex: 1, paddingLeft: 12 },
  cardRight: { width: 28, alignItems: 'center' },
  cardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  cardDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6 },

  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 6 },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },

  emptyState: { alignItems: 'center', padding: 18 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
  emptyButton: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  emptyButtonText: { color: '#fff', fontWeight: '700' },

  methodCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  methodLeft: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  methodMiddle: { flex: 1 },
  methodName: { color: COLORS.textPrimary, fontWeight: '900', fontSize: 14 },
  methodDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  smallProgressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, marginTop: 10, overflow: 'hidden' },
  smallProgressFill: { height: '100%', borderRadius: 8 },
  methodPct: { width: 48, textAlign: 'right', fontWeight: '800', color: COLORS.textPrimary },

  musicRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  musicAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  musicTitle: { color: COLORS.textPrimary, fontWeight: '800' },
  musicSubtitle: { color: COLORS.textSecondary, fontSize: 12 },
  playBtn: { backgroundColor: COLORS.secondary, padding: 10, borderRadius: 10 },

  sessionText: { color: COLORS.textPrimary, marginBottom: 8 },
  sessionCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginTop: 10 },
  sessionCTAText: { color: '#fff', marginLeft: 10, fontWeight: '800' },

  bottomNav: { position: 'absolute', bottom: 14, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'transparent' },
  navBtn: { alignItems: 'center', justifyContent: 'center' },
  navBtnActive: { backgroundColor: 'rgba(139,92,246,0.12)', padding: 10, borderRadius: 12 },
  navLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  navLabelActive: { color: COLORS.primary, fontSize: 11, marginTop: 4, fontWeight: '800' },

  fabScroll: { position: 'absolute', bottom: 100, right: 20, width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)' },

  loadingText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 12 },
});