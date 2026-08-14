import api from './axios';

export interface Webhook {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export const webhooksApi = {
  getWorkspaceWebhooks: (workspaceId: string) => 
    api.get(`/workspaces/${workspaceId}/webhooks`),
  
  createWebhook: (workspaceId: string, data: Partial<Webhook>) => 
    api.post(`/workspaces/${workspaceId}/webhooks`, data),
  
  updateWebhook: (webhookId: string, data: Partial<Webhook> & { rotateSecret?: boolean }) => 
    api.patch(`/webhooks/${webhookId}`, data),
  
  deleteWebhook: (webhookId: string) => 
    api.delete(`/webhooks/${webhookId}`)
};
