import { create } from 'zustand';
import apiClient from '../api/axios';
import { initSocket, disconnectSocket } from '../api/socket';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
  bio?: string;
  statusMessage?: string;
  themePreference?: string;
  language?: string;
  notificationPreferences?: any;
  privacySettings?: any;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
  
  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token);
    initSocket(token); // Init socket on login
    set({ user, accessToken: token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    disconnectSocket(); // Clean up socket on logout
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, accessToken: null, isAuthenticated: false });
      return;
    }

    try {
      const response = await apiClient.get('/users/me');
      initSocket(token); // Init socket on successful session restore
      set({
        user: response.data.data,
        accessToken: token,
        isAuthenticated: true,
      });
    } catch {
      localStorage.removeItem('accessToken');
      disconnectSocket();
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
}));
