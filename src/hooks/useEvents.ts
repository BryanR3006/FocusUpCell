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
    setLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getAllEvents();
      setEvents(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
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
   * Update an existing event
   */
  const updateEvent = async (eventId: number, updates: IEventoUpdate) => {
    setLoading(true);
    setError(null);
    try {
      const updatedEvent = await eventsApi.updateEvent(eventId, updates);
      setEvents(prev => prev.map(event =>
        event.id_evento === eventId ? updatedEvent : event
      ));
      return updatedEvent;
    } catch (err) {
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
      setEvents(prev => prev.filter(event => event.id_evento !== eventId));
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
    setEvents(prev => prev.filter(e => (e.idEvento ?? e.id_evento) !== eventId)); // optimistic UI update

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