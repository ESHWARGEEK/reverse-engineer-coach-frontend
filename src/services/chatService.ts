import api from '../utils/api';
import { ChatMessage } from '../components/chat/ChatInterface';

export interface CoachQuestion {
  question: string;
  projectId: string;
  currentTaskId?: string;
  userLanguage?: string;
  contextHint?: string;
}

export interface CoachResponse {
  answer: string;
  confidence: number;
  contextUsed: Array<{
    type: string;
    source: string;
    relevance: number;
  }>;
  hints: string[];
  suggestedActions: string[];
  needsMoreContext: boolean;
  languageAdapted: boolean;
}

export interface WebSocketMessage {
  type: 'question' | 'response' | 'typing' | 'error';
  data: any;
  messageId?: string;
}

export class ChatService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // Event handlers
  private onMessageHandler?: (message: WebSocketMessage) => void;
  private onConnectedHandler?: () => void;
  private onDisconnectedHandler?: () => void;
  private onErrorHandler?: (error: string) => void;

  constructor() {
    this.connect();
  }

  // WebSocket connection management
  connect() {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/api/coach/ws';
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Chat WebSocket connected');
        this.reconnectAttempts = 0;
        this.onConnectedHandler?.();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.onMessageHandler?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.onErrorHandler?.('Failed to parse message from server');
        }
      };
      
      this.ws.onclose = () => {
        console.log('Chat WebSocket disconnected');
        this.onDisconnectedHandler?.();
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
        this.onErrorHandler?.('WebSocket connection error');
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.onErrorHandler?.('Failed to connect to chat service');
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.onErrorHandler?.('Unable to reconnect to chat service');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Send message via WebSocket
  sendMessage(question: CoachQuestion, messageId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message: WebSocketMessage = {
      type: 'question',
      data: question,
      messageId
    };

    this.ws.send(JSON.stringify(message));
  }

  // HTTP API fallback for asking questions
  async askQuestion(question: CoachQuestion): Promise<CoachResponse> {
    try {
      const response = await api.post('/api/coach/ask', question);
      return response.data;
    } catch (error: any) {
      console.error('Error asking coach question:', error);
      throw new Error(error.response?.data?.detail || 'Failed to get response from coach');
    }
  }

  // Get chat history for a project
  async getChatHistory(projectId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/api/coach/history/${projectId}`);
      return response.data.messages || [];
    } catch (error: any) {
      console.error('Error fetching chat history:', error);
      // Return empty array if history doesn't exist yet
      if (error.response?.status === 404) {
        return [];
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch chat history');
    }
  }

  // Save chat message to history
  async saveChatMessage(projectId: string, message: ChatMessage): Promise<void> {
    try {
      await api.post(`/api/coach/history/${projectId}`, {
        message: {
          content: message.content,
          sender: message.sender,
          timestamp: message.timestamp.toISOString(),
          contextUsed: message.contextUsed,
          hints: message.hints,
          suggestedActions: message.suggestedActions
        }
      });
    } catch (error: any) {
      console.error('Error saving chat message:', error);
      // Don't throw error for save failures - it's not critical
    }
  }

  // Event handler setters
  onMessage(handler: (message: WebSocketMessage) => void) {
    this.onMessageHandler = handler;
  }

  onConnected(handler: () => void) {
    this.onConnectedHandler = handler;
  }

  onDisconnected(handler: () => void) {
    this.onDisconnectedHandler = handler;
  }

  onError(handler: (error: string) => void) {
    this.onErrorHandler = handler;
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const chatService = new ChatService();