import { create } from 'zustand';

export interface WatchSession {
  id: string;
  meetingId: string | null;
  channelId: string | null;
  workspaceId: string | null;
  mediaUrl: string;
  hostId: string;
  status: 'PLAYING' | 'PAUSED' | 'IDLE';
  playbackPosition: number;
  playbackRate: number;
  updatedAt: string;
  createdAt: string;
}

interface WatchState {
  activeSession: WatchSession | null;
  isWatchModalOpen: boolean;
  hasJoined: boolean;
  
  setActiveSession: (session: WatchSession | null) => void;
  setWatchModalOpen: (isOpen: boolean) => void;
  setHasJoined: (joined: boolean) => void;
  leaveSession: () => void;
}

export const useWatchStore = create<WatchState>((set) => ({
  activeSession: null,
  isWatchModalOpen: false,
  hasJoined: false,
  
  setActiveSession: (session) => set({ activeSession: session }),
  setWatchModalOpen: (isOpen) => set({ isWatchModalOpen: isOpen }),
  setHasJoined: (joined) => set({ hasJoined: joined }),
  
  leaveSession: () => set({ activeSession: null, hasJoined: false })
}));
