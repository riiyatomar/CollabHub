import { create } from 'zustand';
import { type Bookmark, bookmarkApi } from '../api/bookmark';

interface BookmarkState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  
  fetchBookmarks: (workspaceId?: string) => Promise<void>;
  createBookmark: (data: { messageId?: string, channelId?: string, fileId?: string, workspaceId?: string, category?: string, note?: string }) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>((set) => ({
  bookmarks: [],
  isLoading: false,
  error: null,

  fetchBookmarks: async (workspaceId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await bookmarkApi.getBookmarks(workspaceId);
      set({ bookmarks: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch bookmarks', isLoading: false });
    }
  },

  createBookmark: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await bookmarkApi.createBookmark(data);
      set((state) => ({ 
        bookmarks: [response.data.data, ...state.bookmarks],
        isLoading: false 
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to add bookmark', isLoading: false });
      throw error;
    }
  },

  deleteBookmark: async (id: string) => {
    try {
      await bookmarkApi.deleteBookmark(id);
      set((state) => ({
        bookmarks: state.bookmarks.filter(b => b.id !== id)
      }));
    } catch (error: any) {
      console.error('Failed to delete bookmark', error);
    }
  }
}));
