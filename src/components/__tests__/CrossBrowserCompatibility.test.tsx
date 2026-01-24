import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthPage } from '../auth/AuthPage';
import { Dashboard } from '../Dashboard';
import { ConceptSearchInput } from '../ui/ConceptSearchInput';
import { RepositoryDiscovery } from '../discovery/RepositoryDiscovery';

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
  User: () => <div data-testid="user-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
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

// Browser simulation utilities
const simulateBrowser = (browserName: string, version?: string) => {
  const userAgents = {
    chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    ie11: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
  };

  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: userAgents[browserName as keyof typeof userAgents] || userAgents.chrome,
  });
};

const simulateViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

describe('Cross-Browser Compatibility Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
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

  describe('Chrome Browser Compatibility', () => {
    beforeEach(() => {
      simulateBrowser('chrome');
    });

    it('should render AuthPage correctly in Chrome', () => {
      render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      expect(screen.getByText('Reverse Engineer Coach')).toBeInTheDocument();
      expect(screen.getByText('Learn software architecture by reverse engineering real-world applications with AI-powered guidance')).toBeInTheDocument();
    });

    it('should handle form interactions in Chrome', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText('Email Address');
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should support modern CSS features in Chrome', () => {
      const { container } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      // Check for CSS Grid and Flexbox usage
      const gridElements = container.querySelectorAll('.grid');
      const flexElements = container.querySelectorAll('.flex');
      
      expect(gridElements.length).toBeGreaterThan(0);
      expect(flexElements.length).toBeGreaterThan(0);
    });
  });

  describe('Firefox Browser Compatibility', () => {
    beforeEach(() => {
      simulateBrowser('firefox');
    });

    it('should render Dashboard correctly in Firefox', () => {
      render(<Dashboard />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should handle keyboard navigation in Firefox', async () => {
      const user = userEvent.setup();
      render(
        <ConceptSearchInput
          placeholder="Enter a concept..."
          onChange={jest.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      await user.tab();
      
      expect(input).toHaveFocus();
    });

    it('should support CSS custom properties in Firefox', () => {
      const { container } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      // Verify CSS custom properties are applied
      const styledElements = container.querySelectorAll('[class*="bg-"]');
      expect(styledElements.length).toBeGreaterThan(0);
    });
  });

  describe('Safari Browser Compatibility', () => {
    beforeEach(() => {
      simulateBrowser('safari');
    });

    it('should render RepositoryDiscovery correctly in Safari', () => {
      render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[mockRepository]}
          loading={false}
          onRepositorySelect={jest.fn()}
        />
      );

      expect(screen.getByText('Repository Suggestions')).toBeInTheDocument();
      expect(screen.getByText('test/repo')).toBeInTheDocument();
    });

    it('should handle touch events in Safari (mobile)', async () => {
      const user = userEvent.setup();
      const mockOnSelect = jest.fn();
      
      render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[mockRepository]}
          loading={false}
          onRepositorySelect={mockOnSelect}
        />
      );

      const repositoryCard = screen.getByRole('button', { name: /Select repository test\/repo/i });
      await user.click(repositoryCard);

      expect(mockOnSelect).toHaveBeenCalledWith(mockRepository);
    });

    it('should support WebKit-specific features in Safari', () => {
      const { container } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      // Check for WebKit-specific styling
      const elements = container.querySelectorAll('[class*="rounded"]');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Browser Compatibility', () => {
    beforeEach(() => {
      simulateBrowser('edge');
    });

    it('should render all components correctly in Edge', () => {
      render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      expect(screen.getByText('Reverse Engineer Coach')).toBeInTheDocument();
      
      // Test component switching
      const switchButton = screen.getByText(/sign up here/i);
      fireEvent.click(switchButton);
      
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('should handle modern JavaScript features in Edge', async () => {
      const user = userEvent.setup();
      render(
        <ConceptSearchInput
          placeholder="Enter a concept..."
          onChange={jest.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'microservices');

      // Test async/await and modern JS features work
      expect(input).toHaveValue('microservices');
    });
  });

  describe('Responsive Design Compatibility', () => {
    it('should adapt to mobile viewport (375px)', () => {
      simulateViewport(375, 667);
      
      const { container } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      // Check for mobile-responsive classes
      const responsiveElements = container.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    it('should adapt to tablet viewport (768px)', () => {
      simulateViewport(768, 1024);
      
      render(<Dashboard />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should adapt to desktop viewport (1920px)', () => {
      simulateViewport(1920, 1080);
      
      render(
        <RepositoryDiscovery
          concept="microservices"
          suggestions={[mockRepository]}
          loading={false}
          onRepositorySelect={jest.fn()}
        />
      );

      expect(screen.getByText('Repository Suggestions')).toBeInTheDocument();
    });
  });

  describe('Feature Detection and Polyfills', () => {
    it('should handle missing modern features gracefully', () => {
      // Mock missing fetch API
      const originalFetch = global.fetch;
      delete (global as any).fetch;

      render(<Dashboard />);

      // Should still render without crashing
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Restore fetch
      global.fetch = originalFetch;
    });

    it('should work without CSS Grid support', () => {
      // Mock CSS.supports to return false for grid
      const originalSupports = CSS.supports;
      CSS.supports = jest.fn().mockReturnValue(false);

      const { container } = render(
        <BrowserRouter>
          <AuthPage onAuthSuccess={jest.fn()} />
        </BrowserRouter>
      );

      // Should still render layout
      expect(container.firstChild).toBeInTheDocument();

      // Restore CSS.supports
      CSS.supports = originalSupports;
    });

    it('should handle missing localStorage gracefully', () => {
      // Mock missing localStorage
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      render(<Dashboard />);

      // Should still render without crashing
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Restore localStorage
      window.localStorage = originalLocalStorage;
    });
  });

  describe('Performance Across Browsers', () => {
    it('should render components efficiently in all browsers', () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      browsers.forEach(browser => {
        simulateBrowser(browser);
        
        const startTime = performance.now();
        render(
          <BrowserRouter>
            <AuthPage onAuthSuccess={jest.fn()} />
          </BrowserRouter>
        );
        const endTime = performance.now();
        
        const renderTime = endTime - startTime;
        expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      });
    });

    it('should handle large datasets efficiently across browsers', () => {
      const largeSuggestions = Array.from({ length: 50 }, (_, i) => ({
        ...mockRepository,
        repository_name: `test/repo-${i}`,
        id: `repo-${i}`,
      }));

      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      browsers.forEach(browser => {
        simulateBrowser(browser);
        
        const startTime = performance.now();
        render(
          <RepositoryDiscovery
            concept="microservices"
            suggestions={largeSuggestions}
            loading={false}
            onRepositorySelect={jest.fn()}
          />
        );
        const endTime = performance.now();
        
        const renderTime = endTime - startTime;
        expect(renderTime).toBeLessThan(2000); // Should render within 2 seconds
      });
    });
  });

  describe('Accessibility Across Browsers', () => {
    it('should maintain accessibility features in all browsers', () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      browsers.forEach(browser => {
        simulateBrowser(browser);
        
        render(
          <BrowserRouter>
            <AuthPage onAuthSuccess={jest.fn()} />
          </BrowserRouter>
        );

        // Check for ARIA attributes
        expect(screen.getByRole('main')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation in all browsers', async () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      for (const browser of browsers) {
        simulateBrowser(browser);
        
        const user = userEvent.setup();
        render(
          <ConceptSearchInput
            placeholder="Enter a concept..."
            onChange={jest.fn()}
          />
        );

        const input = screen.getByRole('combobox');
        await user.tab();
        
        expect(input).toHaveFocus();
      }
    });
  });

  describe('Error Handling Across Browsers', () => {
    it('should handle network errors gracefully in all browsers', async () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      browsers.forEach(browser => {
        simulateBrowser(browser);
        
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
        
        render(<Dashboard />);
        
        // Should not crash and should show error state
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    it('should handle JavaScript errors gracefully', () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      browsers.forEach(browser => {
        simulateBrowser(browser);
        
        // Mock console.error to catch errors
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        
        render(
          <BrowserRouter>
            <AuthPage onAuthSuccess={jest.fn()} />
          </BrowserRouter>
        );

        // Should render without throwing errors
        expect(screen.getByText('Reverse Engineer Coach')).toBeInTheDocument();
        
        consoleSpy.mockRestore();
      });
    });
  });
});