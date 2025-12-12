import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { EventCard } from '../ui/EventCard';
import { CreateEventModal } from './CreateEventModal';
import { EditEventModal } from './EditEventModal';
import { useEvents } from '../hooks/useEvents';
import { eventsApi } from '../utils/eventsApi';
import type { IEvento, IEventoCreate, IEventoUpdate } from '../types/events';
import { Filter, Plus, AlertCircle, Calendar, RefreshCw, Funnel, Target, TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const EventsPage: React.FC = () => {
  const { events: hookEvents, loading, error, fetchEvents, createEvent, updateEvent, optimisticDelete } = useEvents();
  const [events, setEvents] = useState<IEvento[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IEvento | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [spinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    console.log('🎯 Eventos recibidos del hook:', hookEvents);
    console.log('📊 Total eventos:', hookEvents.length);
    if (hookEvents.length > 0) {
      console.log('🔑 Propiedades del primer evento:', Object.keys(hookEvents[0]));
      console.log('🔍 Primer evento estructura:', hookEvents[0]);
    }
    setEvents(hookEvents);
  }, [hookEvents]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleCreateEvent = async (eventData: IEventoCreate) => {
    await createEvent(eventData);
    await fetchEvents();
  };

  const handleEditEvent = (event: IEvento) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    Alert.alert(
      '¿Eliminar evento?',
      'Esta acción no se puede deshacer',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await optimisticDelete(eventId);
              Alert.alert('Eliminado', 'El evento ha sido eliminado correctamente');
            } catch (error) {
              console.error('Error eliminando evento:', error);
              Alert.alert('Error', 'No se pudo eliminar el evento');
            }
          },
        },
      ]
    );
  };

  const handleUpdateEvent = async (eventId: number, eventData: IEventoUpdate) => {
    await updateEvent(eventId, eventData);
  };

  const handleToggleEventState = async (event: IEvento) => {
    const eventId = event.idEvento;
    if (!eventId) return;

    const currentStatus = event.estado;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    const previousEvents = [...events];
    setEvents(prev => prev.map(e =>
      e.idEvento === eventId
        ? { ...e, estado: newStatus }
        : e
    ));

    try {
      await updateEvent(eventId, { estado: newStatus });

      Alert.alert(
        'Evento actualizado',
        `El evento ha sido marcado como ${newStatus === "completed" ? "completado" : "pendiente"}`,
        [],
        { cancelable: true }
      );
    } catch (error) {
      setEvents(previousEvents);
      Alert.alert('Error', 'No se pudo actualizar el estado del evento');
    }
  };

  const getFilteredEvents = () => {
    if (filter === 'all') return events;

    return events.filter(event => {
      const status = event.estado;

      if (filter === 'completed') {
        return status === 'completed';
      } else if (filter === 'pending') {
        return status === 'pending' || status === null || status === undefined;
      }

      return true;
    });
  };

  const renderEventItem = ({ item }: { item: IEvento }) => (
    <View style={styles.eventCardContainer}>
      <EventCard
        event={item}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onToggleState={handleToggleEventState}
      />
    </View>
  );

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />
        <View style={styles.backgroundCircle3} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerGlow} />
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Mis Eventos</Text>
              <Text style={styles.subtitle}>
                Programa sesiones de concentración y mantén tu rutina de estudio organizada
                con eventos personalizados.
              </Text>
              
              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <View style={[styles.tagDot, styles.greenDot]} />
                  <Text style={styles.tagText}>Organización Efectiva</Text>
                </View>
                <View style={styles.tag}>
                  <View style={[styles.tagDot, styles.emeraldDot]} />
                  <Text style={styles.tagText}>Rutina Consistente</Text>
                </View>
                <View style={styles.tag}>
                  <View style={[styles.tagDot, styles.tealDot]} />
                  <Text style={styles.tagText}>Productividad Mejorada</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerControls}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Funnel size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createEventButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={24} color="#fff" />
                <Text style={styles.createEventButtonText}>Crear Evento</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Options */}
          {showFilters && (
            <Animated.View 
              style={[
                styles.filterOptions,
                {
                  opacity: showFilters ? 1 : 0,
                  transform: [{ scale: showFilters ? 1 : 0.95 }]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filter === 'all' && styles.filterOptionActive
                ]}
                onPress={() => { setFilter('all'); setShowFilters(false); }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filter === 'all' && styles.filterOptionTextActive
                ]}>
                  Todos los eventos
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filter === 'pending' && styles.filterOptionPending
                ]}
                onPress={() => { setFilter('pending'); setShowFilters(false); }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filter === 'pending' && styles.filterOptionTextPending
                ]}>
                  Pendientes
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filter === 'completed' && styles.filterOptionCompleted
                ]}
                onPress={() => { setFilter('completed'); setShowFilters(false); }}
              >
                <Text style={[
                  styles.filterOptionText,
                  filter === 'completed' && styles.filterOptionTextCompleted
                ]}>
                  Completados
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Loading State */}
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <View style={styles.spinnerWrapper}>
              <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
            </View>
            <Text style={styles.loadingTitle}>Cargando eventos...</Text>
            <Text style={styles.loadingSubtitle}>
              Organizando tu calendario de estudio
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconWrapper}>
              <View style={styles.errorIconContainer}>
                <Text style={styles.errorEmoji}>⚠️</Text>
              </View>
              <View style={styles.errorBadge}>
                <Text style={styles.errorBadgeText}>!</Text>
              </View>
            </View>
            <Text style={styles.errorTitle}>Error al cargar eventos</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchEvents}
            >
              <RefreshCw size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Events Grid */}
        {!loading && !error && (
          <>
            {events.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrapper}>
                  <View style={styles.emptyIconContainer}>
                    <Calendar size={48} color="#10B981" />
                  </View>
                  <View style={styles.emptyBadge}>
                    <Plus size={16} color="#fff" />
                  </View>
                </View>
                <Text style={styles.emptyTitle}>
                  No tienes eventos programados
                </Text>
                <Text style={styles.emptyMessage}>
                  Crea tu primer evento para organizar mejor tus sesiones de estudio
                  y mantener una rutina consistente de concentración.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Plus size={24} color="#fff" />
                  <Text style={styles.emptyActionButtonText}>Crear primer evento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.eventsSection}>
                <View style={styles.eventsGlow} />
                <FlatList
                  data={getFilteredEvents().filter(event =>
                    event && typeof event === 'object' &&
                    event.idEvento &&
                    event.nombreEvento
                  )}
                  renderItem={renderEventItem}
                  keyExtractor={(item) =>
                    `event-${item.idEvento}`
                  }
                  numColumns={width < 768 ? 1 : width < 1024 ? 2 : 3}
                  scrollEnabled={false}
                  contentContainerStyle={styles.eventsGrid}
                />
              </View>
            )}
          </>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreateEvent}
      />

      <EditEventModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        onSave={handleUpdateEvent}
        event={selectedEvent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
    position: 'relative',
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: 80,
    left: 40,
    width: 320,
    height: 320,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 160,
    opacity: 0.5,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: 80,
    right: 40,
    width: 384,
    height: 384,
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
    borderRadius: 192,
    opacity: 0.5,
  },
  backgroundCircle3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -144 }, { translateY: -144 }],
    width: 288,
    height: 288,
    backgroundColor: 'rgba(20, 184, 166, 0.05)',
    borderRadius: 144,
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    position: 'relative',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    marginBottom: 40,
  },
  headerGlow: {
    position: 'absolute',
    top: -32,
    left: -32,
    right: -32,
    bottom: -32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 24,
    opacity: 0.3,
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
    flexDirection: width < 768 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: width < 768 ? 'flex-start' : 'center',
    gap: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#d1d5db',
    lineHeight: 28,
    marginBottom: 24,
    maxWidth: '90%',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  greenDot: {
    backgroundColor: '#10B981',
  },
  emeraldDot: {
    backgroundColor: '#059669',
  },
  tealDot: {
    backgroundColor: '#0d9488',
  },
  tagText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterButton: {
    padding: 12,
    backgroundColor: 'rgba(35, 35, 35, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.6)',
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  createEventButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterOptions: {
    position: 'absolute',
    right: 24,
    top: 180,
    width: 192,
    backgroundColor: 'rgba(35, 35, 35, 0.95)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  filterOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  filterOptionPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  filterOptionCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  filterOptionText: {
    color: '#ffffff',
    fontSize: 14,
  },
  filterOptionTextActive: {
    color: '#10B981',
  },
  filterOptionTextPending: {
    color: '#f59e0b',
  },
  filterOptionTextCompleted: {
    color: '#3b82f6',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  spinnerWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#10B981',
    borderTopColor: 'transparent',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  errorIconWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  errorEmoji: {
    fontSize: 36,
  },
  errorBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: '90%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 200,
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: '#10B981',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: '90%',
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 16,
    minWidth: 200,
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyActionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventsSection: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  eventsGlow: {
    position: 'absolute',
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 24,
    opacity: 0.3,
  },
  eventsGrid: {
    paddingBottom: 100,
  },
  eventCardContainer: {
    padding: 8,
  },
  bottomSpacing: {
    height: 120,
  },
});

export default EventsPage;