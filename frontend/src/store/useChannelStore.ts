import { create } from 'zustand';
import axiosInstance from '../api/axios';

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: 'GENERAL' | 'TEXT' | 'ANNOUNCEMENT';
  isArchived: boolean;
}

export interface PinnedChannel {
  id: string;
  channelId: string;
  channel: Channel;
}

interface ChannelState {
  channels: Channel[];
  activeChannel: Channel | null;
  pinnedChannels: PinnedChannel[];
  isLoading: boolean;
  fetchChannels: (workspaceId: string) => Promise<void>;
  fetchPinnedChannels: (workspaceId: string) => Promise<void>;
  pinChannel: (workspaceId: string, channelId: string) => Promise<void>;
  unpinChannel: (workspaceId: string, channelId: string) => Promise<void>;
  setActiveChannel: (channel: Channel | null) => void;
  createChannel: (workspaceId: string, data: any) => Promise<Channel>;
  addChannel: (channel: Channel) => void;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  pinnedChannels: [],
  activeChannel: null,
  isLoading: false,
  fetchChannels: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/channels`);
      set({ channels: response.data.data });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  fetchPinnedChannels: async (workspaceId) => {
    try {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/pinned-channels`);
      set({ pinnedChannels: response.data.data });
    } catch (error) {
      console.error(error);
    }
  },
  pinChannel: async (workspaceId, channelId) => {
    try {
      const response = await axiosInstance.post(`/workspaces/${workspaceId}/channels/${channelId}/pin`);
      set((state) => ({ pinnedChannels: [response.data.data, ...state.pinnedChannels] }));
    } catch (error) {
      console.error(error);
    }
  },
  unpinChannel: async (workspaceId, channelId) => {
    try {
      await axiosInstance.delete(`/workspaces/${workspaceId}/channels/${channelId}/pin`);
      set((state) => ({ pinnedChannels: state.pinnedChannels.filter(pc => pc.channelId !== channelId) }));
    } catch (error) {
      console.error(error);
    }
  },
  setActiveChannel: (channel) => set({ activeChannel: channel }),
  createChannel: async (workspaceId, data) => {
    const response = await axiosInstance.post(`/workspaces/${workspaceId}/channels`, data);
    const newChannel = response.data.data;
    set((state) => {
      if (state.channels.some(c => c.id === newChannel.id)) return state;
      return { channels: [...state.channels, newChannel] };
    });
    return newChannel;
  },
  addChannel: (channel) => set((state) => {
    if (state.channels.some(c => c.id === channel.id)) return state;
    return { channels: [...state.channels, channel] };
  })
}));
