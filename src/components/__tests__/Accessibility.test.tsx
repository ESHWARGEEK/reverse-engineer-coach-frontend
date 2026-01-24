import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../auth/LoginForm';
import { RegisterForm } from '../auth/RegisterForm';
import { AuthPage } from '../auth/AuthPage';
import { Dashboard } from '../Dashboard';
import { ConceptSearchInput } from '../ui/ConceptSearchInput';
import { RepositoryDiscovery } from '../discovery/RepositoryDiscovery';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('../../store/authStore');
jest.mock('../../hooks/useAuthInit');
jest.mock('../../services/authService');

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
jest.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Key: () => <div data-testid="key-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  ChevronUp: () => <div data-testid="chevron-up-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
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
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
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
      page_size: 10,
      has_next_page: false,
      has_prev_page: false,
    }),
  })
) as jest.Mock;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => JSON.stringify({ state: { token: 'mock-token' } })),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

const mockRepository = {
  repository_url: 'https://github.com/test/repo',
  repository_name: 'test/repo',
  description: 'A test repository',
  stars: 1000,
  forks: 200,
  language: 'TypeScript',
  topics: ['react', 'typescript'],
  quality: {
    overall_score: 0.85,
    code_quality: 0.8,
    documentation_quality: 0.9,
    activity_score: 0.7,
    educational_value: 0.9,
    complexity_score: 0.6,
  },
  last_updated: '2024-01-01T00:00:00Z',
  owner: 'test',
  size_kb: 5000,
  has_readme: true,
  has_license: true,
  open_issues: 10,
  relevance_score: 0.9,
};

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Mock auth store
    const mockUseAuthStore = require('../../store/authStore').useAuthStore;
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      token: 'mock-token',
      isAuthenticated: false,
      isLoading: false,
      formData: {
        email: '',
        password: '',
        confirmPassword: '',
        githubToken: '',
        openaiApiKey: '',
        geminiApiKey: '',
        preferredAiProvider: 'openai',
        preferredLanguage: 'python',
        preferredFrameworks: [],
      },
      showPassword: false,
      showConfirmPassword: false,
      showApiKeys: false,
      error: null,
      updateFormData: jest.fn(),
      togglePasswordVisibility: jest.fn(),
      toggleApiKeysVisibility: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    // Mock auth init hook
    const mockUseAuthInit = require('../../hooks/useAuthInit').useAuthInit;
    mockUseAuthInit.mockReturnValue(undefined);

    // Mock auth service
    const mockAuthService = require('../../services/authService').authService;
    mockAuthService.validateEmail.mockReturnValue(true);
    mockAuthService.validatePassword.mockReturnValue({ isValid: true, errors: [] });
    mockAuthService.validateApiKey.mockReturnValue(true);
  });

  describe('LoginForm Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <LoginForm
          onSwitchToRegister={jest.fn()}
          onSuccess={jest.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and ARIA attributes', () => {
      const { getByLabelText, getByRole } = render(
        <LoginForm
          onSwitchToRegister={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      // Check form labels
      expect(getByLabelText('Email Address')).toBeInTheDocument();
      expect(getByLabelText('Password')).toBeInTheDocument();
      expect(getByLabelText(/remember me/i)).toBeInTheDocument();

      // Check form role
      expect(getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should have proper keyboard navigation', () => {
      const { getByLabelText, getByRole } = render(
        <LoginForm
          onSwitchToRegister={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      const emailInput = getByLabelText('Email Address');
      const passwordInput = getByLabelText('Password');
      const submitButton = getByRole('button', { name: /sign in/i });

      // Check tab order
      expect(emailInput.tabIndex).not.toBe(-1);
      expect(passwordInput.tabIndex).not.toBe(-1);
      expect(submitButton.tabIndex).not.toBe(-1);
    });
  });

  describe('RegisterForm Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <RegisterForm
          onSwitchToLogin={jest.fn()}
          onSuccess={jest.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and ARIA attributes', () => {
      const { getByLabelText, getByRole } = render(
        <RegisterForm
          onSwitchToLogin={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      // Check required field labels
      expect(getByLabelText('Email Address *')).toBeInTheDocument();
      expect(getByLabelText('Password *')).toBeInTheDocument();
      expect(getByLabelText('Confirm Password *')).toBeInTheDocument();
      expect(getByLabelText('Preferred Programming Language *')).toBeInTheDocument();

      // Check radio group
      expect(getByRole('radiogroup')).toBeInTheDocument();
      expect(getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels for radio buttons', () => {
      const { getByRole } = render(
        <RegisterForm
          onSwitchToLogin={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      const openaiRadio = getByRole('radio', { name: /openai/i });
      const geminiRadio = getByRole('radio', { name: /google gemini/i });

      expect(openaiRadio).toBeInTheDocument();
      expect(geminiRadio).toBeInTheDocument();
    });
  });

  describe('AuthPage Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure', () => {
      const { getByRole } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      // Check main heading
      expect(getByRole('heading', { level: 1 })).toHaveTextContent('Reverse Engineer Coach');
    });

    it('should have proper landmark roles', () => {
      const { getByRole } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      // Check for main content area
      expect(getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Dashboard Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Dashboard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure', () => {
      const { getByRole } = render(<Dashboard />);

      // Check main heading
      expect(getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
    });

    it('should have proper button labels', () => {
      const { getAllByRole } = render(<Dashboard />);

      // All buttons should have accessible names
      const buttons = getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('ConceptSearchInput Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <ConceptSearchInput
          placeholder="Enter a concept..."
          onChange={jest.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper combobox role and ARIA attributes', () => {
      const { getByRole } = render(
        <ConceptSearchInput
          placeholder="Enter a concept..."
          onChange={jest.fn()}
        />
      );

      const combobox = getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-expanded');
      expect(combobox).toHaveAttribute('aria-autocomplete');
    });

    it('should announce suggestions to screen readers', () => {
      const { getByRole } = render(
        <ConceptSearchInput
          placeholder="Enter a concept..."
          onChange={jest.fn()}
        />
      );

      const combobox = getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-describedby');
    });
  });

  describe('RepositoryDiscovery Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[mockRepository]}
          loading={false}
          onRepositorySelect={jest.fn()}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper button labels for repository selection', () => {
      const { getByRole } = render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[mockRepository]}
          loading={false}
          onRepositorySelect={jest.fn()}
        />
      );

      const repositoryButton = getByRole('button', { name: /select repository test\/repo/i });
      expect(repositoryButton).toBeInTheDocument();
      expect(repositoryButton).toHaveAttribute('aria-label');
    });

    it('should announce loading state to screen readers', () => {
      const { getByText } = render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[]}
          loading={true}
          onRepositorySelect={jest.fn()}
        />
      );

      const loadingText = getByText('Discovering Repositories');
      expect(loadingText).toBeInTheDocument();
    });

    it('should have proper ARIA labels for quality scores', () => {
      const { container } = render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[mockRepository]}
          loading={false}
          onRepositorySelect={jest.fn()}
        />
      );

      // Check for ARIA labels on quality indicators
      const qualityElements = container.querySelectorAll('[aria-label*="quality"]');
      expect(qualityElements.length).toBeGreaterThan(0);
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should have sufficient color contrast for text elements', async () => {
      const { container } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      // Run axe with color contrast rules
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('should not rely solely on color for information', async () => {
      const { container } = render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[mockRepository]}
          loading={false}
          onRepositorySelect={jest.fn()}
        />
      );

      // Check that status indicators have text or icons, not just color
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'link-in-text-block': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in forms', () => {
      const { getByLabelText, getByRole } = render(
        <LoginForm
          onSwitchToRegister={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      const emailInput = getByLabelText('Email Address');
      const passwordInput = getByLabelText('Password');
      const submitButton = getByRole('button', { name: /sign in/i });

      // Check that elements are focusable
      expect(emailInput).not.toHaveAttribute('tabindex', '-1');
      expect(passwordInput).not.toHaveAttribute('tabindex', '-1');
      expect(submitButton).not.toHaveAttribute('tabindex', '-1');
    });

    it('should have visible focus indicators', async () => {
      const { container } = render(
        <LoginForm
          onSwitchToRegister={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      // Check for focus-visible styles (this would be checked in CSS)
      const results = await axe(container, {
        rules: {
          'focus-order-semantics': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA live regions for dynamic content', () => {
      const { container } = render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[]}
          loading={true}
          onRepositorySelect={jest.fn()}
        />
      );

      // Check for live regions
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    it('should have descriptive error messages', () => {
      const mockUseAuthStore = require('../../store/authStore').useAuthStore;
      mockUseAuthStore.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        formData: {
          email: '',
          password: '',
        },
        error: 'Invalid credentials',
        showPassword: false,
        updateFormData: jest.fn(),
        togglePasswordVisibility: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        login: jest.fn(),
      });

      const { getByText } = render(
        <LoginForm
          onSwitchToRegister={jest.fn()}
          onSuccess={jest.fn()}
        />
      );

      const errorMessage = getByText('Invalid credentials');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });
});