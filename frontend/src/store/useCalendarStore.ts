import { create } from 'zustand';
import { calendarApi } from '../api/calendar';
import type { CalendarEvent } from '../api/calendar';

interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  
  fetchEvents: (workspaceId: string) => Promise<void>;
  createEvent: (workspaceId: string, data: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (eventId: string, data: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  isLoading: false,
  error: null,

  fetchEvents: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await calendarApi.getWorkspaceEvents(workspaceId);
      set({ events: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch events', isLoading: false });
    }
  },

  createEvent: async (workspaceId: string, data: Partial<CalendarEvent>) => {
    try {
      const response = await calendarApi.createEvent(workspaceId, data);
      set(state => ({ events: [...state.events, response.data.data] }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  },

  updateEvent: async (eventId: string, data: Partial<CalendarEvent>) => {
    try {
      const response = await calendarApi.updateEvent(eventId, data);
      set(state => ({
        events: state.events.map(e => (e.id === eventId ? response.data.data : e))
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update event');
    }
  },

  deleteEvent: async (eventId: string) => {
    try {
      await calendarApi.deleteEvent(eventId);
      set(state => ({
        events: state.events.filter(e => e.id !== eventId)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete event');
    }
  }
}));
