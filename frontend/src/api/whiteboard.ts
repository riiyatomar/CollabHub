import api from './axios';

export interface Whiteboard {
  id: string;
  workspaceId: string;
  name: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    avatar?: string;
  };
  objects?: WhiteboardObject[];
}

export interface WhiteboardObject {
  id: string;
  whiteboardId: string;
  type: string;
  data: any;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export const whiteboardApi = {
  getWorkspaceWhiteboards: async (workspaceId: string) => {
    const response = await api.get<{ success: boolean; data: Whiteboard[] }>(`/workspaces/${workspaceId}/whiteboards`);
    return response.data.data;
  },

  createWhiteboard: async (workspaceId: string, name: string) => {
    const response = await api.post<{ success: boolean; data: Whiteboard }>(`/workspaces/${workspaceId}/whiteboards`, { name });
    return response.data.data;
  },

  getChannelWhiteboard: async (workspaceId: string, channelId: string) => {
    const response = await api.get<{ success: boolean; data: Whiteboard }>(`/workspaces/${workspaceId}/channels/${channelId}/whiteboard`);
    return response.data.data;
  },

  getWhiteboard: async (whiteboardId: string) => {
    const response = await api.get<{ success: boolean; data: Whiteboard }>(`/whiteboards/${whiteboardId}`);
    return response.data.data;
  },

  updateWhiteboard: async (whiteboardId: string, name: string) => {
    const response = await api.patch<{ success: boolean; data: Whiteboard }>(`/whiteboards/${whiteboardId}`, { name });
    return response.data.data;
  },

  deleteWhiteboard: async (whiteboardId: string) => {
    const response = await api.delete<{ success: boolean }>(`/whiteboards/${whiteboardId}`);
    return response.data.success;
  }
};
