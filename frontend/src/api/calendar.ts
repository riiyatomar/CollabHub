import api from './axios';

export interface CalendarEvent {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  type: 'MEETING' | 'TASK' | 'REMINDER' | 'CUSTOM';
  entityId: string | null;
  isAllDay: boolean;
}

export const calendarApi = {
  getWorkspaceEvents: (workspaceId: string) => 
    api.get(`/workspaces/${workspaceId}/calendar`),
  
  createEvent: (workspaceId: string, data: Partial<CalendarEvent>) => 
    api.post(`/workspaces/${workspaceId}/calendar`, data),
  
  updateEvent: (eventId: string, data: Partial<CalendarEvent>) => 
    api.patch(`/calendar/${eventId}`, data),
  
  deleteEvent: (eventId: string) => 
    api.delete(`/calendar/${eventId}`)
};
