import { create } from 'zustand';
import axiosInstance from '../api/axios';
import type { Workspace } from './useWorkspaceStore';

interface WorkspaceAdminState {
  isLoading: boolean;
  error: string | null;
  
  updateWorkspaceSettings: (workspaceId: string, data: Partial<Workspace>) => Promise<Workspace>;
  uploadBanner: (workspaceId: string, file: File) => Promise<Workspace>;
  removeBanner: (workspaceId: string) => Promise<Workspace>;
  transferOwnership: (workspaceId: string, newOwnerId: string) => Promise<void>;
  
  updateMemberRole: (workspaceId: string, memberId: string, role: string) => Promise<any>;
  moderateMember: (workspaceId: string, memberId: string, data: { isMuted?: boolean; isSuspended?: boolean; isBanned?: boolean }) => Promise<any>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;

  getInvitations: (workspaceId: string) => Promise<any[]>;
  revokeInvitation: (workspaceId: string, invitationId: string) => Promise<void>;
  
  clearError: () => void;
}

export const useWorkspaceAdminStore = create<WorkspaceAdminState>((set) => ({
  isLoading: false,
  error: null,

  updateWorkspaceSettings: async (workspaceId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put(`/workspaces/${workspaceId}`, data);
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update workspace settings' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  uploadBanner: async (workspaceId, file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('banner', file);
      const response = await axiosInstance.post(`/workspaces/${workspaceId}/banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to upload banner' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeBanner: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.delete(`/workspaces/${workspaceId}/banner`);
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to remove banner' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  transferOwnership: async (workspaceId, newOwnerId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.post(`/workspaces/${workspaceId}/transfer-ownership`, { newOwnerId });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to transfer ownership' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateMemberRole: async (workspaceId, memberId, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put(`/workspaces/${workspaceId}/members/${memberId}/role`, { role });
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update role' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  moderateMember: async (workspaceId, memberId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put(`/workspaces/${workspaceId}/members/${memberId}/moderate`, data);
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to moderate member' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  removeMember: async (workspaceId, memberId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/workspaces/${workspaceId}/members/${memberId}`);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to remove member' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getInvitations: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/invitations`);
      return response.data.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to get invitations' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  revokeInvitation: async (workspaceId, invitationId) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to revoke invitation' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
