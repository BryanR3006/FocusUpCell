import { useState } from 'react';
import type { IEvento, IEventoCreate, IEventoUpdate } from '../types/events';
import { eventsApi } from '../utils/eventsApi';

/**
 * Custom hook for managing events state and operations
 * Provides CRUD operations and loading states for events
 */
export const useEvents = () => {
  const [events, setEvents] = useState<IEvento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all events for the current user
   */
  const fetchEvents = async () => {
    console.log('🔄 Iniciando fetchEvents...');
    setLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getAllEvents();
      console.log('✅ Eventos obtenidos de API:', data);
      console.log('📊 Cantidad de eventos:', data.length);
      setEvents(data);
    } catch (err) {
      console.error('❌ Error en fetchEvents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
      console.log('🏁 fetchEvents completado');
    }
  };

  /**
   * Create a new event
   */
  const createEvent = async (eventData: IEventoCreate) => {
    setLoading(true);
    setError(null);
    try {
      const newEvent = await eventsApi.createEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
    * Update an existing event (optimistic)
    */
   const updateEvent = async (eventId: number, updates: IEventoUpdate) => {
     const previousEvents = [...events];
     const optimisticEvent = events.find(e => e.idEvento === eventId);
     if (!optimisticEvent) return;
 
     // Optimistic update - merge updates into event
     const updatedOptimistic = { ...optimisticEvent };
     if (updates.nombreEvento) updatedOptimistic.nombreEvento = updates.nombreEvento;
     if (updates.fechaEvento) updatedOptimistic.fechaEvento = updates.fechaEvento;
     if (updates.horaEvento) updatedOptimistic.horaEvento = updates.horaEvento;
     if (updates.descripcionEvento !== undefined) updatedOptimistic.descripcionEvento = updates.descripcionEvento;
     if (updates.tipoEvento) updatedOptimistic.tipoEvento = updates.tipoEvento;
     if (updates.estado !== undefined) updatedOptimistic.estado = updates.estado;
 
     setEvents(prev => prev.map(event =>
       event.idEvento === eventId ? updatedOptimistic : event
     ));
 
     setLoading(true);
     setError(null);
     try {
       const updatedEvent = await eventsApi.updateEvent(eventId, updates);
       setEvents(prev => prev.map(event =>
         event.idEvento === eventId ? updatedEvent : event
       ));
       return updatedEvent;
     } catch (err) {
       // Rollback on error
       setEvents(previousEvents);
       const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
       setError(errorMessage);
       throw err;
     } finally {
       setLoading(false);
     }
   };

  /**
   * Delete an event (non-optimistic)
   */
  const deleteEvent = async (eventId: number) => {
    setLoading(true);
    setError(null);
    try {
      await eventsApi.deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.idEvento !== eventId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Optimistically delete an event - removes from UI immediately, rolls back on error
   * This prevents page reloads and ensures audio playback continuity
   */
  const optimisticDelete = async (eventId: number) => {
    const previous = events; // backup for rollback
    setEvents(prev => prev.filter(e => e.idEvento !== eventId)); // optimistic UI update

    try {
      await eventsApi.deleteEvent(eventId);
    } catch (err) {
      setEvents(previous); // rollback on error
      throw err;
    }
  };

  /**
   * Clear any current error
   */
  const clearError = () => {
    setError(null);
  };

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    optimisticDelete,
    clearError,
  };
};
