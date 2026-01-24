import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ChatMessage } from '../components/chat/ChatInterface';

export interface ChatState {
  // Chat messages by project ID
  messagesByProject: Record<string, ChatMessage[]>;
  
  // Current chat state
  currentProjectId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  
  // WebSocket connection state
  isConnected: boolean;
  connectionError: string | null;
}

export interface ChatActions {
  // Message management
  addMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (projectId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: (projectId: string) => void;
  
  // Chat state management
  setCurrentProject: (projectId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  
  // WebSocket state management
  setConnected: (connected: boolean) => void;
  setConnectionError: (error: string | null) => void;
  
  // Utility functions
  getCurrentMessages: () => ChatMessage[];
  generateMessageId: () => string;
}

type ChatStore = ChatState & ChatActions;

const initialState: ChatState = {
  messagesByProject: {},
  currentProjectId: null,
  isLoading: false,
  isTyping: false,
  error: null,
  isConnected: false,
  connectionError: null,
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Message management
      addMessage: (projectId, message) => {
        const messageId = get().generateMessageId();
        const fullMessage: ChatMessage = {
          ...message,
          id: messageId,
          timestamp: new Date(),
        };
        
        set((state) => ({
          messagesByProject: {
            ...state.messagesByProject,
            [projectId]: [
              ...(state.messagesByProject[projectId] || []),
              fullMessage
            ]
          }
        }));
      },
      
      updateMessage: (projectId, messageId, updates) => {
        set((state) => ({
          messagesByProject: {
            ...state.messagesByProject,
            [projectId]: (state.messagesByProject[projectId] || []).map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            )
          }
        }));
      },
      
      clearMessages: (projectId) => {
        set((state) => ({
          messagesByProject: {
            ...state.messagesByProject,
            [projectId]: []
          }
        }));
      },
      
      // Chat state management
      setCurrentProject: (projectId) => set({ currentProjectId: projectId }),
      setLoading: (isLoading) => set({ isLoading }),
      setTyping: (isTyping) => set({ isTyping }),
      setError: (error) => set({ error }),
      
      // WebSocket state management
      setConnected: (isConnected) => set({ isConnected }),
      setConnectionError: (connectionError) => set({ connectionError }),
      
      // Utility functions
      getCurrentMessages: () => {
        const state = get();
        if (!state.currentProjectId) return [];
        return state.messagesByProject[state.currentProjectId] || [];
      },
      
      generateMessageId: () => {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      },
    }),
    { name: 'chat-store' }
  )
);