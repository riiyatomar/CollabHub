import api from './axios';

export interface Notification {
  id: string;
  type: string;
  workspaceId?: string;
  title: string;
  message: string;
  link?: string;
  icon?: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  isArchived: boolean;
  readAt?: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
}

export const notificationApi = {
  getNotifications: (cursor?: string, limit = 20) => 
    api.get<{ data: { notifications: Notification[], nextCursor: string | null } }>(`/notifications`, { params: { cursor, limit } }),
    
  markAsRead: (notificationId: string) => 
    api.put(`/notifications/${notificationId}/read`),
    
  markAllAsRead: () => 
    api.put(`/notifications/read-all`),
    
  deleteNotification: (notificationId: string) => 
    api.delete(`/notifications/${notificationId}`),
};
