import api from './axios';

export interface WorkspaceInsights {
  messagesToday: number;
  filesUploaded: number;
  pendingNotifications: number;
  // Admin only
  totalMembers?: number;
  onlineMembers?: number;
  activeChannels?: number;
  storageUsed?: number;
  totalMessageVolume?: number;
}

export const insightApi = {
  getWorkspaceInsights: (workspaceId: string) => 
    api.get<{ data: WorkspaceInsights }>(`/insights/${workspaceId}`),
};
