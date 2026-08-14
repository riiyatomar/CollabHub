import { create } from 'zustand';
import { integrationsApi } from '../api/integrations';
import type { Integration } from '../api/integrations';
import { webhooksApi } from '../api/webhooks';
import type { Webhook } from '../api/webhooks';

interface IntegrationState {
  integrations: Integration[];
  webhooks: Webhook[];
  isLoading: boolean;
  error: string | null;
  
  fetchIntegrations: (workspaceId: string) => Promise<void>;
  connectIntegration: (workspaceId: string, data: Partial<Integration>) => Promise<void>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  
  fetchWebhooks: (workspaceId: string) => Promise<void>;
  createWebhook: (workspaceId: string, data: Partial<Webhook>) => Promise<void>;
  updateWebhook: (webhookId: string, data: Partial<Webhook> & { rotateSecret?: boolean }) => Promise<void>;
  deleteWebhook: (webhookId: string) => Promise<void>;
}

export const useIntegrationStore = create<IntegrationState>((set) => ({
  integrations: [],
  webhooks: [],
  isLoading: false,
  error: null,

  fetchIntegrations: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await integrationsApi.getWorkspaceIntegrations(workspaceId);
      set({ integrations: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch integrations', isLoading: false });
    }
  },

  connectIntegration: async (workspaceId: string, data: Partial<Integration>) => {
    try {
      const response = await integrationsApi.connectIntegration(workspaceId, data);
      set(state => {
        const exists = state.integrations.find(i => i.provider === response.data.data.provider);
        if (exists) {
           return { integrations: state.integrations.map(i => i.id === exists.id ? response.data.data : i) };
        }
        return { integrations: [...state.integrations, response.data.data] };
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to connect integration');
    }
  },

  disconnectIntegration: async (integrationId: string) => {
    try {
      await integrationsApi.disconnectIntegration(integrationId);
      set(state => ({
        integrations: state.integrations.filter(i => i.id !== integrationId)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to disconnect integration');
    }
  },

  fetchWebhooks: async (workspaceId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await webhooksApi.getWorkspaceWebhooks(workspaceId);
      set({ webhooks: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch webhooks', isLoading: false });
    }
  },

  createWebhook: async (workspaceId: string, data: Partial<Webhook>) => {
    try {
      const response = await webhooksApi.createWebhook(workspaceId, data);
      set(state => ({ webhooks: [response.data.data, ...state.webhooks] }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create webhook');
    }
  },

  updateWebhook: async (webhookId: string, data: Partial<Webhook> & { rotateSecret?: boolean }) => {
    try {
      const response = await webhooksApi.updateWebhook(webhookId, data);
      set(state => ({
        webhooks: state.webhooks.map(w => (w.id === webhookId ? response.data.data : w))
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update webhook');
    }
  },

  deleteWebhook: async (webhookId: string) => {
    try {
      await webhooksApi.deleteWebhook(webhookId);
      set(state => ({
        webhooks: state.webhooks.filter(w => w.id !== webhookId)
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete webhook');
    }
  }
}));
