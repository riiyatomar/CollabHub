import api from './axios';

export interface Integration {
  id: string;
  workspaceId: string;
  provider: 'GOOGLE' | 'GITHUB' | 'SLACK';
  accessToken: string | null;
  refreshToken: string | null;
  config: any;
  createdAt: string;
  updatedAt: string;
}

export const integrationsApi = {
  getWorkspaceIntegrations: (workspaceId: string) => 
    api.get(`/workspaces/${workspaceId}/integrations`),
  
  connectIntegration: (workspaceId: string, data: Partial<Integration>) => 
    api.post(`/workspaces/${workspaceId}/integrations`, data),
  
  disconnectIntegration: (integrationId: string) => 
    api.delete(`/integrations/${integrationId}`)
};
