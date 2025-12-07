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
} from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
import { EventCard } from '../ui/EventCard';
import { CreateEventModal } from './CreateEventModal';
import { EditEventModal } from './EditEventModal';
import { useEvents } from '../hooks/useEvents';
import { eventsApi } from '../utils/eventsApi';
import type { IEvento, IEventoCreate, IEventoUpdate } from '../types/events';

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

  useEffect(() => {
    setEvents(hookEvents);
  }, [hookEvents]);

  useEffect(() => {
    fetchEvents();
  }, []);

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
    const eventId = event.id_evento || event.idEvento;
    if (!eventId) return;

    const currentStatus = event.estado || event.estado_evento;
    const newStatus = currentStatus === "completado" ? "pendiente" : "completado";

    const previousEvents = [...events];
    setEvents(prev => prev.map(e =>
      (e.id_evento || e.idEvento) === eventId
        ? { ...e, estado: newStatus }
        : e
    ));

    try {
      if (newStatus === "completado") {
        await eventsApi.markEventCompleted(eventId);
      } else {
        await eventsApi.markEventPending(eventId);
      }

      Alert.alert(
        'Evento actualizado',
        `El evento ha sido marcado como ${newStatus === "completado" ? "completado" : "pendiente"}`,
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
      const fecha = event.fecha_evento || event.fechaEvento;
      const hora = event.hora_evento || event.horaEvento;

      let isPast = false;
      if (fecha && hora) {
        try {
          const datePart = fecha.includes('T') ? fecha.split('T')[0] : fecha;
          const timePart = hora.length === 5 ? `${hora}:00` : hora;
          const eventDateTime = new Date(`${datePart}T${timePart}`);
          const now = new Date();
          isPast = eventDateTime < now;
        } catch (error) {
          console.warn('Error parsing event date/time:', error);
          isPast = false;
        }
      }

      if (!isPast) return false;

      const status = event.estado || event.estado_evento;

      if (filter === 'completed') {
        return status === 'completado';
      } else if (filter === 'pending') {
        return status === 'pendiente' || status === null || status === undefined;
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

  return (
    <View style={[styles.container, { backgroundColor: '#171717' }]}>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Mis Eventos</Text>
            <Text style={styles.subtitle}>
              Programa sesiones de concentración y mantén tu rutina de estudio organizada
              con eventos personalizados.
            </Text>
            
            <View style={styles.badgesContainer}>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>Organización Efectiva</Text>
              </View>
              <View style={[styles.badge, styles.badgeEmerald]}>
                <View style={[styles.badgeDot, styles.badgeDotEmerald]} />
                <Text style={[styles.badgeText, styles.badgeTextEmerald]}>Rutina Consistente</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={{color: '#fff', fontSize: 20}}>≡</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={{color: '#fff', fontSize: 24}}>+</Text>
            <Text style={styles.createButtonText}>Crear Evento</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === 'all' && styles.filterOptionActive,
              ]}
              onPress={() => setFilter('all')}
            >
              <Text style={[
                styles.filterOptionText,
                filter === 'all' && styles.filterOptionTextActive,
              ]}>
                Todos los eventos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === 'pending' && styles.filterOptionActivePending,
              ]}
              onPress={() => setFilter('pending')}
            >
              <Text style={[
                styles.filterOptionText,
                filter === 'pending' && styles.filterOptionTextActive,
              ]}>
                Pendientes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterOption,
                filter === 'completed' && styles.filterOptionActiveCompleted,
              ]}
              onPress={() => setFilter('completed')}
            >
              <Text style={[
                styles.filterOptionText,
                filter === 'completed' && styles.filterOptionTextActive,
              ]}>
                Completados
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <View style={styles.spinner} />
            <Text style={styles.loadingText}>Cargando eventos...</Text>
            <Text style={styles.loadingSubtext}>Organizando tu calendario de estudio</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Error al cargar eventos</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
              <Text style={{color: '#fff', fontSize: 20}}>↻</Text>
              <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Events Grid */}
        {!loading && !error && (
          <>
            {events.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Text style={{color: '#10b981', fontSize: 48}}>📅</Text>
                </View>
                <Text style={styles.emptyTitle}>No tienes eventos programados</Text>
                <Text style={styles.emptyMessage}>
                  Crea tu primer evento para organizar mejor tus sesiones de estudio
                  y mantener una rutina consistente de concentración.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Text style={{color: '#fff', fontSize: 24}}>+</Text>
                  <Text style={styles.emptyButtonText}>Crear primer evento</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={getFilteredEvents().filter(event => 
                  event && typeof event === 'object' &&
                  (event.id_evento || event.idEvento) &&
                  (event.nombre_evento || event.nombreEvento)
                )}
                renderItem={renderEventItem}
                keyExtractor={(item) => 
                  `event-${item.id_evento || item.idEvento}`
                }
                numColumns={width < 768 ? 1 : width < 1024 ? 2 : 3}
                scrollEnabled={false}
                contentContainerStyle={styles.eventsGrid}
              />
            )}
          </>
        )}
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerContent: {
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1d5db',
    lineHeight: 24,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  badgeEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  badgeDotEmerald: {
    backgroundColor: '#10b981',
  },
  badgeText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  badgeTextEmerald: {
    color: '#10b981',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(35, 35, 35, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(35, 35, 35, 0.8)',
  },
  filterOptionActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  filterOptionActivePending: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  filterOptionActiveCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  filterOptionText: {
    color: '#fff',
    fontSize: 14,
  },
  filterOptionTextActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#10b981',
    borderTopColor: 'transparent',
    animationKeyframes: {
      '0%': { transform: [{ rotate: '0deg' }] },
      '100%': { transform: [{ rotate: '360deg' }] },
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 16,
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIconText: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  eventCardContainer: {
    padding: 8,
  },
});

export default EventsPage;