import { API_BASE_URL, API_ENDPOINTS } from './constants';
import type { IEvento, IEventoCreate, IEventoUpdate } from '../types/events';
import type { ApiResponse } from '../types/api';

/**
 * API integration layer for events operations
 * Handles all HTTP requests to the events endpoints
 */
export const eventsApi = {
  /**
   * Get all events for the authenticated user
   */
  getAllEvents: async (): Promise<IEvento[]> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EVENTS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to fetch events');
    }

    const apiResponse: ApiResponse<IEvento[]> = await response.json();
    return apiResponse.data || [];
  },

  /**
   * Create a new event
   */
  createEvent: async (eventData: IEventoCreate): Promise<IEvento> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EVENTS}/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to create event');
    }

    const apiResponse: ApiResponse<IEvento> = await response.json();
    return apiResponse.data!;
  },

  /**
   * Update an existing event
   */
  updateEvent: async (eventId: number, updates: IEventoUpdate): Promise<IEvento> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EVENTS}/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to update event');
    }

    const apiResponse: ApiResponse<IEvento> = await response.json();
    return apiResponse.data!;
  },

  /**
   * Delete an event
   */
  deleteEvent: async (eventId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EVENTS}/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to delete event');
    }
  },

  /**
   * Mark event as completed
   */
  markEventCompleted: async (eventId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EVENTS}/${eventId}/completed`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to mark event as completed');
    }
  },

  /**
   * Mark event as pending
   */
  markEventPending: async (eventId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EVENTS}/${eventId}/pending`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Authentication expired');
      }
      throw new Error('Failed to mark event as pending');
    }
  },
};