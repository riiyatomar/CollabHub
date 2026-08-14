import { create } from 'zustand';
import { type Notification, notificationApi } from '../api/notification';
import { getSocket } from '../api/socket';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  
  fetchNotifications: (cursor?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  initializeSocketListeners: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  hasMore: true,
  nextCursor: null,

  fetchNotifications: async (cursor?: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await notificationApi.getNotifications(cursor);
      const newNotifs = response.data.data.notifications;
      const next = response.data.data.nextCursor;
      
      set((state) => {
        const allNotifs = cursor ? [...state.notifications, ...newNotifs] : newNotifs;
        return {
          notifications: allNotifs,
          unreadCount: allNotifs.filter(n => !n.isRead).length,
          hasMore: !!next,
          nextCursor: next,
          isLoading: false
        };
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch notifications', isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('notification:read', id, () => {
          set((state) => {
            const updated = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
            return {
              notifications: updated,
              unreadCount: updated.filter(n => !n.isRead).length
            };
          });
        });
      }
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead();
      set((state) => {
        const updated = state.notifications.map(n => ({ ...n, isRead: true }));
        return {
          notifications: updated,
          unreadCount: 0
        };
      });
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const socket = getSocket();
      if (socket) {
        socket.emit('notification:delete', id, () => {
          set((state) => {
            const updated = state.notifications.filter(n => n.id !== id);
            return {
              notifications: updated,
              unreadCount: updated.filter(n => !n.isRead).length
            };
          });
        });
      }
    } catch (error) {
      console.error('Failed to delete', error);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.isRead).length
      };
    });
  },

  initializeSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off('notification:new');
    socket.on('notification:new', (notification: Notification) => {
      get().addNotification(notification);
    });
  }
}));
