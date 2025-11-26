import React, { useEffect, useCallback, useState } from 'react';
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
  House,
  TrendingUp,
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
  primary: '#0EA5E9',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  bgDark: '#0F172A',
  card: '#111827',
  surface: '#1F2937',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
};

/* ---------- Helpers & pequeños componentes ---------- */
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

      // Música de ejemplo — sustituir por tu endpoint si tienes
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

  const cardData = [
    {
      Icon: Music,
      title: 'Música',
      desc: 'Playlists para concentrarte mejor',
      onPress: () => navigateTo('MusicAlbums'),
      color: COLORS.secondary,
    },
    {
      Icon: BookOpen,
      title: 'Métodos',
      desc: `${userProgress.totalMethods} métodos disponibles`,
      onPress: () => navigateTo('StudyMethods'),
      color: COLORS.primary,
    },
    {
      Icon: Calendar,
      title: 'Eventos',
      desc: 'Organiza tus sesiones',
      onPress: () => navigateTo('Events'),
      color: COLORS.success,
    },
  ];

  const stats = [
    { Icon: BookOpen, value: userProgress.totalMethods, label: 'Métodos', color: COLORS.primary },
    { Icon: Target, value: userProgress.completedMethods, label: 'Completados', color: COLORS.success },
    { Icon: Music, value: musicItems.length, label: 'Playlists', color: COLORS.secondary },
    { Icon: TrendingUp, value: userProgress.totalSessions, label: 'Sesiones', color: COLORS.warning },
  ];

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

      <Modal visible={sidebarVisible} transparent animationType="slide">
        <Sidebar onClose={() => setSidebarVisible(false)} />
      </Modal>

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
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>¡Hola, {user?.nombre_usuario ?? 'Usuario'}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Tu espacio para estudiar con foco</Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsRow}>
          {cardData.map((c, i) => (
            <TouchableOpacity key={i} style={[styles.card, { borderLeftColor: c.color }]} onPress={c.onPress} activeOpacity={0.85}>
              <View style={styles.cardLeft}>
                <View style={[styles.cardIcon, { backgroundColor: `${c.color}22` }]}>
                  <c.Icon size={22} color={c.color} />
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.cardDesc}>{c.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <Stat key={i} Icon={s.Icon} value={s.value} label={s.label} color={s.color} />
          ))}
        </View>

        {/* Métodos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Métodos activos</Text>
            <TouchableOpacity onPress={() => navigateTo('StudyMethods')}>
              <Text style={styles.linkText}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {studyMethods.length === 0 ? (
            <EmptyState
              title="Sin métodos activos"
              subtitle="Aún no tienes métodos activos. Agrega uno para empezar a seguir tu progreso."
              actionLabel="Explorar métodos"
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
                    <Text style={[styles.methodPct, { color: (item.progreso === 100 ? COLORS.success : color) }]}>{item.progreso ?? 0}%</Text>
                  </View>
                );
              }}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Música */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Music size={18} color={COLORS.secondary} />
            <Text style={styles.sectionTitle}>Playlists</Text>
            <TouchableOpacity onPress={() => navigateTo('MusicAlbums')}>
              <Text style={styles.linkText}>Ver toda</Text>
            </TouchableOpacity>
          </View>

          {musicItems.length === 0 ? (
            <EmptyState
              title="Sin playlists"
              subtitle="No tienes playlists guardadas todavía."
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
                  <TouchableOpacity style={styles.playBtn} onPress={() => { /* reproducir */ }}>
                    <Play size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Sesión rápida */}
        <View style={styles.section}>
          <View style={styles.sessionHeaderFull}>
            <Zap size={20} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Sesión de concentración</Text>
          </View>

          {userProgress.totalSessions === 0 ? (
            <EmptyState
              title="Aún sin sesiones"
              subtitle="No has iniciado sesiones de concentración."
              actionLabel="Comenzar ahora"
              onPress={() => navigateTo('QuickSession')}
            />
          ) : (
            <View style={styles.sessionSummary}>
              <Text style={styles.sessionText}>Has completado <Text style={{ fontWeight: '800' }}>{userProgress.totalSessions}</Text> sesiones</Text>
              <TouchableOpacity style={styles.sessionCTA} onPress={() => navigateTo('QuickSession')}>
                <Play size={14} color="#fff" />
                <Text style={styles.sessionCTAText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom nav */}
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
  scrollContainer: { paddingBottom: 140 },

  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  iconRound: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRound: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(14,165,233,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },

  welcomeSection: { padding: 18 },
  welcomeTitle: { color: COLORS.textPrimary, fontSize: 26, fontWeight: '800' },
  welcomeSubtitle: { color: COLORS.textSecondary, marginTop: 4 },

  cardsRow: { paddingHorizontal: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  cardLeft: { width: 56, alignItems: 'center' },
  cardIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, paddingLeft: 8 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  cardDesc: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 6, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 6 },
  statLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },

  section: { marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.surface },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: COLORS.textPrimary, fontWeight: '800', flex: 1, marginLeft: 10 },
  linkText: { color: COLORS.primary, fontWeight: '700' },

  emptyState: { alignItems: 'center', padding: 18 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
  emptyButton: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  emptyButtonText: { color: '#fff', fontWeight: '700' },

  methodCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.02)' },
  methodLeft: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodMiddle: { flex: 1 },
  methodName: { color: COLORS.textPrimary, fontWeight: '800' },
  methodDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  smallProgressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6, marginTop: 8, overflow: 'hidden' },
  smallProgressFill: { height: '100%', borderRadius: 6 },
  methodPct: { width: 48, textAlign: 'right', fontWeight: '800' },

  musicRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.02)' },
  musicAvatar: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  musicTitle: { color: COLORS.textPrimary, fontWeight: '800' },
  musicSubtitle: { color: COLORS.textSecondary, fontSize: 12 },
  playBtn: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 10 },

  sessionHeaderFull: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sessionSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionText: { color: COLORS.textPrimary },
  sessionCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  sessionCTAText: { color: '#fff', marginLeft: 8, fontWeight: '800' },

  bottomNav: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'transparent' },
  navBtn: { alignItems: 'center', justifyContent: 'center' },
  navBtnActive: { backgroundColor: 'rgba(14,165,233,0.08)', padding: 8, borderRadius: 10 },
  navLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  navLabelActive: { color: COLORS.primary, fontSize: 11, marginTop: 4, fontWeight: '800' },

  fabScroll: { position: 'absolute', bottom: 100, right: 20, width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)' },

  loadingText: { color: COLORS.textPrimary, textAlign: 'center', marginTop: 12 },
});
