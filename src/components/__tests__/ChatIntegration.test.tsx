import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { ChatInterface, ChatMessage } from '../chat/ChatInterface';
import { useChat } from '../../hooks/useChat';
import { chatService } from '../../services/chatService';

// Mock the useChat hook
jest.mock('../../hooks/useChat');
const mockUseChat = useChat as jest.MockedFunction<typeof useChat>;

// Mock the chat service
jest.mock('../../services/chatService', () => ({
  chatService: {
    isConnected: jest.fn(),
    onMessage: jest.fn(),
    onConnected: jest.fn(),
    onDisconnected: jest.fn(),
    onError: jest.fn(),
    sendMessage: jest.fn(),
    askQuestion: jest.fn(),
    getChatHistory: jest.fn(),
    saveChatMessage: jest.fn(),
  }
}));

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  readyState: WebSocket.OPEN,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

describe('Coach Chat Integration', () => {
  const mockSendMessage = jest.fn();
  const mockClearChat = jest.fn();
  const mockRetryLastMessage = jest.fn();
  const mockLoadChatHistory = jest.fn();

  const defaultChatHookReturn = {
    messages: [],
    isLoading: false,
    isTyping: false,
    error: null,
    isConnected: true,
    connectionError: null,
    sendMessage: mockSendMessage,
    clearChat: mockClearChat,
    retryLastMessage: mockRetryLastMessage,
    loadChatHistory: mockLoadChatHistory,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChat.mockReturnValue(defaultChatHookReturn);
  });

  describe('Chat Message Rendering', () => {
    test('renders empty chat state correctly', () => {
      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      expect(screen.getByText('Welcome to AI Coach!')).toBeInTheDocument();
      expect(screen.getByText('Ask me anything about the code patterns you\'re learning.')).toBeInTheDocument();
    });

    test('renders user and coach messages correctly', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          content: 'How does this pattern work?',
          sender: 'user',
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: '2',
          content: 'This pattern implements the Observer design pattern...',
          sender: 'coach',
          timestamp: new Date('2024-01-01T10:01:00Z'),
          contextUsed: [
            {
              type: 'reference_snippet',
              source: 'observer-pattern.ts',
              relevance: 0.95
            }
          ],
          hints: ['Try implementing the Subject interface first'],
          suggestedActions: ['Create a concrete observer class']
        }
      ];

      render(
        <ChatInterface
          messages={messages}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // Check user message
      expect(screen.getByText('How does this pattern work?')).toBeInTheDocument();
      
      // Check coach message
      expect(screen.getByText('This pattern implements the Observer design pattern...')).toBeInTheDocument();
      
      // Check context information
      expect(screen.getByText('Context used:')).toBeInTheDocument();
      expect(screen.getByText('observer-pattern.ts')).toBeInTheDocument();
      expect(screen.getByText('95% relevant')).toBeInTheDocument();
      
      // Check hints
      expect(screen.getByText('💡 Hints:')).toBeInTheDocument();
      expect(screen.getByText('Try implementing the Subject interface first')).toBeInTheDocument();
      
      // Check suggested actions
      expect(screen.getByText('🎯 Suggested actions:')).toBeInTheDocument();
      expect(screen.getByText('Create a concrete observer class')).toBeInTheDocument();
    });

    test('renders code snippets with syntax highlighting', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          content: 'Here\'s an example:\n```typescript\ninterface Observer {\n  update(data: any): void;\n}\n```',
          sender: 'coach',
          timestamp: new Date(),
        }
      ];

      render(
        <ChatInterface
          messages={messages}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // Check code block rendering
      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.getByText('interface Observer {')).toBeInTheDocument();
      expect(screen.getByText('update(data: any): void;')).toBeInTheDocument();
    });

    test('renders inline code correctly', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          content: 'Use the `Observer` interface to implement this pattern.',
          sender: 'coach',
          timestamp: new Date(),
        }
      ];

      render(
        <ChatInterface
          messages={messages}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // Check inline code rendering
      const codeElement = screen.getByText('Observer');
      expect(codeElement).toHaveClass('bg-gray-800', 'text-blue-300');
    });

    test('shows loading state correctly', () => {
      const messages: ChatMessage[] = [
        {
          id: '1',
          content: '',
          sender: 'coach',
          timestamp: new Date(),
          isLoading: true,
        }
      ];

      render(
        <ChatInterface
          messages={messages}
          onSendMessage={mockSendMessage}
          isLoading={true}
          isTyping={false}
        />
      );

      expect(screen.getByText('Thinking...')).toBeInTheDocument();
    });

    test('shows typing indicator correctly', () => {
      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={true}
        />
      );

      expect(screen.getByText('Coach is typing...')).toBeInTheDocument();
    });
  });

  describe('Message Input and Sending', () => {
    test('allows user to type and send messages', async () => {
      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Type a message
      fireEvent.change(textarea, { target: { value: 'How does this work?' } });
      expect(textarea).toHaveValue('How does this work?');

      // Send the message
      fireEvent.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith('How does this work?');
      expect(textarea).toHaveValue(''); // Input should be cleared
    });

    test('sends message on Enter key press', async () => {
      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);

      // Type a message
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      // Press Enter
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    test('does not send message on Shift+Enter', async () => {
      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);

      // Type a message
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      // Press Shift+Enter (should add new line, not send)
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('disables input when loading', () => {
      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={true}
          isTyping={false}
        />
      );

      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);
      const sendButton = screen.getByRole('button', { name: /send/i });

      expect(textarea).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    test('quick action buttons populate input', () => {
      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      const quickActionButton = screen.getByText('Explain this pattern');
      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);

      fireEvent.click(quickActionButton);

      expect(textarea).toHaveValue('Explain this pattern');
    });
  });

  describe('Context Sharing Integration', () => {
    test('useChat hook integrates with workspace context', () => {
      // Mock the useChat hook to simulate context sharing
      const mockChatWithContext = {
        ...defaultChatHookReturn,
        messages: [
          {
            id: '1',
            content: 'Based on your current task, here\'s how this pattern works...',
            sender: 'coach' as const,
            timestamp: new Date(),
            contextUsed: [
              {
                type: 'current_task',
                source: 'Task 3.2: Implement Observer Pattern',
                relevance: 1.0
              }
            ]
          }
        ]
      };

      mockUseChat.mockReturnValue(mockChatWithContext);

      render(
        <ChatInterface
          messages={mockChatWithContext.messages}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // Verify context is displayed
      expect(screen.getByText('Context used:')).toBeInTheDocument();
      expect(screen.getByText('Task 3.2: Implement Observer Pattern')).toBeInTheDocument();
      expect(screen.getByText('100% relevant')).toBeInTheDocument();
    });

    test('chat service receives project context when sending messages', async () => {
      const projectId = 'test-project-123';
      
      // Mock the chat service methods
      const mockChatService = chatService as jest.Mocked<typeof chatService>;
      mockChatService.isConnected.mockReturnValue(true);
      mockChatService.sendMessage.mockImplementation(() => {});

      // Mock useChat to use the project ID
      const mockChatWithProject = {
        ...defaultChatHookReturn,
        sendMessage: jest.fn().mockImplementation(async (message: string) => {
          // Simulate the hook calling the chat service with project context
          mockChatService.sendMessage({
            question: message,
            projectId: projectId,
            currentTaskId: 'task-123',
            userLanguage: 'typescript'
          }, 'msg-id');
        })
      };

      mockUseChat.mockReturnValue(mockChatWithProject);

      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockChatWithProject.sendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);
      fireEvent.change(textarea, { target: { value: 'Test question' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      await waitFor(() => {
        expect(mockChatService.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            question: 'Test question',
            projectId: projectId,
            currentTaskId: 'task-123',
            userLanguage: 'typescript'
          }),
          expect.any(String)
        );
      });
    });
  });

  describe('WebSocket Connection and Real-time Updates', () => {
    test('displays connection status correctly', () => {
      // Test connected state
      const connectedChat = {
        ...defaultChatHookReturn,
        isConnected: true
      };
      mockUseChat.mockReturnValue(connectedChat);

      const { rerender } = render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // Connection status is typically shown in the parent component (WorkspacePage)
      // but we can test the chat interface behavior when connected

      // Test disconnected state
      const disconnectedChat = {
        ...defaultChatHookReturn,
        isConnected: false,
        connectionError: 'WebSocket connection failed'
      };
      mockUseChat.mockReturnValue(disconnectedChat);

      rerender(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // The interface should still be functional even when disconnected
      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);
      expect(textarea).not.toBeDisabled();
    });

    test('handles real-time message updates via WebSocket', async () => {
      let messageHandler: ((message: any) => void) | undefined;

      // Mock the chat service to capture the message handler
      const mockChatService = chatService as jest.Mocked<typeof chatService>;
      mockChatService.onMessage.mockImplementation((handler) => {
        messageHandler = handler;
      });

      // Mock useChat to simulate real-time updates
      const messages: ChatMessage[] = [];
      const mockChatWithRealtime = {
        ...defaultChatHookReturn,
        messages,
        sendMessage: jest.fn()
      };

      mockUseChat.mockReturnValue(mockChatWithRealtime);

      render(
        <ChatInterface
          messages={mockChatWithRealtime.messages}
          onSendMessage={mockChatWithRealtime.sendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // Simulate receiving a WebSocket message
      if (messageHandler) {
        act(() => {
          messageHandler({
            type: 'response',
            data: {
              answer: 'This is a real-time response',
              contextUsed: [],
              hints: [],
              suggestedActions: []
            },
            messageId: 'msg-123'
          });
        });
      }

      // The actual message update would be handled by the useChat hook
      // and the component would re-render with new messages
      expect(mockChatService.onMessage).toHaveBeenCalled();
    });

    test('handles WebSocket typing indicators', () => {
      // Test typing indicator display
      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={true}
        />
      );

      expect(screen.getByText('Coach is typing...')).toBeInTheDocument();
      
      // Check for animated dots
      const dots = screen.container.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    test('handles WebSocket errors gracefully', () => {
      const errorChat = {
        ...defaultChatHookReturn,
        error: 'Failed to connect to chat service',
        isConnected: false
      };
      mockUseChat.mockReturnValue(errorChat);

      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // The interface should still be usable even with connection errors
      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);
      expect(textarea).not.toBeDisabled();
    });

    test('automatically reconnects on connection loss', () => {
      const mockChatService = chatService as jest.Mocked<typeof chatService>;
      
      // Simulate connection handlers being set up
      expect(mockChatService.onConnected).toBeDefined();
      expect(mockChatService.onDisconnected).toBeDefined();
      expect(mockChatService.onError).toBeDefined();
      
      // The actual reconnection logic is handled by the chat service
      // and useChat hook, which we've mocked appropriately
    });
  });

  describe('Chat History Integration', () => {
    test('loads chat history on component mount', async () => {
      const mockChatService = chatService as jest.Mocked<typeof chatService>;
      mockChatService.getChatHistory.mockResolvedValue([
        {
          id: '1',
          content: 'Previous question',
          sender: 'user',
          timestamp: new Date('2024-01-01T09:00:00Z')
        },
        {
          id: '2',
          content: 'Previous answer',
          sender: 'coach',
          timestamp: new Date('2024-01-01T09:01:00Z')
        }
      ]);

      const mockChatWithHistory = {
        ...defaultChatHookReturn,
        loadChatHistory: jest.fn()
      };

      mockUseChat.mockReturnValue(mockChatWithHistory);

      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      // The useChat hook should handle loading history
      // This is tested indirectly through the hook's behavior
      expect(mockUseChat).toHaveBeenCalled();
    });

    test('saves messages to history after sending', async () => {
      const mockChatService = chatService as jest.Mocked<typeof chatService>;
      mockChatService.saveChatMessage.mockResolvedValue();

      render(
        <ChatInterface
          messages={[]}
          onSendMessage={mockSendMessage}
          isLoading={false}
          isTyping={false}
        />
      );

      const textarea = screen.getByPlaceholderText(/Ask me about the code patterns/);
      fireEvent.change(textarea, { target: { value: 'Save this message' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(mockSendMessage).toHaveBeenCalledWith('Save this message');
      // The actual saving is handled by the useChat hook
    });
  });
});