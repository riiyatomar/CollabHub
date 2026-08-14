import { create } from 'zustand';
import { getSocket } from '../api/socket';

interface PresenceState {
  onlineUsers: Record<string, string>; // userId -> status (ONLINE, AWAY, etc.)
  lastActiveAt: Record<string, string>;
  isIdle: boolean;
  
  setOnlineStatus: (userId: string, status: string, lastActiveAt?: string) => void;
  setOffline: (userId: string) => void;
  
  setUserPresence: (status: 'ONLINE' | 'AWAY' | 'DO_NOT_DISTURB') => void;
  initializeIdleDetection: () => () => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: {},
  lastActiveAt: {},
  isIdle: false,

  setOnlineStatus: (userId, status, lastActiveAt) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [userId]: status },
    ...(lastActiveAt ? { lastActiveAt: { ...state.lastActiveAt, [userId]: lastActiveAt } } : {})
  })),

  setOffline: (userId) => set((state) => {
    const newOnline = { ...state.onlineUsers };
    delete newOnline[userId];
    return { onlineUsers: newOnline };
  }),

  setUserPresence: (status) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('presence:set', { status });
    }
  },

  initializeIdleDetection: () => {
    let idleTimeout: ReturnType<typeof setTimeout>;
    const IDLE_TIME = 5 * 60 * 1000; // 5 minutes

    const resetIdle = () => {
      if (get().isIdle) {
        set({ isIdle: false });
        get().setUserPresence('ONLINE');
      }
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        set({ isIdle: true });
        get().setUserPresence('AWAY');
      }, IDLE_TIME);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetIdle));
    
    // Initial call
    resetIdle();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      clearTimeout(idleTimeout);
    };
  }
}));
