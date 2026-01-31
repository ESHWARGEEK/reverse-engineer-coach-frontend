import React, { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { useToast } from '../store/toastStore';
import { SimpleErrorBoundary } from './error/SimpleErrorBoundary';

// Enhanced navigation helper with error handling
const navigate = (path: string, replace: boolean = false) => {
  try {
    if (replace) {
      window.location.replace(`#${path}`);
    } else {
      window.location.hash = path;
    }
  } catch (error) {
    console.error('Navigation failed:', error);
    throw new Error(`Failed to navigate to ${path}`);
  }
};

// Authentication error handler
const handleAuthenticationError = (showError: (title: string, message?: string) => void) => {
  console.warn('Authentication lost during navigation');
  
  // Clear invalid tokens
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_email');
  
  // Show error message
  showError(
    'Session Expired',
    'Your session has expired. Please log in again.'
  );
  
  // Redirect to login with a delay to show the toast
  setTimeout(() => {
    navigate('/auth', true);
  }, 1500);
};

// Navigation error handler with fallback options
const handleNavigationError = (
  error: Error, 
  targetRoute: string, 
  showError: (title: string, message?: string) => void,
  showWarning: (title: string, message?: string) => void
) => {
  console.error(`Navigation to ${targetRoute} failed:`, error);
  
  // Show user-friendly error message
  showError(
    'Navigation Failed',
    `Unable to navigate to ${targetRoute}. Trying alternative options...`
  );
  
  // Implement fallback navigation options
  setTimeout(() => {
    try {
      if (targetRoute === '/discovery') {
        // Fallback 1: Try direct URL manipulation
        window.location.href = window.location.origin + window.location.pathname + '#/discovery';
      } else if (targetRoute === '/resources') {
        // Fallback 2: Open external documentation if internal resources fail
        showWarning(
          'Opening External Resources',
          'Internal resources unavailable. Opening external documentation.'
        );
        window.open('https://github.com/topics/software-architecture', '_blank');
      } else if (targetRoute === '/') {
        // Fallback 3: Force reload to home
        window.location.href = window.location.origin + window.location.pathname + '#/';
      } else {
        // Generic fallback: reload page
        showWarning(
          'Reloading Page',
          'Navigation failed. Reloading the page to recover.'
        );
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (fallbackError) {
      console.error('Fallback navigation also failed:', fallbackError);
      showError(
        'Critical Navigation Error',
        'All navigation options failed. Please refresh the page manually.'
      );
    }
  }, 2000);
};

interface User {
  email: string;
  id?: string;
}

export const SimpleDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [buttonStates, setButtonStates] = useState({
    createProject: { loading: false, disabled: false },
    browseRepositories: { loading: false, disabled: false },
    viewResources: { loading: false, disabled: false }
  });
  
  const { showError, showWarning, showInfo } = useToast();

  useEffect(() => {
    // Check if user is authenticated with enhanced error handling
    try {
      const token = localStorage.getItem('auth_token');
      const email = localStorage.getItem('user_email');
      
      if (!token || !email) {
        handleAuthenticationError(showError);
        return;
      }

      setUser({ email });
      setIsLoading(false);
    } catch (error) {
      console.error('Authentication check failed:', error);
      showError(
        'Authentication Error',
        'Failed to verify your login status. Please try refreshing the page.'
      );
      setIsLoading(false);
    }
  }, [showError]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_email');
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      showError('Logout Failed', 'Please try refreshing the page to log out.');
    }
  };

  // Enhanced button handlers with comprehensive error handling
  const handleCreateProject = async () => {
    // Set loading state
    setButtonStates(prev => ({
      ...prev,
      createProject: { loading: true, disabled: true }
    }));

    try {
      // Check authentication before navigation
      const token = localStorage.getItem('auth_token');
      if (!token) {
        handleAuthenticationError(showError);
        return;
      }

      // Attempt navigation with retry logic
      let navigationAttempts = 0;
      const maxAttempts = 3;
      
      while (navigationAttempts < maxAttempts) {
        try {
          navigate('/create-project');
          showInfo('Navigating to Project Creation', 'Loading enhanced project creation workflow...');
          break;
        } catch (navError) {
          navigationAttempts++;
          if (navigationAttempts >= maxAttempts) {
            throw navError;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      handleNavigationError(error as Error, '/create-project', showError, showWarning);
    } finally {
      // Reset button state after delay
      setTimeout(() => {
        setButtonStates(prev => ({
          ...prev,
          createProject: { loading: false, disabled: false }
        }));
      }, 2000);
    }
  };

  const handleBrowseRepositories = async () => {
    // Set loading state
    setButtonStates(prev => ({
      ...prev,
      browseRepositories: { loading: true, disabled: true }
    }));

    try {
      // Check authentication before navigation
      const token = localStorage.getItem('auth_token');
      if (!token) {
        handleAuthenticationError(showError);
        return;
      }

      // Attempt navigation with retry logic
      let navigationAttempts = 0;
      const maxAttempts = 3;
      
      while (navigationAttempts < maxAttempts) {
        try {
          navigate('/discovery');
          showInfo('Opening Repository Discovery', 'Loading repository browser...');
          break;
        } catch (navError) {
          navigationAttempts++;
          if (navigationAttempts >= maxAttempts) {
            throw navError;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      handleNavigationError(error as Error, '/discovery', showError, showWarning);
    } finally {
      // Reset button state after delay
      setTimeout(() => {
        setButtonStates(prev => ({
          ...prev,
          browseRepositories: { loading: false, disabled: false }
        }));
      }, 2000);
    }
  };

  const handleViewResources = async () => {
    // Set loading state
    setButtonStates(prev => ({
      ...prev,
      viewResources: { loading: true, disabled: true }
    }));

    try {
      // Check authentication before navigation
      const token = localStorage.getItem('auth_token');
      if (!token) {
        handleAuthenticationError(showError);
        return;
      }

      // Attempt navigation with retry logic
      let navigationAttempts = 0;
      const maxAttempts = 3;
      
      while (navigationAttempts < maxAttempts) {
        try {
          navigate('/resources');
          showInfo('Loading Learning Resources', 'Preparing educational content...');
          break;
        } catch (navError) {
          navigationAttempts++;
          if (navigationAttempts >= maxAttempts) {
            throw navError;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      handleNavigationError(error as Error, '/resources', showError, showWarning);
    } finally {
      // Reset button state after delay
      setTimeout(() => {
        setButtonStates(prev => ({
          ...prev,
          viewResources: { loading: false, disabled: false }
        }));
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Reverse Engineer Coach
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.email}</span>
              <Button
                onClick={handleLogout}
                variant="secondary"
                className="text-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Dashboard</h2>
          <p className="text-gray-400">
            Welcome to your learning dashboard. Start exploring software architecture patterns.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <SimpleErrorBoundary 
            componentName="CreateProjectButton"
            fallback={
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-center text-gray-400">
                  <p>Create Project button temporarily unavailable</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => window.location.reload()}
                    variant="secondary"
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            }
          >
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Start New Project</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Begin analyzing a new repository or create a learning project from scratch.
              </p>
              <Button 
                className="w-full" 
                onClick={handleCreateProject}
                disabled={buttonStates.createProject.disabled}
              >
                {buttonStates.createProject.loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </SimpleErrorBoundary>

          <SimpleErrorBoundary 
            componentName="BrowseRepositoriesButton"
            fallback={
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-center text-gray-400">
                  <p>Browse Repositories button temporarily unavailable</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => window.open('https://github.com/explore', '_blank')}
                    variant="secondary"
                  >
                    Open GitHub Explore
                  </Button>
                </div>
              </div>
            }
          >
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Explore Repositories</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Discover and analyze popular open-source projects to learn from real-world code.
              </p>
              <Button 
                className="w-full" 
                variant="secondary" 
                onClick={handleBrowseRepositories}
                disabled={buttonStates.browseRepositories.disabled}
              >
                {buttonStates.browseRepositories.loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Browse Repositories'
                )}
              </Button>
            </div>
          </SimpleErrorBoundary>

          <SimpleErrorBoundary 
            componentName="ViewResourcesButton"
            fallback={
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-center text-gray-400">
                  <p>Learning Resources button temporarily unavailable</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => window.open('https://github.com/topics/software-architecture', '_blank')}
                    variant="secondary"
                  >
                    Open External Resources
                  </Button>
                </div>
              </div>
            }
          >
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white ml-4">Learning Resources</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Access tutorials, guides, and documentation to enhance your understanding.
              </p>
              <Button 
                className="w-full" 
                variant="secondary" 
                onClick={handleViewResources}
                disabled={buttonStates.viewResources.disabled}
              >
                {buttonStates.viewResources.loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'View Resources'
                )}
              </Button>
            </div>
          </SimpleErrorBoundary>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
          <div className="text-gray-400 text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No recent activity yet.</p>
            <p className="text-sm">Start your first project to see your progress here.</p>
          </div>
        </div>
      </main>
    </div>
  );
};