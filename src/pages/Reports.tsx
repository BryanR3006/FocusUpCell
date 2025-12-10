import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  AlertTriangle, 
  Music, 
  Check, 
  Clock, 
  Trash2, 
  BookOpen, 
  BarChart2,
  X,
  Home,
  Settings,
  LayoutGrid,
  Bell,
  User,
  ChevronDown,
  LogOut,
  Calendar
} from 'lucide-react-native';
import { Sidebar } from "../ui/Sidebar";
import { reportsService } from "../services/reportsService";
import { sessionService } from "../services/sessionService";
import { LOCAL_METHOD_ASSETS } from '../utils/methodAssets';
import { formatTime, mapServerSession } from "../utils/sessionMappers";
import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { replaceIfSessionAlbum } from '../services/audioService';
import { getSongsByAlbumId } from '../utils/musicApi';
import { useConcentrationSession } from '../providers/ConcentrationSessionProvider';
import { API_BASE_URL } from '../utils/constants';
import {
  getMindMapsColorByProgress,
  getMindMapsLabelByProgress,
  getSpacedRepetitionColorByProgress,
  getSpacedRepetitionLabelByProgress,
  getActiveRecallColorByProgress,
  getActiveRecallLabelByProgress,
  getFeynmanColorByProgress,
  getFeynmanLabelByProgress,
  getCornellColorByProgress,
  getCornellLabelByProgress,
  getMethodType,
  getMethodColor,
  getPomodoroColorByProgress,
} from '../utils/methodStatus';
import type { SessionReport, MethodReport } from '../types/api';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

// Tipo para navegación
type ReportsNavigationProp = NavigationProp<RootStackParamList, 'Reports'>;

/**
 * Página principal de reportes para móvil
 */
