import { create } from 'zustand';
import { whiteboardApi } from '../api/whiteboard';
import type { Whiteboard } from '../api/whiteboard';

interface WhiteboardState {
  whiteboards: Whiteboard[];
  currentWhiteboard: Whiteboard | null;
  isLoading: boolean;
  error: string | null;

  fetchWhiteboards: (workspaceId: string) => Promise<void>;
  createWhiteboard: (workspaceId: string, name: string) => Promise<Whiteboard | null>;
  getWhiteboard: (whiteboardId: string) => Promise<Whiteboard | null>;
  fetchChannelWhiteboard: (workspaceId: string, channelId: string) => Promise<Whiteboard | null>;
  deleteWhiteboard: (whiteboardId: string) => Promise<boolean>;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  whiteboards: [],
  currentWhiteboard: null,
  isLoading: false,
  error: null,

  fetchWhiteboards: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await whiteboardApi.getWorkspaceWhiteboards(workspaceId);
      set({ whiteboards: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch whiteboards', isLoading: false });
    }
  },

  createWhiteboard: async (workspaceId: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await whiteboardApi.createWhiteboard(workspaceId, name);
      set(state => ({ 
        whiteboards: [data, ...state.whiteboards],
        isLoading: false 
      }));
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create whiteboard', isLoading: false });
      return null;
    }
  },

  getWhiteboard: async (whiteboardId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await whiteboardApi.getWhiteboard(whiteboardId);
      set({ currentWhiteboard: data, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch whiteboard', isLoading: false });
      return null;
    }
  },

  fetchChannelWhiteboard: async (workspaceId: string, channelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await whiteboardApi.getChannelWhiteboard(workspaceId, channelId);
      set({ currentWhiteboard: data, isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch channel whiteboard', isLoading: false });
      return null;
    }
  },

  deleteWhiteboard: async (whiteboardId: string) => {
    set({ isLoading: true, error: null });
    try {
      await whiteboardApi.deleteWhiteboard(whiteboardId);
      set(state => ({
        whiteboards: state.whiteboards.filter(w => w.id !== whiteboardId),
        isLoading: false
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete whiteboard', isLoading: false });
      return false;
    }
  }
}));
