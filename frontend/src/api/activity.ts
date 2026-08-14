import api from './axios';

export interface ActivityLog {
  id: string;
  userId?: string;
  workspaceId?: string;
  channelId?: string;
  action: string;
  entityId?: string;
  entityType?: string;
  details?: any;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  channel?: {
    id: string;
    name: string;
    type: string;
  };
}

export const activityApi = {
  getWorkspaceActivity: (workspaceId: string, cursor?: string, limit = 20) => 
    api.get<{ data: { activities: ActivityLog[], nextCursor: string | null } }>(`/activity/${workspaceId}`, { params: { cursor, limit } }),
};
