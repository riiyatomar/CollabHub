import api from './axios';

export interface Bookmark {
  id: string;
  userId: string;
  messageId?: string;
  channelId?: string;
  fileId?: string;
  workspaceId?: string;
  category?: string;
  note?: string;
  createdAt: string;
  message?: any;
  channel?: any;
  file?: any;
}

export const bookmarkApi = {
  getBookmarks: (workspaceId?: string) => 
    api.get<{ data: Bookmark[] }>(`/bookmarks`, { params: { workspaceId } }),
    
  createBookmark: (data: { messageId?: string, channelId?: string, fileId?: string, workspaceId?: string, category?: string, note?: string }) => 
    api.post<{ data: Bookmark }>(`/bookmarks`, data),
    
  deleteBookmark: (bookmarkId: string) => 
    api.delete(`/bookmarks/${bookmarkId}`),
};
