import api from './axios';

export interface SearchResults {
  messages: any[];
  files: any[];
  channels: any[];
  members: any[];
}

export const searchApi = {
  globalSearch: (query: string, type: string = 'all', workspaceId?: string) => 
    api.get<{ data: SearchResults }>(`/search`, { params: { q: query, type, workspaceId } }),
};
