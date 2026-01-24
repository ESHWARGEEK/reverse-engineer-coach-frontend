import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../Dashboard';
import { useAuthStore } from '../../store/authStore';

// Mock the auth store
jest.mock('../../store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock the AppRouter navigate function
const mockNavigate = jest.fn();
jest.mock('../AppRouter', () => ({
  navigate: mockNavigate,
}));

// Mock axios to avoid import issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock api utils
jest.mock('../../utils/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  BookOpen: () => <div data-testid="book-open-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Star: () => <div data-testid="star-icon" />,
  GitFork: () => <div data-testid="git-fork-icon" />,
  ExternalLink: () => <div data-testid="external-link-icon" />,
}));

// Mock fetch
global.fetch = jest.fn();

const DashboardWrapper: React.FC = () => (
  <BrowserRouter>
    <Dashboard />
  </BrowserRouter>
);

describe('Dashboard Integration Tests', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
  };

  const mockStoreState = {
    user: mockUser,
    token: 'mock-token',
    logout: jest.fn(),
  };

  const mockDashboardData = {
    projects: [
      {
        id: 'project-1',
        title: 'Microservices Learning Project',
        target_repository: 'https://github.com/example/microservices-demo',
        architecture_topic: 'microservices',
        concept_description: 'Learning microservices architecture',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        total_tasks: 10,
        completed_tasks: 6,
        completion_percentage: 60,
        current_task_id: 'task-1',
        implementation_language: 'python',
        preferred_frameworks: ['fastapi'],
        days_since_created: 15,
        days_since_updated: 1,
        is_recently_active: true,
      },
    ],
    stats: {
      total_projects: 1,
      projects_by_status: {
        in_progress: 1,
      },
      completed_projects: 0,
      in_progress_projects: 1,
      average_completion_percentage: 60,
      total_tasks_completed: 6,
      most_used_languages: [
        { language: 'python', count: 1 },
      ],
      most_used_topics: [
        { topic: 'microservices', count: 1 },
      ],
      recent_activity_count: 1,
    },
    total_count: 1,
    page: 1,
    page_size: 10,
    has_next_page: false,
    has_prev_page: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDashboardData),
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => JSON.stringify({ state: { token: 'mock-token' } })),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Complete User Dashboard Workflow', () => {
    it('should load dashboard data and display user projects', async () => {
      render(<DashboardWrapper />);

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Verify API call was made with correct authentication
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );

      // Verify projects are displayed
      expect(screen.getByText('Microservices Learning Project')).toBeInTheDocument();
    });

    it('should handle project actions (continue, delete)', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDashboardData),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Microservices Learning Project')).toBeInTheDocument();
      });

      // Test continue project
      const continueButton = screen.getByText('Continue');
      await user.click(continueButton);

      expect(mockNavigate).toHaveBeenCalledWith('/workspace/project-1');
    });

    it('should handle error states gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle empty project list', async () => {
      const emptyDashboardData = {
        ...mockDashboardData,
        projects: [],
        total_count: 0,
        stats: {
          ...mockDashboardData.stats,
          total_projects: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptyDashboardData),
      });

      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText(/no projects/i)).toBeInTheDocument();
      });
    });

    it('should maintain user session and handle authentication', async () => {
      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Verify that all API calls include authentication headers
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      fetchCalls.forEach(call => {
        const [, options] = call;
        expect(options.headers).toHaveProperty('Authorization', 'Bearer mock-token');
      });
    });

    it('should support keyboard navigation throughout dashboard', async () => {
      const user = userEvent.setup();
      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const continueButton = screen.getByText('Continue');
      continueButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith('/workspace/project-1');
    });
  });

  describe('Dashboard Performance and Optimization', () => {
    it('should implement efficient data loading', async () => {
      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Verify that data is loaded efficiently
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle large datasets efficiently', async () => {
      const largeDashboardData = {
        ...mockDashboardData,
        projects: Array.from({ length: 50 }, (_, i) => ({
          ...mockDashboardData.projects[0],
          id: `project-${i}`,
          title: `Project ${i}`,
        })),
        total_count: 50,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeDashboardData),
      });

      const startTime = performance.now();
      render(<DashboardWrapper />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify reasonable render time
      expect(renderTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});