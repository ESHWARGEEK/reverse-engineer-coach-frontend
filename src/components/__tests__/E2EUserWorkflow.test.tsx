/**
 * End-to-End User Workflow Tests
 * 
 * These tests verify complete user workflows from registration to project completion,
 * covering all major user journeys and cross-browser compatibility scenarios.
 * 
 * Test Coverage:
 * - Complete user registration and onboarding flow
 * - Concept search to project creation workflow  
 * - User project management and workspace access
 * - Cross-browser compatibility testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Import components for testing
import { AuthPage } from '../auth/AuthPage';
import { Dashboard } from '../Dashboard';
import { HomePage } from '../HomePage';
import { WorkspacePage } from '../WorkspacePage';
import App from '../../App';

// Mock the API module first to prevent initialization issues
jest.mock('../../utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

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

// Mock SimpleEditor (no Monaco Editor dependency)
jest.mock('../ui/SimpleEditor', () => ({
  SimpleEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      data-testid="simple-editor"
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

// Mock the Layout component
jest.mock('../layout/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div role="main">{children}</div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle" />,
  RefreshCw: () => <div data-testid="refresh" />,
  Home: () => <div data-testid="home" />,
  User: () => <div data-testid="user" />,
  Settings: () => <div data-testid="settings" />,
  LogOut: () => <div data-testid="logout" />,
  Plus: () => <div data-testid="plus" />,
  BookOpen: () => <div data-testid="book-open" />,
  TrendingUp: () => <div data-testid="trending-up" />,
  Search: () => <div data-testid="search" />,
  Filter: () => <div data-testid="filter" />,
  Calendar: () => <div data-testid="calendar" />,
  Clock: () => <div data-testid="clock" />,
  CheckCircle: () => <div data-testid="check-circle" />,
  AlertCircle: () => <div data-testid="alert-circle" />,
  BarChart3: () => <div data-testid="bar-chart" />,
  Target: () => <div data-testid="target" />,
  Award: () => <div data-testid="award" />,
  Activity: () => <div data-testid="activity" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Trash2: () => <div data-testid="trash" />,
  Play: () => <div data-testid="play" />,
  Pause: () => <div data-testid="pause" />,
  Eye: () => <div data-testid="eye" />,
  EyeOff: () => <div data-testid="eye-off" />,
  Mail: () => <div data-testid="mail" />,
  Lock: () => <div data-testid="lock" />,
  Key: () => <div data-testid="key" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  ChevronUp: () => <div data-testid="chevron-up" />,
  Loader2: () => <div data-testid="loader" />,
  Send: () => <div data-testid="send" />,
  Save: () => <div data-testid="save" />,
}));

describe('E2E User Workflow Tests', () => {
  const user = userEvent.setup();
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    // Setup default axios responses
    mockAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/v1/dashboard')) {
        return Promise.resolve({
          data: {
            projects: [],
            stats: {
              total_projects: 0,
              projects_by_status: {},
              completed_projects: 0,
              in_progress_projects: 0,
              average_completion_percentage: 0,
              total_tasks_completed: 0,
              most_used_languages: [],
              most_used_topics: [],
              recent_activity_count: 0,
            },
            total_count: 0,
            page: 1,
            page_size: 12,
            has_next_page: false,
            has_prev_page: false,
          },
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

  describe('Complete User Registration and Onboarding Flow', () => {
    test('should complete full user registration workflow', async () => {
      // Mock successful registration
      mockAxios.post.mockImplementation((url: string, data: any) => {
        if (url.includes('/api/v1/auth/register')) {
          return Promise.resolve({
            data: {
              user: {
                id: 'user-1',
                email: data.email,
                created_at: new Date().toISOString(),
              },
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              token_type: 'bearer',
            },
            status: 201,
          });
        }
        if (url.includes('/api/v1/auth/test-api-key')) {
          return Promise.resolve({
            data: { valid: true },
            status: 200,
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderWithRouter(<AuthPage />);

      // Verify registration form is displayed
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Fill out registration form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePassword123!');
      await user.type(confirmPasswordInput, 'SecurePassword123!');

      // Select AI provider
      const openaiRadio = screen.getByDisplayValue('openai');
      await user.click(openaiRadio);

      // Select programming language
      const languageSelect = screen.getByLabelText(/preferred programming language/i);
      await user.selectOptions(languageSelect, 'python');

      // Expand API keys section
      const apiKeysButton = screen.getByRole('button', { name: /api keys/i });
      await user.click(apiKeysButton);

      // Fill API keys
      const openaiKeyInput = screen.getByLabelText(/openai api key/i);
      await user.type(openaiKeyInput, 'sk-test-key-123');

      // Wait for API key validation
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/api/v1/auth/test-api-key',
          expect.objectContaining({
            key: 'sk-test-key-123',
            type: 'openai'
          })
        );
      });

      // Submit registration
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Verify registration API call
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/api/v1/auth/register',
          expect.objectContaining({
            email: 'test@example.com',
            password: 'SecurePassword123!',
            openai_api_key: 'sk-test-key-123',
            preferred_ai_provider: 'openai',
            preferred_language: 'python',
          })
        );
      });
    });

    test('should handle registration validation errors', async () => {
      // Mock validation error
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { detail: 'Email already exists' }
        }
      });

      renderWithRouter(<AuthPage />);

      // Fill out form with existing email
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'SecurePassword123!');
      await user.type(confirmPasswordInput, 'SecurePassword123!');

      // Select AI provider
      const openaiRadio = screen.getByDisplayValue('openai');
      await user.click(openaiRadio);

      // Submit registration
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    test('should validate password strength requirements', async () => {
      renderWithRouter(<AuthPage />);

      const passwordInput = screen.getByLabelText(/^password/i);
      
      // Test weak password
      await user.type(passwordInput, 'weak');
      
      // Verify password requirements are shown
      await waitFor(() => {
        expect(screen.getByText(/password requirements/i)).toBeInTheDocument();
      });

      // Clear and enter strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'SecurePassword123!');

      // Verify requirements are satisfied
      await waitFor(() => {
        expect(screen.queryByText(/password requirements/i)).not.toBeInTheDocument();
      });
    });

    test('should validate API key formats', async () => {
      renderWithRouter(<AuthPage />);

      // Select OpenAI provider
      const openaiRadio = screen.getByDisplayValue('openai');
      await user.click(openaiRadio);

      // Expand API keys section
      const apiKeysButton = screen.getByRole('button', { name: /api keys/i });
      await user.click(apiKeysButton);

      // Test invalid API key format
      const openaiKeyInput = screen.getByLabelText(/openai api key/i);
      await user.type(openaiKeyInput, 'invalid-key');

      // Mock API key validation failure
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { detail: 'Invalid API key format' }
        }
      });

      // Verify validation error appears
      await waitFor(() => {
        expect(screen.getByText(/invalid.*api key/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Login and Authentication Flow', () => {
    test('should complete successful login workflow', async () => {
      // Mock successful login
      mockAxios.post.mockImplementation((url: string, data: any) => {
        if (url.includes('/api/v1/auth/login')) {
          return Promise.resolve({
            data: {
              user: {
                id: 'user-1',
                email: data.email,
                created_at: new Date().toISOString(),
              },
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              token_type: 'bearer',
            },
            status: 200,
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderWithRouter(<AuthPage />);

      // Switch to login form
      const switchToLoginButton = screen.getByRole('button', { name: /sign in here/i });
      await user.click(switchToLoginButton);

      // Verify login form is displayed
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();

      // Fill out login form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePassword123!');

      // Submit login
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Verify login API call
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/api/v1/auth/login',
          expect.objectContaining({
            email: 'test@example.com',
            password: 'SecurePassword123!',
          })
        );
      });
    });

    test('should handle login authentication errors', async () => {
      // Mock authentication error
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { detail: 'Invalid credentials' }
        }
      });

      renderWithRouter(<AuthPage />);

      // Switch to login form
      const switchToLoginButton = screen.getByRole('button', { name: /sign in here/i });
      await user.click(switchToLoginButton);

      // Fill out form with invalid credentials
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');

      // Submit login
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    test('should validate login form fields', async () => {
      renderWithRouter(<AuthPage />);

      // Switch to login form
      const switchToLoginButton = screen.getByRole('button', { name: /sign in here/i });
      await user.click(switchToLoginButton);

      // Test email validation
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      await waitFor(() => {
        expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
      });

      // Test empty password
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Concept Search to Project Creation Workflow', () => {
    test('should complete concept search and repository discovery flow', async () => {
      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      // Mock repository discovery
      mockAxios.post.mockImplementation((url: string, data: any) => {
        if (url.includes('/api/v1/discovery/repositories')) {
          return Promise.resolve({
            data: {
              suggestions: [
                {
                  repository_url: 'https://github.com/example/microservices-demo',
                  repository_name: 'microservices-demo',
                  description: 'A sample microservices application',
                  stars: 1500,
                  forks: 300,
                  language: 'Python',
                  topics: ['microservices', 'docker', 'kubernetes'],
                  quality: {
                    overall_score: 0.85,
                    code_quality: 0.8,
                    documentation_quality: 0.9,
                    activity_score: 0.7,
                    educational_value: 0.9,
                    complexity_score: 0.8,
                  },
                  last_updated: new Date().toISOString(),
                  owner: 'example',
                  size_kb: 2500,
                  has_readme: true,
                  has_license: true,
                  open_issues: 5,
                  relevance_score: 0.95,
                }
              ]
            },
            status: 200,
          });
        }
        if (url.includes('/api/v1/projects')) {
          return Promise.resolve({
            data: {
              id: 'project-1',
              name: 'Learn Microservices',
              target_repository: data.target_repository,
              concept_description: data.concept_description,
              status: 'analyzing',
              created_at: new Date().toISOString(),
            },
            status: 201,
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderWithRouter(<HomePage />);

      // Find and use concept search input
      const conceptInput = screen.getByPlaceholderText(/enter a concept to learn/i);
      await user.type(conceptInput, 'microservices architecture');

      // Trigger repository discovery
      const discoverButton = screen.getByRole('button', { name: /discover repositories/i });
      await user.click(discoverButton);

      // Wait for repository suggestions
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/api/v1/discovery/repositories',
          expect.objectContaining({
            concept: 'microservices architecture'
          })
        );
      });

      // Verify repository suggestions are displayed
      await waitFor(() => {
        expect(screen.getByText('microservices-demo')).toBeInTheDocument();
        expect(screen.getByText(/sample microservices application/i)).toBeInTheDocument();
      });

      // Select a repository
      const repositoryCard = screen.getByText('microservices-demo').closest('[role="button"]');
      expect(repositoryCard).toBeInTheDocument();
      await user.click(repositoryCard!);

      // Create project with selected repository
      const createProjectButton = screen.getByRole('button', { name: /create learning project/i });
      await user.click(createProjectButton);

      // Verify project creation API call
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          '/api/v1/projects',
          expect.objectContaining({
            target_repository: 'https://github.com/example/microservices-demo',
            concept_description: 'microservices architecture'
          })
        );
      });
    });

    test('should handle repository discovery errors', async () => {
      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      // Mock discovery error
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { detail: 'Repository discovery service unavailable' }
        }
      });

      renderWithRouter(<HomePage />);

      // Enter concept and trigger discovery
      const conceptInput = screen.getByPlaceholderText(/enter a concept to learn/i);
      await user.type(conceptInput, 'invalid concept');

      const discoverButton = screen.getByRole('button', { name: /discover repositories/i });
      await user.click(discoverButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(/discovery service unavailable/i)).toBeInTheDocument();
      });
    });

    test('should validate concept input requirements', async () => {
      renderWithRouter(<HomePage />);

      const conceptInput = screen.getByPlaceholderText(/enter a concept to learn/i);
      
      // Test empty concept
      const discoverButton = screen.getByRole('button', { name: /discover repositories/i });
      expect(discoverButton).toBeDisabled();

      // Test too short concept
      await user.type(conceptInput, 'ab');
      await waitFor(() => {
        expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
      });

      // Test valid concept
      await user.clear(conceptInput);
      await user.type(conceptInput, 'microservices');
      await waitFor(() => {
        expect(discoverButton).toBeEnabled();
      });
    });

    test('should provide concept suggestions and autocomplete', async () => {
      renderWithRouter(<HomePage />);

      const conceptInput = screen.getByPlaceholderText(/enter a concept to learn/i);
      
      // Focus input to show suggestions
      await user.click(conceptInput);

      // Verify default suggestions are shown
      await waitFor(() => {
        expect(screen.getByText('Microservices Architecture')).toBeInTheDocument();
        expect(screen.getByText('Clean Architecture')).toBeInTheDocument();
      });

      // Type to filter suggestions
      await user.type(conceptInput, 'micro');

      // Verify filtered suggestions
      await waitFor(() => {
        expect(screen.getByText('Microservices Architecture')).toBeInTheDocument();
      });

      // Select a suggestion
      const suggestion = screen.getByText('Microservices Architecture');
      await user.click(suggestion);

      // Verify input is populated
      expect(conceptInput).toHaveValue('microservices architecture');
    });
  });

  describe('User Project Management and Dashboard Workflow', () => {
    test('should display user dashboard with projects', async () => {
      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      // Mock dashboard data
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes('/api/v1/dashboard')) {
          return Promise.resolve({
            data: {
              projects: [
                {
                  id: 'project-1',
                  title: 'Learn Microservices',
                  target_repository: 'https://github.com/example/microservices-demo',
                  architecture_topic: 'microservices',
                  concept_description: 'microservices architecture',
                  status: 'in_progress',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  total_tasks: 10,
                  completed_tasks: 3,
                  completion_percentage: 30,
                  implementation_language: 'Python',
                  days_since_created: 5,
                  days_since_updated: 1,
                  is_recently_active: true,
                }
              ],
              stats: {
                total_projects: 1,
                projects_by_status: { in_progress: 1 },
                completed_projects: 0,
                in_progress_projects: 1,
                average_completion_percentage: 30,
                total_tasks_completed: 3,
                most_used_languages: [{ language: 'Python', count: 1 }],
                most_used_topics: [{ topic: 'microservices', count: 1 }],
                recent_activity_count: 1,
              },
              total_count: 1,
              page: 1,
              page_size: 12,
              has_next_page: false,
              has_prev_page: false,
            },
            status: 200,
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderWithRouter(<Dashboard />);

      // Verify dashboard loads
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Learn Microservices')).toBeInTheDocument();
      });

      // Verify project statistics
      expect(screen.getByText('1')).toBeInTheDocument(); // Total projects
      expect(screen.getByText('30%')).toBeInTheDocument(); // Completion percentage

      // Verify project details
      expect(screen.getByText('example/microservices-demo')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('3/10 tasks')).toBeInTheDocument();
    });

    test('should handle project filtering and search', async () => {
      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      // Mock dashboard with multiple projects
      mockAxios.get.mockImplementation((url: string) => {
        const urlObj = new URL(url, 'http://localhost');
        const searchParams = urlObj.searchParams;
        
        if (url.includes('/api/v1/dashboard')) {
          let projects = [
            {
              id: 'project-1',
              title: 'Learn Microservices',
              target_repository: 'https://github.com/example/microservices-demo',
              architecture_topic: 'microservices',
              status: 'in_progress',
              implementation_language: 'Python',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              total_tasks: 10,
              completed_tasks: 3,
              completion_percentage: 30,
              days_since_created: 5,
              days_since_updated: 1,
              is_recently_active: true,
            },
            {
              id: 'project-2',
              title: 'Learn Clean Architecture',
              target_repository: 'https://github.com/example/clean-arch-demo',
              architecture_topic: 'clean-architecture',
              status: 'completed',
              implementation_language: 'TypeScript',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              total_tasks: 8,
              completed_tasks: 8,
              completion_percentage: 100,
              days_since_created: 10,
              days_since_updated: 3,
              is_recently_active: false,
            }
          ];

          // Apply filters
          const status = searchParams.get('status');
          const language = searchParams.get('language');
          const topicSearch = searchParams.get('topic_search');

          if (status) {
            projects = projects.filter(p => p.status === status);
          }
          if (language) {
            projects = projects.filter(p => p.implementation_language === language);
          }
          if (topicSearch) {
            projects = projects.filter(p => 
              p.title.toLowerCase().includes(topicSearch.toLowerCase()) ||
              p.architecture_topic.toLowerCase().includes(topicSearch.toLowerCase())
            );
          }

          return Promise.resolve({
            data: {
              projects,
              stats: {
                total_projects: 2,
                projects_by_status: { in_progress: 1, completed: 1 },
                completed_projects: 1,
                in_progress_projects: 1,
                average_completion_percentage: 65,
                total_tasks_completed: 11,
                most_used_languages: [
                  { language: 'Python', count: 1 },
                  { language: 'TypeScript', count: 1 }
                ],
                most_used_topics: [
                  { topic: 'microservices', count: 1 },
                  { topic: 'clean-architecture', count: 1 }
                ],
                recent_activity_count: 1,
              },
              total_count: projects.length,
              page: 1,
              page_size: 12,
              has_next_page: false,
              has_prev_page: false,
            },
            status: 200,
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      renderWithRouter(<Dashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Learn Microservices')).toBeInTheDocument();
        expect(screen.getByText('Learn Clean Architecture')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      await user.type(searchInput, 'microservices');

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('topic_search=microservices')
        );
      });

      // Test status filter
      const statusFilter = screen.getByDisplayValue('All Statuses');
      await user.selectOptions(statusFilter, 'completed');

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('status=completed')
        );
      });

      // Test language filter
      const languageFilter = screen.getByDisplayValue('All Languages');
      await user.selectOptions(languageFilter, 'Python');

      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('language=Python')
        );
      });
    });

    test('should handle project deletion', async () => {
      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      // Mock dashboard data
      mockAxios.get.mockResolvedValue({
        data: {
          projects: [
            {
              id: 'project-1',
              title: 'Learn Microservices',
              target_repository: 'https://github.com/example/microservices-demo',
              architecture_topic: 'microservices',
              status: 'in_progress',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              total_tasks: 10,
              completed_tasks: 3,
              completion_percentage: 30,
              implementation_language: 'Python',
              days_since_created: 5,
              days_since_updated: 1,
              is_recently_active: true,
            }
          ],
          stats: {
            total_projects: 1,
            projects_by_status: { in_progress: 1 },
            completed_projects: 0,
            in_progress_projects: 1,
            average_completion_percentage: 30,
            total_tasks_completed: 3,
            most_used_languages: [{ language: 'Python', count: 1 }],
            most_used_topics: [{ topic: 'microservices', count: 1 }],
            recent_activity_count: 1,
          },
          total_count: 1,
          page: 1,
          page_size: 12,
          has_next_page: false,
          has_prev_page: false,
        },
        status: 200,
      });

      // Mock successful deletion
      mockAxios.delete.mockResolvedValue({ status: 204 });

      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = jest.fn(() => true);

      renderWithRouter(<Dashboard />);

      // Wait for project to load
      await waitFor(() => {
        expect(screen.getByText('Learn Microservices')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButton = screen.getByTitle('Delete project');
      await user.click(deleteButton);

      // Verify confirmation dialog
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Are you sure you want to delete this project?')
      );

      // Verify delete API call
      await waitFor(() => {
        expect(mockAxios.delete).toHaveBeenCalledWith('/api/v1/dashboard/projects/project-1');
      });

      // Restore window.confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Workspace Access and Project Interaction', () => {
    test('should navigate to workspace and load project', async () => {
      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      // Mock project data
      mockAxios.get.mockImplementation((url: string) => {
        if (url.includes('/api/v1/projects/project-1')) {
          return Promise.resolve({
            data: {
              id: 'project-1',
              name: 'Learn Microservices',
              target_repository: 'https://github.com/example/microservices-demo',
              status: 'ready',
              created_at: new Date().toISOString(),
            },
            status: 200,
          });
        }
        if (url.includes('/api/v1/projects/project-1/tasks')) {
          return Promise.resolve({
            data: [
              {
                id: 'task-1',
                title: 'Understand Service Architecture',
                description: 'Learn how services communicate',
                status: 'pending',
                order: 1,
              }
            ],
            status: 200,
          });
        }
        if (url.includes('/api/v1/projects/project-1/files')) {
          return Promise.resolve({
            data: [
              {
                path: 'src/main.py',
                type: 'file',
                size: 1024,
              }
            ],
            status: 200,
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      // Render workspace page directly
      renderWithRouter(<WorkspacePage />);

      // Verify workspace loads
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify project data is loaded
      await waitFor(() => {
        expect(mockAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/projects/')
        );
      });
    });

    test('should handle workspace loading errors', async () => {
      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      // Mock project loading error
      mockAxios.get.mockRejectedValue({
        response: {
          status: 404,
          data: { detail: 'Project not found' }
        }
      });

      renderWithRouter(<WorkspacePage />);

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Cross-Browser Compatibility Testing', () => {
    test('should handle different user agent strings', async () => {
      // Test Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true,
      });

      renderWithRouter(<AuthPage />);
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Test Firefox user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        configurable: true,
      });

      renderWithRouter(<AuthPage />);
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Test Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        configurable: true,
      });

      renderWithRouter(<AuthPage />);
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    test('should handle different viewport sizes', async () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      renderWithRouter(<AuthPage />);
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Test tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderWithRouter(<AuthPage />);
      expect(screen.getByText('Create Account')).toBeInTheDocument();

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      });

      renderWithRouter(<AuthPage />);
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    test('should handle keyboard navigation across browsers', async () => {
      renderWithRouter(<AuthPage />);

      // Test Tab navigation
      const emailInput = screen.getByLabelText(/email address/i);
      emailInput.focus();
      
      // Simulate Tab key
      fireEvent.keyDown(emailInput, { key: 'Tab', code: 'Tab' });
      
      // Verify focus moves to next element
      const passwordInput = screen.getByLabelText(/^password/i);
      expect(document.activeElement).toBe(passwordInput);

      // Test Enter key submission
      fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' });
      
      // Should not crash the application
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    test('should handle touch events on mobile devices', async () => {
      // Mock touch events
      const createTouchEvent = (type: string, element: Element) => {
        const touchEvent = new Event(type, { bubbles: true });
        Object.defineProperty(touchEvent, 'touches', {
          value: [{ clientX: 100, clientY: 100, target: element }],
        });
        return touchEvent;
      };

      renderWithRouter(<AuthPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      
      // Simulate touch events
      fireEvent(emailInput, createTouchEvent('touchstart', emailInput));
      fireEvent(emailInput, createTouchEvent('touchend', emailInput));
      
      // Should not crash the application
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    test('should handle different input methods and IME', async () => {
      renderWithRouter(<AuthPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      
      // Test composition events (IME input)
      fireEvent.compositionStart(emailInput);
      fireEvent.input(emailInput, { target: { value: 'test@' } });
      fireEvent.compositionEnd(emailInput, { target: { value: 'test@example.com' } });
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    test('should handle browser-specific CSS features gracefully', async () => {
      // Test CSS custom properties support
      const testElement = document.createElement('div');
      testElement.style.setProperty('--test-color', 'red');
      
      renderWithRouter(<AuthPage />);
      
      // Should render without CSS-related errors
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    test('should handle different date/time formats across locales', async () => {
      // Test different locale settings
      const originalDateTimeFormat = Intl.DateTimeFormat;
      
      // Mock US locale
      (global as any).Intl.DateTimeFormat = jest.fn(() => ({
        format: () => '1/23/2024',
        formatToParts: () => [],
      }));

      renderWithRouter(<Dashboard />);
      
      // Should handle date formatting without errors
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Restore original
      (global as any).Intl.DateTimeFormat = originalDateTimeFormat;
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from network failures', async () => {
      // Mock network failure followed by success
      let callCount = 0;
      mockAxios.get.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network Error'));
        }
        return Promise.resolve({
          data: {
            projects: [],
            stats: {
              total_projects: 0,
              projects_by_status: {},
              completed_projects: 0,
              in_progress_projects: 0,
              average_completion_percentage: 0,
              total_tasks_completed: 0,
              most_used_languages: [],
              most_used_topics: [],
              recent_activity_count: 0,
            },
            total_count: 0,
            page: 1,
            page_size: 12,
            has_next_page: false,
            has_prev_page: false,
          },
          status: 200,
        });
      });

      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      renderWithRouter(<Dashboard />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText(/try again/i);
      await user.click(retryButton);

      // Should recover and show dashboard
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    test('should handle session expiration gracefully', async () => {
      // Mock session expiration
      mockAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { detail: 'Token expired' }
        }
      });

      // Mock authenticated user with expired token
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'expired-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      renderWithRouter(<Dashboard />);

      // Should handle session expiration
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    test('should handle malformed API responses', async () => {
      // Mock malformed response
      mockAxios.get.mockResolvedValue({
        data: null, // Invalid response format
        status: 200,
      });

      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      renderWithRouter(<Dashboard />);

      // Should handle malformed response gracefully
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    test('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeProjectList = Array.from({ length: 100 }, (_, i) => ({
        id: `project-${i}`,
        title: `Project ${i}`,
        target_repository: `https://github.com/example/repo-${i}`,
        architecture_topic: 'microservices',
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_tasks: 10,
        completed_tasks: 3,
        completion_percentage: 30,
        implementation_language: 'Python',
        days_since_created: 5,
        days_since_updated: 1,
        is_recently_active: true,
      }));

      mockAxios.get.mockResolvedValue({
        data: {
          projects: largeProjectList.slice(0, 12), // Paginated
          stats: {
            total_projects: 100,
            projects_by_status: { in_progress: 100 },
            completed_projects: 0,
            in_progress_projects: 100,
            average_completion_percentage: 30,
            total_tasks_completed: 300,
            most_used_languages: [{ language: 'Python', count: 100 }],
            most_used_topics: [{ topic: 'microservices', count: 100 }],
            recent_activity_count: 50,
          },
          total_count: 100,
          page: 1,
          page_size: 12,
          has_next_page: true,
          has_prev_page: false,
        },
        status: 200,
      });

      // Mock authenticated user
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'mock-token',
          user: { id: 'user-1', email: 'test@example.com' },
          isAuthenticated: true,
        }
      }));

      renderWithRouter(<Dashboard />);

      // Should render efficiently without performance issues
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument(); // Total projects
      });
    });

    test('should maintain accessibility standards', async () => {
      renderWithRouter(<AuthPage />);

      // Test ARIA labels
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('aria-describedby');

      // Test keyboard navigation
      const passwordInput = screen.getByLabelText(/^password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Test form validation accessibility
      await user.type(emailInput, 'invalid-email');
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/valid email address/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});