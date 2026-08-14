import { create } from 'zustand';
import axiosInstance from '../api/axios';
import type { UploadedFile } from './useFileStore';

export interface Reaction {
  emoji: string;
  userId: string;
  messageId: string;
}

export interface PinnedMessage {
  id: string;
  messageId: string;
  channelId: string;
  pinnedBy: {
    id: string;
    username: string;
  }
}

export interface Message {
  id: string;
  channelId: string;
  content: string;
  createdAt: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      username: string;
    }
  };
  reactions?: Reaction[];
  pinnedBy?: PinnedMessage;
  attachments?: UploadedFile[];
  _count?: {
    replies: number;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface MessageState {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  drafts: Record<string, string>; // channelId -> draft
  replyingTo: Record<string, Message | null>; // channelId -> Message
  typingUsers: Record<string, string[]>; // channelId -> array of userIds
  activeThread: Message | null;
  threadMessages: Message[];
  isThreadLoading: boolean;
  fetchMessages: (workspaceId: string, channelId: string, cursor?: string) => Promise<void>;
  fetchThreadReplies: (workspaceId: string, channelId: string, messageId: string) => Promise<void>;
  setActiveThread: (message: Message | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessageLocally: (messageId: string) => void;
  addReactionLocally: (messageId: string, reaction: Reaction) => void;
  removeReactionLocally: (messageId: string, emoji: string, userId: string) => void;
  setDraft: (channelId: string, draft: string) => void;
  setReplyingTo: (channelId: string, message: Message | null) => void;
  setTyping: (channelId: string, userId: string, isTyping: boolean) => void;
  setMessages: (messages: Message[]) => void;
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'read') => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  isLoading: false,
  hasMore: false,
  nextCursor: null,
  drafts: {},
  replyingTo: {},
  typingUsers: {},
  activeThread: null,
  threadMessages: [],
  isThreadLoading: false,

  fetchMessages: async (workspaceId, channelId, cursor) => {
    set({ isLoading: true });
    try {
      const url = `/workspaces/${workspaceId}/channels/${channelId}/messages`;
      const response = await axiosInstance.get(url, { params: { cursor } });
      const { messages, nextCursor } = response.data.data;
      
      set((state) => {
        // Simple deduplication logic when paginating
        const newMessages = messages.filter((m: Message) => !state.messages.some(existing => existing.id === m.id));
        return {
          messages: cursor ? [...state.messages, ...newMessages] : messages, // Keep order oldest to newest if API returns ordered correctly, or we might need sorting
          nextCursor,
          hasMore: !!nextCursor,
        };
      });
    } catch (error) {
      console.error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  addMessage: (message) => set((state) => {
    // Avoid duplicates
    if (state.messages.some(m => m.id === message.id)) return state;
    
    // If it's a thread reply for the active thread, add it there as well
    let newThreadMessages = state.threadMessages;
    if (state.activeThread && message.replyToId === state.activeThread.id) {
      if (!state.threadMessages.some(m => m.id === message.id)) {
        newThreadMessages = [...state.threadMessages, message];
      }
    }
    
    return { 
      messages: [...state.messages, message],
      threadMessages: newThreadMessages 
    };
  }),

  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map(m => m.id === messageId ? { ...m, ...updates } : m),
    threadMessages: state.threadMessages.map(m => m.id === messageId ? { ...m, ...updates } : m),
    activeThread: state.activeThread?.id === messageId ? { ...state.activeThread, ...updates } as Message : state.activeThread
  })),

  deleteMessageLocally: (messageId) => set((state) => ({
    messages: state.messages.map(m => m.id === messageId ? { ...m, isDeleted: true, content: '' } : m)
  })),

  addReactionLocally: (messageId, reaction) => set((state) => ({
    messages: state.messages.map(m => {
      if (m.id !== messageId) return m;
      const currentReactions = m.reactions || [];
      if (currentReactions.some(r => r.userId === reaction.userId && r.emoji === reaction.emoji)) return m;
      return { ...m, reactions: [...currentReactions, reaction] };
    })
  })),

  removeReactionLocally: (messageId, emoji, userId) => set((state) => ({
    messages: state.messages.map(m => {
      if (m.id !== messageId) return m;
      return { ...m, reactions: (m.reactions || []).filter(r => !(r.emoji === emoji && r.userId === userId)) };
    })
  })),

  setDraft: (channelId, draft) => set((state) => ({
    drafts: { ...state.drafts, [channelId]: draft }
  })),

  setReplyingTo: (channelId, message) => set((state) => ({
    replyingTo: { ...state.replyingTo, [channelId]: message }
  })),

  setTyping: (channelId, userId, isTyping) => set((state) => {
    const currentTyping = state.typingUsers[channelId] || [];
    let newTyping = currentTyping;
    if (isTyping && !currentTyping.includes(userId)) {
      newTyping = [...currentTyping, userId];
    } else if (!isTyping && currentTyping.includes(userId)) {
      newTyping = currentTyping.filter(id => id !== userId);
    }
    return { typingUsers: { ...state.typingUsers, [channelId]: newTyping } };
  }),

  setMessages: (messages) => set({ messages }),

  fetchThreadReplies: async (workspaceId, channelId, messageId) => {
    set({ isThreadLoading: true, threadMessages: [] });
    try {
      const url = `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/thread`;
      const response = await axiosInstance.get(url);
      set({ threadMessages: response.data.data });
    } catch (error) {
      console.error('Failed to fetch thread replies', error);
    } finally {
      set({ isThreadLoading: false });
    }
  },

  setActiveThread: (message) => set({ activeThread: message }),

  updateMessageStatus: (messageId, status) => set((state) => ({
    messages: state.messages.map(m => m.id === messageId ? { ...m, status } : m),
    threadMessages: state.threadMessages.map(m => m.id === messageId ? { ...m, status } : m),
    activeThread: state.activeThread?.id === messageId ? { ...state.activeThread, status } as Message : state.activeThread
  })),
}));
