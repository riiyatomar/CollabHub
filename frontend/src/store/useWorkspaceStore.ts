import { create } from 'zustand';
import axiosInstance from '../api/axios';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  inviteCode: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  fetchWorkspaces: () => Promise<void>;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (data: any) => Promise<Workspace>;
  joinWorkspace: (token: string) => Promise<string>;
  inviteMember: (workspaceId: string, email: string, role: string) => Promise<string>;
  members: any[];
  fetchWorkspaceMembers: (workspaceId: string) => Promise<void>;
  uploadLogo: (workspaceId: string, file: File) => Promise<Workspace>;
  removeLogo: (workspaceId: string) => Promise<Workspace>;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  members: [],
  activeWorkspace: null,
  isLoading: false,
  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get('/workspaces/me');
      set({ workspaces: response.data.data });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),
  createWorkspace: async (data) => {
    const response = await axiosInstance.post('/workspaces', data);
    const newWorkspace = response.data.data;
    set((state) => ({ workspaces: [...state.workspaces, newWorkspace] }));
    return newWorkspace;
  },
  joinWorkspace: async (token) => {
    const response = await axiosInstance.post(`/workspaces/invite/${token}/accept`);
    const { workspaceId } = response.data.data;
    await useWorkspaceStore.getState().fetchWorkspaces();
    return workspaceId;
  },
  inviteMember: async (workspaceId, email, role) => {
    const response = await axiosInstance.post(`/workspaces/${workspaceId}/invite`, { email, role });
    return response.data.data.inviteLink;
  },
  fetchWorkspaceMembers: async (workspaceId) => {
    try {
      const response = await axiosInstance.get(`/workspaces/${workspaceId}/members`);
      set({ members: response.data.data });
    } catch (error) {
      console.error(error);
    }
  },
  uploadLogo: async (workspaceId, file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await axiosInstance.post(`/workspaces/${workspaceId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const updated = response.data.data;
    set(state => ({
      activeWorkspace: state.activeWorkspace?.id === workspaceId ? updated : state.activeWorkspace,
      workspaces: state.workspaces.map(w => w.id === workspaceId ? updated : w)
    }));
    return updated;
  },
  removeLogo: async (workspaceId) => {
    const response = await axiosInstance.delete(`/workspaces/${workspaceId}/logo`);
    const updated = response.data.data;
    set(state => ({
      activeWorkspace: state.activeWorkspace?.id === workspaceId ? updated : state.activeWorkspace,
      workspaces: state.workspaces.map(w => w.id === workspaceId ? updated : w)
    }));
    return updated;
  }
}));
