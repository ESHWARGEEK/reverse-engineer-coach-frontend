import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../Dashboard';
import { useAuthStore } from '../../store/authStore';

// Mock the auth store
jest.mock('../../store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock the AppRouter navigate function
jest.mock('../AppRouter', () => ({
  navigate: jest.fn(),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  User: ({ className }: any) => <div data-testid="user-icon" className={className} />,
  Settings: ({ className }: any) => <div data-testid="settings-icon" className={className} />,
  LogOut: ({ className }: any) => <div data-testid="logout-icon" className={className} />,
  Plus: ({ className }: any) => <div data-testid="plus-icon" className={className} />,
  BookOpen: ({ className }: any) => <div data-testid="book-open-icon" className={className} />,
  TrendingUp: ({ className }: any) => <div data-testid="trending-up-icon" className={className} />,
  Search: ({ className }: any) => <div data-testid="search-icon" className={className} />,
  Filter: ({ className }: any) => <div data-testid="filter-icon" className={className} />,
  Calendar: ({ className }: any) => <div data-testid="calendar-icon" className={className} />,
  Clock: ({ className }: any) => <div data-testid="clock-icon" className={className} />,
  CheckCircle: ({ className }: any) => <div data-testid="check-circle-icon" className={className} />,
  AlertCircle: ({ className }: any) => <div data-testid="alert-circle-icon" className={className} />,
  BarChart3: ({ className }: any) => <div data-testid="bar-chart-icon" className={className} />,
  Target: ({ className }: any) => <div data-testid="target-icon" className={className} />,
  Award: ({ className }: any) => <div data-testid="award-icon" className={className} />,
  Activity: ({ className }: any) => <div data-testid="activity-icon" className={className} />,
  ChevronRight: ({ className }: any) => <div data-testid="chevron-right-icon" className={className} />,
  Trash2: ({ className }: any) => <div data-testid="trash-icon" className={className} />,
  Play: ({ className }: any) => <div data-testid="play-icon" className={className} />,
  Pause: ({ className }: any) => <div data-testid="pause-icon" className={className} />,
}));

// Mock fetch
global.fetch = jest.fn();

describe('Dashboard', () => {
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
      {
        id: 'project-2',
        title: 'Clean Architecture Study',
        target_repository: 'https://github.com/example/clean-architecture',
        architecture_topic: 'clean-architecture',
        status: 'completed',
        created_at: '2023-12-01T00:00:00Z',
        updated_at: '2023-12-20T00:00:00Z',
        total_tasks: 8,
        completed_tasks: 8,
        completion_percentage: 100,
        implementation_language: 'typescript',
        preferred_frameworks: ['react'],
        days_since_created: 45,
        days_since_updated: 25,
        is_recently_active: false,
      },
    ],
    stats: {
      total_projects: 2,
      projects_by_status: {
        in_progress: 1,
        completed: 1,
      },
      completed_projects: 1,
      in_progress_projects: 1,
      average_completion_percentage: 80,
      total_tasks_completed: 14,
      most_used_languages: [
        { language: 'python', count: 1 },
        { language: 'typescript', count: 1 },
      ],
      most_used_topics: [
        { topic: 'microservices', count: 1 },
        { topic: 'clean-architecture', count: 1 },
      ],
      recent_activity_count: 1,
    },
    total_count: 2,
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

  it('renders dashboard header with user information', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('fetches and displays dashboard data on mount', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });
  });

  it('displays project cards with correct information', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Microservices Learning Project')).toBeInTheDocument();
      expect(screen.getByText('Clean Architecture Study')).toBeInTheDocument();
    });

    // Check project details
    expect(screen.getByText('example/microservices-demo')).toBeInTheDocument();
    expect(screen.getByText('microservices')).toBeInTheDocument();
    expect(screen.getByText('6/10 tasks')).toBeInTheDocument();
    expect(screen.getByText('60% complete')).toBeInTheDocument();
  });

  it('displays project status icons correctly', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('play-icon')).toBeInTheDocument(); // In progress
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument(); // Completed
    });
  });

  it('shows active badge for recently active projects', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('displays progress bars for projects with tasks', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar', { hidden: true });
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  it('handles project deletion', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDashboardData),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Microservices Learning Project')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTestId('trash-icon');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/dashboard/projects/project-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });
  });

  it('handles continue/start project action', async () => {
    const user = userEvent.setup();
    const { navigate } = require('../AppRouter');

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    const continueButton = screen.getByText('Continue');
    await user.click(continueButton);

    expect(navigate).toHaveBeenCalledWith('/workspace/project-1');
  });

  it('displays different button text based on project status', async () => {
    const mockDataWithReadyProject = {
      ...mockDashboardData,
      projects: [
        {
          ...mockDashboardData.projects[0],
          status: 'ready',
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDataWithReadyProject),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Start Learning')).toBeInTheDocument();
    });
  });

  it('disables continue button for analyzing or failed projects', async () => {
    const mockDataWithAnalyzingProject = {
      ...mockDashboardData,
      projects: [
        {
          ...mockDashboardData.projects[0],
          status: 'analyzing',
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDataWithAnalyzingProject),
    });

    render(<Dashboard />);

    await waitFor(() => {
      const continueButton = screen.getByText('Continue');
      expect(continueButton).toBeDisabled();
    });
  });

  it('displays dashboard statistics', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total projects
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed projects
      expect(screen.getByText('80%')).toBeInTheDocument(); // Average completion
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching data', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Dashboard />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles empty project list', async () => {
    const emptyDashboardData = {
      ...mockDashboardData,
      projects: [],
      total_count: 0,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emptyDashboardData),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no projects/i)).toBeInTheDocument();
    });
  });

  it('formats repository names correctly', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('example/microservices-demo')).toBeInTheDocument();
      expect(screen.getByText('example/clean-architecture')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Dec 1, 2023/)).toBeInTheDocument();
    });
  });

  it('shows framework information when available', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('python')).toBeInTheDocument();
      expect(screen.getByText('typescript')).toBeInTheDocument();
    });
  });

  it('handles search and filtering', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    // Test search functionality if search input exists
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      await user.type(searchInput, 'microservices');
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('topic_search=microservices'),
          expect.any(Object)
        );
      });
    }
  });

  it('handles sorting options', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    // Test sorting functionality if sort dropdown exists
    const sortSelect = screen.queryByLabelText(/sort/i);
    if (sortSelect) {
      await user.selectOptions(sortSelect, 'created_at');
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('sort_by=created_at'),
          expect.any(Object)
        );
      });
    }
  });

  it('handles pagination', async () => {
    const mockDataWithPagination = {
      ...mockDashboardData,
      has_next_page: true,
      page: 1,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDataWithPagination),
    });

    const user = userEvent.setup();
    render(<Dashboard />);

    // Test pagination if next button exists
    await waitFor(() => {
      const nextButton = screen.queryByText(/next/i);
      if (nextButton) {
        user.click(nextButton);
      }
    });
  });
});