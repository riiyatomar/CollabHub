import { create } from 'zustand';
import type { AiConversation, AiMessage } from '../api/ai';
import { aiApi } from '../api/ai';

interface AiState {
  conversations: AiConversation[];
  activeConversation: AiConversation | null;
  isLoading: boolean;
  isOpen: boolean;
  
  toggleOpen: () => void;
  fetchConversations: (workspaceId: string) => Promise<void>;
  createConversation: (workspaceId: string, title?: string) => Promise<void>;
  setActiveConversation: (conversation: AiConversation | null) => void;
  sendMessage: (workspaceId: string, content: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
}

export const useAiStore = create<AiState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  isLoading: false,
  isOpen: false,

  toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),

  fetchConversations: async (workspaceId: string) => {
    try {
      set({ isLoading: true });
      const conversations = await aiApi.getConversations(workspaceId);
      set({ conversations, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
    }
  },

  createConversation: async (workspaceId: string, title?: string) => {
    try {
      set({ isLoading: true });
      const newConv = await aiApi.createConversation(workspaceId, title);
      set(state => ({
        conversations: [newConv, ...state.conversations],
        activeConversation: { ...newConv, messages: [] },
        isLoading: false
      }));
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
    }
  },

  setActiveConversation: (conversation) => set({ activeConversation: conversation }),

  loadMessages: async (conversationId: string) => {
    try {
      set({ isLoading: true });
      const messages = await aiApi.getMessages(conversationId);
      const active = get().activeConversation;
      if (active && active.id === conversationId) {
        set({ activeConversation: { ...active, messages }, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
    }
  },

  sendMessage: async (workspaceId: string, content: string) => {
    const { activeConversation } = get();
    if (!activeConversation) return;

    const userMessage: AiMessage = {
      id: Date.now().toString(),
      role: 'USER',
      content,
      createdAt: new Date().toISOString()
    };

    set(state => ({
      activeConversation: {
        ...state.activeConversation!,
        messages: [...(state.activeConversation!.messages || []), userMessage]
      },
      isLoading: true
    }));

    try {
      const aiResponse = await aiApi.sendMessage(activeConversation.id, workspaceId, content);
      set(state => ({
        activeConversation: {
          ...state.activeConversation!,
          messages: [...(state.activeConversation!.messages || []), aiResponse]
        },
        isLoading: false
      }));
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
    }
  }
}));
