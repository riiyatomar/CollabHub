import axios from './axios';
import type { User } from '../store/useAuthStore';
import type { WatchSession } from '../store/useWatchStore';

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  user: User;
  joinedAt: string;
  leftAt: string | null;
}

export interface Meeting {
  id: string;
  title: string;
  workspaceId: string;
  channelId: string | null;
  hostId: string;
  host: User;
  status: 'WAITING' | 'ONGOING' | 'ENDED';
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  participants: MeetingParticipant[];
  watchSession?: WatchSession | null;
}

export const meetingApi = {
  create: async (title: string, workspaceId: string, channelId?: string) => {
    return axios.post<{ data: Meeting }>('/meetings', { title, workspaceId, channelId });
  },
  
  get: async (meetingId: string) => {
    return axios.get<{ data: Meeting }>(`/meetings/${meetingId}`);
  },
  
  end: async (meetingId: string) => {
    return axios.patch<{ data: Meeting }>(`/meetings/${meetingId}/end`);
  }
};

// Kept for backward compatibility with Meeting watch sessions if needed
export const watchApi = {
  create: async (meetingId: string, mediaUrl: string) => {
    return axios.post<{ data: any }>(`/watch/meeting/${meetingId}`, { mediaUrl });
  },
  get: async (meetingId: string) => {
    return axios.get<{ data: any }>(`/watch/meeting/${meetingId}`);
  },
  end: async (meetingId: string) => {
    return axios.delete<{ data: any }>(`/watch/meeting/${meetingId}`);
  }
};

export const mediaSessionApi = {
  create: async (mediaUrl: string, workspaceId: string, channelId?: string) => {
    return axios.post<{ data: WatchSession }>('/watch', { mediaUrl, workspaceId, channelId });
  },
  
  getChannelSession: async (channelId: string) => {
    return axios.get<{ data: WatchSession | null }>(`/watch/channel/${channelId}`);
  },
  
  get: async (id: string) => {
    return axios.get<{ data: WatchSession }>(`/watch/${id}`);
  },
  
  end: async (id: string) => {
    return axios.delete<{ data: any }>(`/watch/${id}`);
  }
};
