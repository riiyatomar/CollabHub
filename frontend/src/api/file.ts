import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = 'http://localhost:5000/api/v1';

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const fileApi = {
  uploadFiles: async (files: File[], workspaceId?: string, channelId?: string, onUploadProgress?: (progressEvent: any) => void) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    if (workspaceId) formData.append('workspaceId', workspaceId);
    if (channelId) formData.append('channelId', channelId);

    const res = await axios.post(`${BASE_URL}/files/upload`, formData, {
      headers: {
        ...getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  getWorkspaceFiles: async (workspaceId: string) => {
    const res = await axios.get(`${BASE_URL}/files/workspaces/${workspaceId}`, {
      headers: getHeaders(),
    });
    return res.data;
  },

  getChannelFiles: async (channelId: string) => {
    const res = await axios.get(`${BASE_URL}/files/channels/${channelId}`, {
      headers: getHeaders(),
    });
    return res.data;
  },

  deleteFile: async (fileId: string) => {
    const res = await axios.delete(`${BASE_URL}/files/${fileId}`, {
      headers: getHeaders(),
    });
    return res.data;
  },

  renameFile: async (fileId: string, filename: string) => {
    const res = await axios.patch(`${BASE_URL}/files/${fileId}/rename`, { filename }, {
      headers: getHeaders(),
    });
    return res.data;
  },
};
