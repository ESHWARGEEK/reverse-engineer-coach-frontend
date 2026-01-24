import { useEffect, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { chatService, CoachQuestion, WebSocketMessage } from '../services/chatService';
import { ChatMessage } from '../components/chat/ChatInterface';
import { useAppStore } from '../store';

export const useChat = (projectId: string) => {
  const {
    getCurrentMessages,
    addMessage,
    updateMessage,
    setCurrentProject,
    setLoading,
    setTyping,
    setError,
    setConnected,
    setConnectionError,
    isLoading,
    isTyping,
    error,
    isConnected,
    connectionError
  } = useChatStore();

  const { workspace } = useAppStore();

  // Set current project when hook is used
  useEffect(() => {
    setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  // Setup WebSocket event handlers
  useEffect(() => {
    const handleMessage = (wsMessage: WebSocketMessage) => {
      switch (wsMessage.type) {
        case 'response':
          // Update the loading message with the actual response
          if (wsMessage.messageId) {
            updateMessage(projectId, wsMessage.messageId, {
              content: wsMessage.data.answer,
              isLoading: false,
              contextUsed: wsMessage.data.contextUsed,
              hints: wsMessage.data.hints,
              suggestedActions: wsMessage.data.suggestedActions
            });
          }
          setLoading(false);
          setTyping(false);
          break;

        case 'typing':
          setTyping(wsMessage.data.isTyping);
          break;

        case 'error':
          setError(wsMessage.data.message);
          setLoading(false);
          setTyping(false);
          
          // Update loading message to show error
          if (wsMessage.messageId) {
            updateMessage(projectId, wsMessage.messageId, {
              content: `Sorry, I encountered an error: ${wsMessage.data.message}`,
              isLoading: false
            });
          }
          break;
      }
    };

    const handleConnected = () => {
      setConnected(true);
      setConnectionError(null);
    };

    const handleDisconnected = () => {
      setConnected(false);
    };

    const handleError = (error: string) => {
      setConnectionError(error);
      setConnected(false);
    };

    // Set up event handlers
    chatService.onMessage(handleMessage);
    chatService.onConnected(handleConnected);
    chatService.onDisconnected(handleDisconnected);
    chatService.onError(handleError);

    // Initial connection status
    setConnected(chatService.isConnected());

    // Load chat history when component mounts
    loadChatHistory();

    return () => {
      // Cleanup is handled by the service singleton
    };
  }, [projectId, updateMessage, setLoading, setTyping, setError, setConnected, setConnectionError]);

  // Load chat history from server
  const loadChatHistory = useCallback(async () => {
    try {
      const history = await chatService.getChatHistory(projectId);
      // Clear existing messages and add history
      useChatStore.getState().clearMessages(projectId);
      history.forEach(message => {
        addMessage(projectId, {
          content: message.content,
          sender: message.sender,
          contextUsed: message.contextUsed,
          hints: message.hints,
          suggestedActions: message.suggestedActions
        });
      });
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Don't show error to user for history loading failures
    }
  }, [projectId, addMessage]);

  // Send a message to the coach
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      content: content.trim(),
      sender: 'user'
    };
    addMessage(projectId, userMessage);

    // Save user message to history
    try {
      await chatService.saveChatMessage(projectId, {
        ...userMessage,
        id: useChatStore.getState().generateMessageId(),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Add loading coach message
    const coachMessageId = useChatStore.getState().generateMessageId();
    const loadingMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      content: '',
      sender: 'coach',
      isLoading: true
    };
    
    addMessage(projectId, { ...loadingMessage });
    setLoading(true);
    setError(null);

    // Prepare coach question
    const question: CoachQuestion = {
      question: content.trim(),
      projectId,
      currentTaskId: workspace.selectedTaskId || undefined,
      userLanguage: 'typescript', // TODO: Get from user preferences
    };

    try {
      if (isConnected) {
        // Use WebSocket for real-time communication
        chatService.sendMessage(question, coachMessageId);
      } else {
        // Fallback to HTTP API
        const response = await chatService.askQuestion(question);
        
        // Update the loading message with response
        updateMessage(projectId, coachMessageId, {
          content: response.answer,
          isLoading: false,
          contextUsed: response.contextUsed,
          hints: response.hints,
          suggestedActions: response.suggestedActions
        });

        setLoading(false);

        // Save coach response to history
        try {
          await chatService.saveChatMessage(projectId, {
            id: coachMessageId,
            content: response.answer,
            sender: 'coach',
            timestamp: new Date(),
            contextUsed: response.contextUsed,
            hints: response.hints,
            suggestedActions: response.suggestedActions
          });
        } catch (error) {
          console.error('Failed to save coach response:', error);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
      setLoading(false);
      
      // Update loading message to show error
      updateMessage(projectId, coachMessageId, {
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}`,
        isLoading: false
      });
    }
  }, [projectId, isLoading, isConnected, workspace.selectedTaskId, addMessage, updateMessage, setLoading, setError]);

  // Clear chat history
  const clearChat = useCallback(() => {
    useChatStore.getState().clearMessages(projectId);
  }, [projectId]);

  // Retry last message
  const retryLastMessage = useCallback(() => {
    const messages = getCurrentMessages();
    const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'user');
    
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  }, [getCurrentMessages, sendMessage]);

  return {
    // State
    messages: getCurrentMessages(),
    isLoading,
    isTyping,
    error,
    isConnected,
    connectionError,
    
    // Actions
    sendMessage,
    clearChat,
    retryLastMessage,
    loadChatHistory,
  };
};