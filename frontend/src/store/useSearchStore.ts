import { create } from 'zustand';
import { type SearchResults, searchApi } from '../api/search';

interface SearchState {
  results: SearchResults;
  isLoading: boolean;
  error: string | null;
  query: string;
  type: string;
  
  setQuery: (query: string) => void;
  setType: (type: string) => void;
  performSearch: (workspaceId?: string) => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  results: { messages: [], files: [], channels: [], members: [] },
  isLoading: false,
  error: null,
  query: '',
  type: 'all',

  setQuery: (query: string) => set({ query }),
  setType: (type: string) => set({ type }),

  performSearch: async (workspaceId?: string) => {
    const { query, type } = get();
    if (query.trim().length < 2) {
      set({ results: { messages: [], files: [], channels: [], members: [] }, error: null });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const response = await searchApi.globalSearch(query, type, workspaceId);
      set({ results: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to search', isLoading: false });
    }
  },

  clearResults: () => set({ results: { messages: [], files: [], channels: [], members: [] }, query: '' })
}));
