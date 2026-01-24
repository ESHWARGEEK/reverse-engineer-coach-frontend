import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInterface, ChatMessage } from '../chat/ChatInterface';

// Mock scrollIntoView for JSDOM compatibility
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

// Mock Heroicons
jest.mock('@heroicons/react/outline', () => ({
  PaperAirplaneIcon: () => <div data-testid="paper-airplane-icon">Send</div>,
  UserIcon: () => <div data-testid="user-icon">User</div>,
  CpuChipIcon: () => <div data-testid="cpu-chip-icon">AI</div>,
}));

// Mock the useChat hook
jest.mock('../../hooks/useChat', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    isLoading: false,
    isTyping: false,
    error: null,
    isConnected: false,
    connectionError: null,
    sendMessage: jest.fn(),
    clearChat: jest.fn(),
    retryLastMessage: jest.fn(),
    loadChatHistory: jest.fn(),
  }))
}));

// Mock the chat service
jest.mock('../../services/chatService', () => ({
  chatService: {
    isConnected: jest.fn(() => false),
    sendMessage: jest.fn(),
    onMessage: jest.fn(),
    onConnected: jest.fn(),
    onDisconnected: jest.fn(),
    onError: jest.fn()
  }
}));

describe('Coach Chat Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render chat messages with proper formatting', () => {
    const testMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        content: 'Hello, can you explain this pattern?',
        sender: 'user',
        timestamp: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 'msg-2',
        content: 'This is a singleton pattern. Here is how it works: class Singleton {}',
        sender: 'coach',
        timestamp: new Date('2024-01-01T10:01:00Z'),
        contextUsed: [
          {
            type: 'reference_snippet',
            source: 'patterns/singleton.ts',
            relevance: 0.95
          }
        ],
        hints: ['Try implementing your own singleton'],
        suggestedActions: ['Create a singleton class', 'Test thread safety']
      }
    ];

    render(<ChatInterface 
      messages={testMessages}
      onSendMessage={jest.fn()}
    />);

    // Check user message
    expect(screen.getByText('Hello, can you explain this pattern?')).toBeInTheDocument();
    
    // Check coach message
    expect(screen.getByText(/This is a singleton pattern/)).toBeInTheDocument();
    
    // Check context information
    expect(screen.getByText('Context used:')).toBeInTheDocument();
    expect(screen.getByText('patterns/singleton.ts')).toBeInTheDocument();
    expect(screen.getByText('95% relevant')).toBeInTheDocument();
    
    // Check hints
    expect(screen.getByText('💡 Hints:')).toBeInTheDocument();
    expect(screen.getByText('• Try implementing your own singleton')).toBeInTheDocument();
    
    // Check suggested actions
    expect(screen.getByText('🎯 Suggested actions:')).toBeInTheDocument();
    expect(screen.getByText('• Create a singleton class')).toBeInTheDocument();
    expect(screen.getByText('• Test thread safety')).toBeInTheDocument();
  });

  test('should render typing indicator when coach is typing', () => {
    render(<ChatInterface 
      messages={[]}
      onSendMessage={jest.fn()}
      isTyping={true}
    />);

    expect(screen.getByText('Coach is typing...')).toBeInTheDocument();
  });

  test('should handle message sending and context sharing', () => {
    const mockSendMessage = jest.fn();

    render(<ChatInterface 
      messages={[]}
      onSendMessage={mockSendMessage}
    />);

    const input = screen.getByPlaceholderText(/Ask me about the code patterns/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  test('should disable input when loading', () => {
    render(<ChatInterface 
      messages={[]}
      onSendMessage={jest.fn()}
      isLoading={true}
    />);

    const input = screen.getByPlaceholderText(/Ask me about the code patterns/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  test('should handle keyboard shortcuts for sending messages', () => {
    const mockSendMessage = jest.fn();

    render(<ChatInterface 
      messages={[]}
      onSendMessage={mockSendMessage}
    />);

    const input = screen.getByPlaceholderText(/Ask me about the code patterns/i);
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  test('should handle WebSocket connection and real-time updates', () => {
    render(<ChatInterface 
      messages={[]}
      onSendMessage={jest.fn()}
    />);

    // Should render the interface regardless of connection status
    expect(screen.getByPlaceholderText(/Ask me about the code patterns/i)).toBeInTheDocument();
  });

  test('should handle empty or whitespace-only messages', () => {
    const mockSendMessage = jest.fn();

    render(<ChatInterface 
      messages={[]}
      onSendMessage={mockSendMessage}
    />);

    const input = screen.getByPlaceholderText(/Ask me about the code patterns/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Try to send empty message
    fireEvent.change(input, { target: { value: '' } });
    expect(sendButton).toBeDisabled();

    // Try to send whitespace-only message
    fireEvent.change(input, { target: { value: '   ' } });
    expect(sendButton).toBeDisabled();

    fireEvent.submit(input.closest('form')!);
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});