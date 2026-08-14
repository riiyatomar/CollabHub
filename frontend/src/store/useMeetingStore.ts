import { create } from 'zustand';
import type { Meeting } from '../api/meeting';
import { getSocket } from '../api/socket';
import type { WatchSession } from './useWatchStore';

export interface ParticipantStatus {
  userId: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
}

interface MeetingState {
  currentMeeting: Meeting | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  participantsStatus: Record<string, ParticipantStatus>;
  selectedAudioInput: string | null;
  selectedAudioOutput: string | null;
  selectedVideoInput: string | null;
  
  // Phase 4A Meeting Lobby and Chat
  isJoined: boolean;
  isChatOpen: boolean;

  // Phase 4B specific states
  isWhiteboardOpen: boolean;
  isNotesOpen: boolean;
  presenterId: string | null;

  // Phase 4C Watch Together states
  isWatchUrlDialogOpen: boolean;
  watchSession: WatchSession | null;
  
  // Actions
  setIsJoined: (isJoined: boolean) => void;
  toggleChat: () => void;
  setMeeting: (meeting: Meeting | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  updateParticipantStatus: (userId: string, updates: Partial<ParticipantStatus>) => void;
  setDevices: (audioIn: string | null, audioOut: string | null, videoIn: string | null) => void;
  leaveMeeting: () => void;
  
  toggleWhiteboard: () => void;
  toggleNotes: () => void;
  setPresenterId: (presenterId: string | null) => void;

  toggleWatchUrlDialog: (isOpen: boolean) => void;
  setWatchSession: (session: WatchSession | null) => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  currentMeeting: null,
  localStream: null,
  remoteStreams: {},
  participantsStatus: {},
  selectedAudioInput: null,
  selectedAudioOutput: null,
  selectedVideoInput: null,

  isJoined: false,
  isChatOpen: false,

  isWhiteboardOpen: false,
  isNotesOpen: false,
  presenterId: null,

  isWatchUrlDialogOpen: false,
  watchSession: null,

  setIsJoined: (isJoined) => set({ isJoined }),

  toggleChat: () => set((state) => ({
    isChatOpen: !state.isChatOpen,
    isWhiteboardOpen: false,
    isNotesOpen: false
  })),

  setMeeting: (meeting) => set({ 
    currentMeeting: meeting,
    ...(meeting?.watchSession ? { watchSession: meeting.watchSession } : {})
  }),
  
  setLocalStream: (stream) => set({ localStream: stream }),
  
  addRemoteStream: (userId, stream) => set((state) => ({
    remoteStreams: { ...state.remoteStreams, [userId]: stream }
  })),
  
  removeRemoteStream: (userId) => set((state) => {
    const { [userId]: _, ...rest } = state.remoteStreams;
    return { remoteStreams: rest };
  }),
  
  updateParticipantStatus: (userId, updates) => set((state) => {
    const current = state.participantsStatus[userId] || { userId, isMuted: false, isVideoOff: false, isHandRaised: false };
    return {
      participantsStatus: {
        ...state.participantsStatus,
        [userId]: { ...current, ...updates }
      }
    };
  }),

  setDevices: (audioIn, audioOut, videoIn) => set({
    selectedAudioInput: audioIn,
    selectedAudioOutput: audioOut,
    selectedVideoInput: videoIn
  }),

  leaveMeeting: () => {
    const state = get();
    
    // Stop local tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }

    if (state.currentMeeting) {
      const socket = getSocket();
      if (socket) {
        socket.emit('meeting:leave', { meetingId: state.currentMeeting.id });
      }
    }

    set({
      currentMeeting: null,
      localStream: null,
      remoteStreams: {},
      participantsStatus: {},
      isJoined: false,
      isChatOpen: false,
      isWhiteboardOpen: false,
      isNotesOpen: false,
      presenterId: null,
      isWatchUrlDialogOpen: false,
      watchSession: null
    });
  },

  toggleWhiteboard: () => set((state) => ({ 
    isWhiteboardOpen: !state.isWhiteboardOpen,
    isNotesOpen: false,
    isChatOpen: false
  })),

  toggleNotes: () => set((state) => ({ 
    isNotesOpen: !state.isNotesOpen,
    isWhiteboardOpen: false,
    isChatOpen: false
  })),

  setPresenterId: (presenterId) => set({ presenterId }),

  toggleWatchUrlDialog: (isOpen) => set({ isWatchUrlDialogOpen: isOpen }),
  
  setWatchSession: (session) => set({ watchSession: session }),
}));
