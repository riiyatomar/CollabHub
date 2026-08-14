import api from './axios';

export interface AiMessage {
  id: string;
  role: 'USER' | 'MODEL' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string;
  createdAt: string;
  messages: AiMessage[];
}

export const aiApi = {
  getConversations: (workspaceId: string) => 
    api.get(`/ai/workspaces/${workspaceId}/conversations`).then(res => res.data.data),
    
  getMessages: (conversationId: string) => 
    api.get(`/ai/conversations/${conversationId}/messages`).then(res => res.data.data),
    
  createConversation: (workspaceId: string, title?: string) => 
    api.post('/ai/conversations', { workspaceId, title }).then(res => res.data.data),
    
  sendMessage: (conversationId: string, workspaceId: string, content: string) => 
    api.post(`/ai/conversations/${conversationId}/messages`, { workspaceId, content }).then(res => res.data.data),
    
  summarizeChannel: (workspaceId: string, channelId: string) => 
    api.post('/ai/summarize/channel', { workspaceId, channelId }).then(res => res.data.data),
    
  deleteConversation: (conversationId: string) =>
    api.delete(`/ai/conversations/${conversationId}`).then(res => res.data.data),
};
