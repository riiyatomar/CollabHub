import apiClient from './axios';

export const userApi = {
  getMe: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
  changePassword: async (data: any) => {
    const response = await apiClient.put('/users/password', data);
    return response.data;
  },
  deleteAccount: async () => {
    const response = await apiClient.delete('/users/account');
    return response.data;
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  removeAvatar: async () => {
    const response = await apiClient.delete('/users/avatar');
    return response.data;
  }
};
