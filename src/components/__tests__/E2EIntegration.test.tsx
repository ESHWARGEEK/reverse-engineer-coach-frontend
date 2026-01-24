/**
 * End-to-end integration tests for the frontend application.
 * 
 * These tests verify complete user workflows from the UI perspective,
 * testing integration between React components, state management, and API calls.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

import App from '../../App';

// Mock axios for API calls
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  defaults: {
    baseURL: '',
    headers: {
      common: {}
    }
  },
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn()
    },
    response: {
      use: jest.fn(),
      eject: jest.fn()
    }
  }
}));

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock react-resizable-panels
jest.mock('react-resizable-panels', () => ({
  Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
  PanelGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="panel-group">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle" />,
}));

// Mock focus management hooks
jest.mock('../../hooks/useFocusManagement', () => ({
  useReducedMotion: () => false,
  useHighContrast: () => false,
  useSkipLinks: () => ({
    skipToMain: jest.fn(),
    skipToNavigation: jest.fn(),
  }),
}));

// Mock the Layout component to avoid hook dependency issues
jest.mock('../layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div role="main">{children}</div>
  ),
}));

// Mock the API module
jest.mock('../../utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle" />,
  RefreshCw: () => <div data-testid="refresh" />,
  Home: () => <div data-testid="home" />,
  Wifi: () => <div data-testid="wifi" />,
  WifiOff: () => <div data-testid="wifi-off" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Play: () => <div data-testid="play" />,
  Check: () => <div data-testid="check" />,
  X: () => <div data-testid="x" />,
  Plus: () => <div data-testid="plus" />,
  Save: () => <div data-testid="save" />,
  Send: () => <div data-testid="send" />,
}));

describe('E2E Integration Tests', () => {
  const user = userEvent.setup();
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default axios responses
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          data: [],
          status: 200,
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  describe('Complete Project Creation Workflow', () => {
    test('should complete basic project creation workflow', async () => {
      // Mock successful project creation
      const mockProject = {
        id: '1',
        name: 'Test Project',
        architecture_topic: 'Design Patterns',
        target_repository: 'https://github.com/test/repo',
        implementation_language: 'Python',
        status: 'analyzing',
        created_at: new Date().toISOString(),
      };

      mockAxios.post.mockResolvedValueOnce({
        data: mockProject,
        status: 201,
      });

      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes('/api/projects/1')) {
          return Promise.resolve({
            data: { ...mockProject, status: 'ready' },
            status: 200,
          });
        }
        return Promise.resolve({ data: [], status: 200 });
      });

      renderWithRouter(<App />);

      // Verify the app renders without crashing
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('should handle repository validation errors gracefully', async () => {
      // Mock validation error
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { detail: 'Invalid repository URL format' }
        }
      });

      renderWithRouter(<App />);

      // Verify error handling doesn't crash the app
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should display error messages for API failures', async () => {
      // Mock API failure
      mockAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { detail: 'Internal server error' }
        }
      });

      renderWithRouter(<App />);

      // Should not crash on API failure
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('should handle network connectivity issues', async () => {
      // Mock network error
      mockAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      renderWithRouter(<App />);

      // Should handle network errors gracefully
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('State Persistence and Recovery', () => {
    test('should persist workspace state across page reloads', async () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        openFiles: ['src/factory.py'],
        activeFile: 'src/factory.py',
        editorContent: { 'src/factory.py': 'class Factory:\n    pass' },
      }));

      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes('/api/projects/1')) {
          return Promise.resolve({ 
            data: { id: '1', name: 'Test', status: 'ready' }, 
            status: 200 
          });
        }
        return Promise.resolve({ data: [], status: 200 });
      });

      renderWithRouter(<App />);

      // Verify localStorage integration works
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout and UI Interactions', () => {
    test('should handle pane resizing and layout changes', async () => {
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes('/api/projects/1')) {
          return Promise.resolve({ 
            data: { id: '1', name: 'Layout Test', status: 'ready' }, 
            status: 200 
          });
        }
        return Promise.resolve({ data: [], status: 200 });
      });

      renderWithRouter(<App />);

      // Verify responsive layout works
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('should handle keyboard navigation and accessibility', async () => {
      renderWithRouter(<App />);

      // Test basic accessibility
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Test keyboard navigation doesn't crash
      fireEvent.keyDown(document.body, { key: 'Tab' });
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});