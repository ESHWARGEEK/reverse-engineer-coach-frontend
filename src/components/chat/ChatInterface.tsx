import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { PaperAirplaneIcon, UserIcon, ChipIcon as CpuChipIcon } from '@heroicons/react/outline';
import { Button } from '../ui/Button';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'coach';
  timestamp: Date;
  isLoading?: boolean;
  contextUsed?: Array<{
    type: string;
    source: string;
    relevance: number;
  }>;
  hints?: string[];
  suggestedActions?: string[];
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  isTyping?: boolean;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  isTyping = false,
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderCodeSnippets = (content: string) => {
    // Split content by code blocks (```language...```)
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract language and code
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0].trim() || 'text';
        const code = lines.slice(1).join('\n');
        
        return (
          <div key={index} className="my-3">
            <div className="bg-gray-800 rounded-t-md px-3 py-1 text-xs text-gray-400 border-b border-gray-700">
              {language}
            </div>
            <pre className="bg-gray-900 rounded-b-md p-3 overflow-x-auto">
              <code className="text-sm text-gray-100 font-mono">{code}</code>
            </pre>
          </div>
        );
      } else {
        // Regular text with inline code highlighting
        const textParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={index}>
            {textParts.map((textPart, textIndex) => {
              if (textPart.startsWith('`') && textPart.endsWith('`')) {
                return (
                  <code 
                    key={textIndex}
                    className="bg-gray-800 text-blue-300 px-1 py-0.5 rounded text-sm font-mono"
                  >
                    {textPart.slice(1, -1)}
                  </code>
                );
              }
              return textPart;
            })}
          </span>
        );
      }
    });
  };

  return (
    <div className={clsx('flex flex-col h-full bg-gray-900', className)}>
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center">
          <CpuChipIcon className="h-5 w-5 text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">AI Coach</h3>
          {isTyping && (
            <div className="ml-3 flex items-center text-sm text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="ml-2">Coach is typing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <CpuChipIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium">Welcome to AI Coach!</p>
            <p className="text-sm mt-2">Ask me anything about the code patterns you're learning.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={clsx(
                'flex',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={clsx(
                  'max-w-[80%] rounded-lg px-4 py-3',
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                )}
              >
                {/* Message Header */}
                <div className="flex items-center mb-2">
                  {message.sender === 'user' ? (
                    <UserIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <CpuChipIcon className="h-4 w-4 mr-2 text-blue-400" />
                  )}
                  <span className="text-xs opacity-75">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>

                {/* Message Content */}
                <div className="prose prose-invert prose-sm max-w-none">
                  {message.isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {renderCodeSnippets(message.content)}
                    </div>
                  )}
                </div>

                {/* Context Information */}
                {message.contextUsed && message.contextUsed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="text-xs text-gray-400 mb-2">Context used:</div>
                    <div className="space-y-1">
                      {message.contextUsed.map((context, index) => (
                        <div key={index} className="text-xs text-gray-500 flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          <span>{context.source}</span>
                          <span className="ml-auto">
                            {Math.round(context.relevance * 100)}% relevant
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hints */}
                {message.hints && message.hints.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="text-xs text-gray-400 mb-2">💡 Hints:</div>
                    <ul className="text-sm space-y-1">
                      {message.hints.map((hint, index) => (
                        <li key={index} className="text-yellow-300">• {hint}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Actions */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="text-xs text-gray-400 mb-2">🎯 Suggested actions:</div>
                    <ul className="text-sm space-y-1">
                      {message.suggestedActions.map((action, index) => (
                        <li key={index} className="text-blue-300">• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about the code patterns, architecture, or implementation details..."
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[40px] max-h-32"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </Button>
        </form>
        
        {/* Quick Actions */}
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "Explain this pattern",
            "How does this work?",
            "Show me an example",
            "What's the purpose?"
          ].map((quickAction) => (
            <button
              key={quickAction}
              onClick={() => setInputValue(quickAction)}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
              disabled={isLoading}
            >
              {quickAction}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};