export const Reports: React.FC = () => {
  const navigation = useNavigation<ReportsNavigationProp>();
  const { playPlaylist, currentAlbum, isPlaying } = useMusicPlayer();
  const { checkDirectResume } = useConcentrationSession();

  // Estado para los reportes
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [methodReports, setMethodReports] = useState<MethodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // Estado para controlar qué pestaña está activa
  const [activeTab, setActiveTab] = useState<'methods' | 'sessions'>('methods');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'terminado'>('todos');
  const [sessionFilter, setSessionFilter] = useState<'todos' | 'pendiente' | 'completado'>('todos');

  // Estado para el modal de estadísticas
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsModalType, setStatsModalType] = useState<'methods' | 'sessions' | null>(null);

  // Estado para el sidebar
  const [sidebarVisible, setSidebarVisible] = useState(false);

  /**
   * Carga los reportes de sesiones y métodos
   */
  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [sessionsData, methodsData] = await Promise.all([
        reportsService.getSessionReports(),
        reportsService.getMethodReports()
      ]);

      setSessionReports(sessionsData);
      setMethodReports(methodsData);
    } catch (err) {
      console.error('Error cargando reportes:', err);
      setError('Error al cargar los reportes. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Elimina un reporte específico
   */
  const deleteReport = async (reportId: number) => {
    Alert.alert(
      '¿Eliminar reporte?',
      'Esta acción no se puede deshacer',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              await fetch(`${API_BASE_URL}/api/v1/reports/${reportId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              Alert.alert('Eliminado', 'El reporte ha sido eliminado correctamente');
              loadReports();
            } catch (error) {
              console.error('Error deleting report:', error);
              Alert.alert('Error', 'No se pudo eliminar el reporte');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  /**
   * Muestra estadísticas agregadas
   */
  const showMethodsStats = () => {
    setStatsModalType('methods');
    setShowStatsModal(true);
  };

  const showSessionsStats = () => {
    setStatsModalType('sessions');
    setShowStatsModal(true);
  };

  const closeStatsModal = () => {
    setShowStatsModal(false);
    setStatsModalType(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  // Cargar reportes al montar el componente
  useEffect(() => {
    loadReports();
  }, []);

  // Estados de carga y error
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertTriangle size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Error al cargar datos</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReports}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filtrar métodos según el estado seleccionado
  const filteredMethods = methodReports.filter(method => {
    if (statusFilter === 'todos') return true;
    if (statusFilter === 'pendiente') return method.estado !== 'completed' && method.progreso < 100;
    if (statusFilter === 'terminado') return method.estado === 'completed' || method.progreso === 100;
    return true;
  });

  // Filtrar sesiones según el estado seleccionado
  const filteredSessions = sessionReports.filter(session => {
    if (sessionFilter === 'todos') return true;
    if (sessionFilter === 'pendiente') return session.estado === 'pendiente';
    if (sessionFilter === 'completado') return session.estado === 'completado';
    return true;
  });

  // Función auxiliar para navegar a métodos
  const navigateToMethod = (
    methodType: string,
    metodoId: number,
    progreso: number,
    sessionId?: number
  ) => {
    const params = { 
      methodId: metodoId,
      progreso: progreso,
      sessionId: sessionId?.toString() 
    };

    switch (methodType) {
      case 'mindmaps':
        navigation.navigate('MindMapsSteps', params);
        break;
      case 'spacedrepetition':
        navigation.navigate('SpacedRepetitionSteps', params);
        break;
      case 'activerecall':
        navigation.navigate('ActiveRecallSteps', params);
        break;
      case 'feynman':
        navigation.navigate('FeynmanSteps', params);
        break;
      case 'cornell':
        navigation.navigate('CornellSteps', params);
        break;
      case 'pomodoro':
      default:
        navigation.navigate('PomodoroExecute', params);
        break;
    }
  };

  // Renderizar un método
  const renderMethodItem = ({ item: method }: { item: MethodReport }) => {
    const methodColor = getMethodColor(method.nombreMetodo);
    const isCompleted = method.estado === 'completado';
    const methodType = getMethodType({ nombre: method.nombreMetodo });

    const statusColor = methodType === 'mindmaps'
      ? getMindMapsColorByProgress(method.progreso)
      : methodType === 'spacedrepetition'
      ? getSpacedRepetitionColorByProgress(method.progreso)
      : methodType === 'activerecall'
      ? getActiveRecallColorByProgress(method.progreso)
      : methodType === 'feynman'
      ? getFeynmanColorByProgress(method.progreso)
      : methodType === 'cornell'
      ? getCornellColorByProgress(method.progreso)
      : methodType === 'pomodoro'
      ? getPomodoroColorByProgress(method.progreso)
      : (isCompleted ? '#22C55E' : '#FACC15');

    const statusLabel = methodType === 'mindmaps'
      ? getMindMapsLabelByProgress(method.progreso)
      : methodType === 'spacedrepetition'
      ? getSpacedRepetitionLabelByProgress(method.progreso)
      : methodType === 'activerecall'
      ? getActiveRecallLabelByProgress(method.progreso)
      : methodType === 'feynman'
      ? getFeynmanLabelByProgress(method.progreso)
      : methodType === 'cornell'
      ? getCornellLabelByProgress(method.progreso)
      : (isCompleted ? 'Terminado' : 'En proceso');

    return (
      <View style={[styles.methodCard, { borderLeftColor: methodColor }]}>
        <View style={styles.methodHeader}>
          <View style={styles.methodTitleContainer}>
            <View style={[styles.methodDot, { backgroundColor: methodColor }]} />
            <Text style={styles.methodTitle} numberOfLines={1}>{method.nombreMetodo}</Text>
          </View>
          <Text style={styles.methodProgress}>{method.progreso || 0}%</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${method.progreso || 0}%`,
                  backgroundColor: statusColor
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.methodFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          
          <View style={styles.methodActions}>
            {!isCompleted ? (
              <>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteReport(method.idReporte)}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.continueButton, { backgroundColor: methodColor }]}
                  onPress={() => {
                    // Guardar datos para continuar
                    AsyncStorage.setItem('resume-session-id', method.idReporte.toString());
                    AsyncStorage.setItem('resume-progress', method.progreso.toString());
                    AsyncStorage.setItem('resume-method-type', methodType);

                    // Navegar usando la función auxiliar
                    navigateToMethod(
                      methodType,
                      method.idMetodo,
                      method.progreso,
                      method.idReporte
                    );
                  }}
                >
                  <Text style={styles.continueButtonText}>Continuar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.completedDeleteButton}
                onPress={() => deleteReport(method.idReporte)}
              >
                <Trash2 size={16} color="#FFFFFF" />
                <Text style={styles.completedDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Renderizar una sesión
  const renderSessionItem = ({ item: session }: { item: SessionReport }) => {
    return (
      <TouchableOpacity 
        style={styles.sessionCard}
        onPress={() => {
          if (session.descripcion) {
            Alert.alert(session.nombreSesion, session.descripcion);
          } else {
            Alert.alert(session.nombreSesion, 'Esta sesión no tiene descripción.');
          }
        }}
        activeOpacity={0.8}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle} numberOfLines={2}>{session.nombreSesion}</Text>
          
          <View style={styles.sessionActions}>
            {session.estado === 'pendiente' && (
              <TouchableOpacity 
                style={styles.resumeButton}
                onPress={async (e) => {
                  e.stopPropagation();
                  
                  try {
                    console.log('[RESUME] Starting session resume for session:', session.idSesion);
                    
                    const sessionDto = await sessionService.getSession(session.idSesion.toString());
                    const activeSession = mapServerSession(sessionDto);
                    
                    // Store session data
                    const sessionToStore = {
                      ...activeSession,
                      persistedAt: new Date().toISOString(),
                    };
                    await AsyncStorage.setItem('focusup:activeSession', JSON.stringify(sessionToStore));
                    await AsyncStorage.setItem('focusup:directResume', 'true');

                    // Trigger direct resume
                    checkDirectResume();

                    // Handle method execution if session has a method
                    if (session.metodoAsociado) {
                      const methodType = getMethodType(session.metodoAsociado.nombreMetodo);
                      const methodReport = methodReports.find(m => m.idMetodo === session.metodoAsociado!.idMetodo);
                      const progress = methodReport ? methodReport.progreso : 0;

                      // Navigate to method using helper function
                      navigateToMethod(
                        methodType,
                        session.metodoAsociado.idMetodo,
                        progress,
                        session.idSesion
                      );
                    }

                    // Handle music restoration
                    if (session.albumAsociado) {
                      setTimeout(async () => {
                        try {
                          const albumSongs = await getSongsByAlbumId(session.albumAsociado!.idAlbum);
                          if (albumSongs.length > 0) {
                            await replaceIfSessionAlbum(
                              {
                                playPlaylist,
                                currentAlbum,
                                isPlaying,
                                togglePlayPause: () => {},
                              },
                              session.albumAsociado!.idAlbum,
                              albumSongs,
                              {
                                id_album: session.albumAsociado!.idAlbum,
                                nombre_album: session.albumAsociado!.nombreAlbum
                              }
                            );
                          }
                        } catch (musicError) {
                          console.error('[RESUME] Error restaurando música:', musicError);
                        }
                      }, 200);
                    }

                    Alert.alert('Éxito', 'Sesión retomada correctamente');
                  } catch (error) {
                    console.error('Error resuming session:', error);
                    Alert.alert('Error', 'No se pudo retomar la sesión');
                  }
                }}
              >
                <Text style={styles.resumeButtonText}>Continuar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.sessionDeleteButton}
              onPress={(e) => {
                e.stopPropagation();
                deleteReport(session.idReporte);
              }}
            >
              <Trash2 size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Method and album tags */}
        {(session.metodoAsociado || session.albumAsociado) && (
          <View style={styles.tagsContainer}>
            {session.metodoAsociado && (
              <View style={[styles.tag, { backgroundColor: `${getMethodColor(session.metodoAsociado.nombreMetodo)}80` }]}>
                <BookOpen size={12} color="#000" />
                <Text style={styles.tagText} numberOfLines={1}>{session.metodoAsociado.nombreMetodo}</Text>
              </View>
            )}
            
            {session.albumAsociado && (
              <View style={[styles.tag, { backgroundColor: '#7f22fe80' }]}>
                <Music size={12} color="#000" />
                <Text style={styles.tagText} numberOfLines={1}>{session.albumAsociado.nombreAlbum}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.sessionFooter}>
          <View style={styles.timeContainer}>
            <Clock size={16} color="#9CA3AF" />
            <Text style={styles.timeText}>{formatTime(session.tiempoTotal)}</Text>
          </View>
          
          <View style={[
            styles.statusBadge, 
            { backgroundColor: session.estado === 'completado' ? '#22C55E' : '#F59E0B' }
          ]}>
            <Text style={styles.statusText}>
              {session.estado === 'completado' ? 'Completada' : 'Pendiente'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Función para renderizar el modal de estadísticas
  const renderStatsModal = () => {
    if (!showStatsModal || !statsModalType) return null;

    // Calcular estadísticas para métodos
    const methodsStats = {
      total: methodReports.length,
      completed: methodReports.filter(m => m.estado === 'completed' || m.progreso === 100).length,
      pending: methodReports.filter(m => m.estado !== 'completed' && m.progreso < 100).length,
      progressDistribution: {
        '0-25%': methodReports.filter(m => m.progreso >= 0 && m.progreso < 25).length,
        '25-50%': methodReports.filter(m => m.progreso >= 25 && m.progreso < 50).length,
        '50-75%': methodReports.filter(m => m.progreso >= 50 && m.progreso < 75).length,
        '75-100%': methodReports.filter(m => m.progreso >= 75 && m.progreso < 100).length,
      },
      completionRate: methodReports.length > 0
        ? Math.round((methodReports.filter(m => m.estado === 'completed' || m.progreso === 100).length / methodReports.length) * 100)
        : 0,
    };

    // Calcular estadísticas para sesiones
    const sessionsStats = {
      total: sessionReports.length,
      completed: sessionReports.filter(s => s.estado === 'completado').length,
      pending: sessionReports.filter(s => s.estado === 'pendiente').length,
      totalTime: sessionReports.reduce((acc, s) => acc + s.tiempoTotal, 0),
      avgTime: sessionReports.length > 0
        ? Math.round(sessionReports.reduce((acc, s) => acc + s.tiempoTotal, 0) / sessionReports.length)
        : 0,
      completionRate: sessionReports.length > 0
        ? Math.round((sessionReports.filter(s => s.estado === 'completado').length / sessionReports.length) * 100)
        : 0,
    };

    return (
      <Modal
        visible={showStatsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeStatsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Estadísticas de {statsModalType === 'methods' ? 'Métodos' : 'Sesiones'}
              </Text>
              <TouchableOpacity onPress={closeStatsModal}>
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.statsSection}>
                {/* Estadísticas generales */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{statsModalType === 'methods' ? methodsStats.total : sessionsStats.total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{statsModalType === 'methods' ? methodsStats.completed : sessionsStats.completed}</Text>
                    <Text style={styles.statLabel}>Completados</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{statsModalType === 'methods' ? methodsStats.pending : sessionsStats.pending}</Text>
                    <Text style={styles.statLabel}>Pendientes</Text>
                  </View>
                  {statsModalType === 'sessions' && (
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>{formatTime(sessionsStats.totalTime)}</Text>
                      <Text style={styles.statLabel}>Tiempo Total</Text>
                    </View>
                  )}
                </View>

                {/* Tasa de completación */}
                <View style={styles.completionRateCard}>
                  <Text style={styles.completionRate}>
                    {statsModalType === 'methods' ? methodsStats.completionRate : sessionsStats.completionRate}%
                  </Text>
                  <Text style={styles.completionLabel}>Tasa de Completación</Text>
                  <View style={styles.completionBreakdown}>
                    <View style={styles.breakdownItem}>
                      <Text style={[styles.breakdownValue, { color: '#22C55E' }]}>
                        {statsModalType === 'methods' ? methodsStats.completed : sessionsStats.completed}
                      </Text>
                      <Text style={styles.breakdownLabel}>Completados</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                      <Text style={[styles.breakdownValue, { color: '#F59E0B' }]}>
                        {statsModalType === 'methods' ? methodsStats.pending : sessionsStats.pending}
                      </Text>
                      <Text style={styles.breakdownLabel}>Pendientes</Text>
                    </View>
                  </View>
                </View>

                {/* Distribución de progreso (solo para métodos) */}
                {statsModalType === 'methods' && (
                  <View>
                    <Text style={styles.sectionTitle}>Distribución de Progreso</Text>
                    <View style={styles.progressDistribution}>
                      {Object.entries(methodsStats.progressDistribution).map(([range, count]) => (
                        <View key={range} style={styles.progressRow}>
                          <Text style={styles.progressRange}>{range}</Text>
                          <View style={styles.progressBarContainer}>
                            <View
                              style={[
                                styles.distributionBar,
                                {
                                  width: methodsStats.total > 0 ? `${(count / methodsStats.total) * 100}%` : '0%'
                                }
                              ]}
                            />
                          </View>
                          <Text style={styles.progressCount}>{count}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Tiempo promedio (solo para sesiones) */}
                {statsModalType === 'sessions' && sessionsStats.total > 0 && (
                  <View>
                    <Text style={styles.sectionTitle}>Tiempo Promedio por Sesión</Text>
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>{formatTime(sessionsStats.avgTime)}</Text>
                      <Text style={styles.statLabel}>Promedio</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171717" />
      
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)}
        currentPage="reports"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setSidebarVisible(true)}
          >
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, styles.menuLineMiddle]} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
          
          <Text style={styles.title}>Reportes de Sesiones</Text>
          
          <TouchableOpacity 
            style={styles.statsButton}
            onPress={activeTab === 'methods' ? showMethodsStats : showSessionsStats}
          >
            <BarChart2 size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'methods' && styles.activeTab]}
                onPress={() => setActiveTab('methods')}
              >
                <Text style={[styles.tabText, activeTab === 'methods' && styles.activeTabText]}>
                  Métodos de Estudio
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'sessions' && styles.activeTab]}
                onPress={() => setActiveTab('sessions')}
              >
                <Text style={[styles.tabText, activeTab === 'sessions' && styles.activeTabText]}>
                  Sesiones de Concentración
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            {activeTab === 'methods' ? (
              <View style={styles.filterButtons}>
                {['todos', 'pendiente', 'terminado'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterButton,
                      statusFilter === filter && styles.activeFilterButton
                    ]}
                    onPress={() => setStatusFilter(filter as any)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      statusFilter === filter && styles.activeFilterButtonText
                    ]}>
                      {filter === 'todos' ? 'Todos' : filter === 'pendiente' ? 'Pendiente' : 'Terminado'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.filterButtons}>
                {['todos', 'pendiente', 'completado'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterButton,
                      sessionFilter === filter && styles.activeFilterButton
                    ]}
                    onPress={() => setSessionFilter(filter as any)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      sessionFilter === filter && styles.activeFilterButtonText
                    ]}>
                      {filter === 'todos' ? 'Todos' : filter === 'pendiente' ? 'Pendiente' : 'Completado'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'methods' ? (
              <>
                {filteredMethods.length > 0 ? (
                  <FlatList
                    data={filteredMethods}
                    renderItem={renderMethodItem}
                    keyExtractor={(item) => `method-${item.idReporte}`}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContainer}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <BookOpen size={48} color="#6B7280" />
                    <Text style={styles.emptyStateText}>No hay métodos de estudio registrados</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                {filteredSessions.length > 0 ? (
                  <FlatList
                    data={filteredSessions}
                    renderItem={renderSessionItem}
                    keyExtractor={(item) => `session-${item.idReporte}`}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContainer}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Clock size={48} color="#6B7280" />
                    <Text style={styles.emptyStateText}>No hay sesiones de concentración registradas</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>


      {/* Modal de estadísticas */}
      {renderStatsModal()}
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: 'rgba(23, 23, 23, 0.9)',
  },
  menuButton: {
    padding: 8,
  },
  menuLine: {
    width: 24,
    height: 2,
    backgroundColor: '#FFFFFF',
    marginVertical: 2,
  },
  menuLineMiddle: {
    marginLeft: 4,
    width: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  listContainer: {
    paddingBottom: 16,
  },
  methodCard: {
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  methodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  methodProgress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  methodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  methodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
  },
  continueButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    gap: 4,
  },
  completedDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionCard: {
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  resumeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionDeleteButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#171717',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#171717',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#232323',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContent: {
    padding: 20,
  },
  statsSection: {
    gap: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: width * 0.4,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  progressDistribution: {
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressRange: {
    width: 60,
    fontSize: 14,
    color: '#9CA3AF',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressCount: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  completionRateCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  completionRate: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  completionBreakdown: {
    flexDirection: 'row',
    gap: 40,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default Reports;