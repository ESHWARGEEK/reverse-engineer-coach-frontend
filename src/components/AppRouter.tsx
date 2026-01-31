import React, { useEffect, useState } from 'react';
import { SimpleLayout } from './layout/SimpleLayout';
import { SimpleHomePage } from './SimpleHomePage';
import { WorkspacePage } from './WorkspacePage';
import { ProjectDashboard } from './ProjectDashboard';
import { SimpleDashboard } from './SimpleDashboard';
import { SimpleAuthPage } from './auth/SimpleAuthPage';
import { SimpleProtectedRoute } from './auth/SimpleProtectedRoute';
import { SimpleErrorBoundary } from './error/SimpleErrorBoundary';
import { LearningResourcesPage } from './LearningResourcesPage';
import { RepositoryDiscoveryPage } from './RepositoryDiscoveryPage';
// import { EnhancedProjectCreationWorkflow } from './EnhancedProjectCreationWorkflow';
import { useToast } from '../store/toastStore';
import { navigate, getCurrentPath, getSearchParams } from '../utils/navigation';
import { useAuthInit } from '../hooks/useAuthInit';

/**
 * Enhanced error boundary handler for route components
 */
const createRouteErrorHandler = (componentName: string, fallbackRoute: string = '/auth') => {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Route error in ${componentName}:`, error, errorInfo);
    
    // Attempt recovery by navigating to fallback route
    setTimeout(() => {
      try {
        navigate(fallbackRoute, true);
      } catch (navError) {
        console.error('Fallback navigation failed:', navError);
        // Last resort: reload the page
        window.location.reload();
      }
    }, 3000);
  };
};

/**
 * Simple hash-based router with authentication support and enhanced error handling
 */
export const AppRouter: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(getCurrentPath());
  const [routeError, setRouteError] = useState<string | null>(null);
  const { showError, showWarning } = useToast();
  
  // Initialize authentication state - now safely handles store errors
  useAuthInit();

  useEffect(() => {
    const handleHashChange = () => {
      try {
        const newPath = getCurrentPath();
        setCurrentPath(newPath);
        setRouteError(null); // Clear any previous route errors
      } catch (error) {
        console.error('Hash change handling failed:', error);
        setRouteError('Navigation error occurred');
        showError('Navigation Error', 'Failed to process route change');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [showError]);

  // Enhanced authentication check with error handling
  const checkAuthentication = () => {
    try {
      const token = localStorage.getItem('auth_token');
      const email = localStorage.getItem('user_email');
      return !!token && !!email;
    } catch (error) {
      console.error('Authentication check failed:', error);
      showWarning('Authentication Check Failed', 'Unable to verify login status');
      return false;
    }
  };

  const renderRoute = () => {
    // Handle route errors
    if (routeError) {
      return (
        <SimpleErrorBoundary 
          componentName="RouteError" 
          onError={createRouteErrorHandler('RouteError', '/auth')}
        >
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
              <h2 className="text-xl font-semibold text-white mb-4">Route Error</h2>
              <p className="text-gray-400 mb-4">{routeError}</p>
              <button
                onClick={() => {
                  setRouteError(null);
                  navigate('/auth', true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Return to Login
              </button>
            </div>
          </div>
        </SimpleErrorBoundary>
      );
    }

    const isAuthenticated = checkAuthentication();

    // Authentication routes (public only)
    if (currentPath === '/auth' || currentPath === '/login' || currentPath === '/register') {
      return (
        <SimpleErrorBoundary 
          componentName="SimpleAuthPage" 
          enableRecovery={true}
          onError={createRouteErrorHandler('SimpleAuthPage', '/auth')}
        >
          <SimpleAuthPage />
        </SimpleErrorBoundary>
      );
    }

    // Enhanced Project Creation Workflow (protected) - With navigation
    if (currentPath === '/create-project') {
      return (
        <SimpleErrorBoundary 
          componentName="EnhancedProjectCreationWorkflow" 
          enableRecovery={true}
          onError={createRouteErrorHandler('EnhancedProjectCreationWorkflow', '/dashboard')}
          fallback={
            <SimpleLayout showNavigation={true}>
              <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
                  <h2 className="text-xl font-semibold text-white mb-4">Enhanced Project Creation Unavailable</h2>
                  <p className="text-gray-400 mb-4">The enhanced project creation workflow is temporarily unavailable.</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Return to Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Use Simple Project Creation
                    </button>
                  </div>
                </div>
              </div>
            </SimpleLayout>
          }
        >
          <SimpleProtectedRoute>
            <SimpleLayout showNavigation={true}>
              {/* <EnhancedProjectCreationWorkflow /> */}
              <div className="text-center text-white p-8">
                <h2 className="text-2xl font-bold mb-4">Enhanced Workflow Temporarily Unavailable</h2>
                <p className="text-gray-300 mb-4">This feature is being updated. Please use the regular project creation for now.</p>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Go to Dashboard
                </button>
              </div>
            </SimpleLayout>
          </SimpleProtectedRoute>
        </SimpleErrorBoundary>
      );
    }

    // Dashboard (protected) - Full screen layout
    if (currentPath === '/dashboard') {
      return (
        <SimpleErrorBoundary 
          componentName="SimpleDashboard" 
          enableRecovery={true}
          onError={createRouteErrorHandler('SimpleDashboard', '/auth')}
        >
          <SimpleProtectedRoute>
            <SimpleDashboard />
          </SimpleProtectedRoute>
        </SimpleErrorBoundary>
      );
    }

    // Projects page (protected) - With navigation
    if (currentPath === '/projects') {
      return (
        <SimpleErrorBoundary 
          componentName="ProjectDashboard" 
          enableRecovery={true}
          onError={createRouteErrorHandler('ProjectDashboard', '/dashboard')}
        >
          <SimpleProtectedRoute>
            <SimpleLayout showNavigation={true}>
              <ProjectDashboard />
            </SimpleLayout>
          </SimpleProtectedRoute>
        </SimpleErrorBoundary>
      );
    }

    // Repository Discovery page (protected) - With navigation
    if (currentPath === '/discovery') {
      return (
        <SimpleErrorBoundary 
          componentName="RepositoryDiscoveryPage" 
          enableRecovery={true}
          onError={createRouteErrorHandler('RepositoryDiscoveryPage', '/dashboard')}
          fallback={
            <SimpleLayout showNavigation={true}>
              <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
                  <h2 className="text-xl font-semibold text-white mb-4">Repository Discovery Unavailable</h2>
                  <p className="text-gray-400 mb-4">The repository discovery feature is temporarily unavailable.</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Return to Dashboard
                    </button>
                    <button
                      onClick={() => window.open('https://github.com/explore', '_blank')}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Open GitHub Explore
                    </button>
                  </div>
                </div>
              </div>
            </SimpleLayout>
          }
        >
          <SimpleProtectedRoute>
            <SimpleLayout showNavigation={true}>
              <RepositoryDiscoveryPage />
            </SimpleLayout>
          </SimpleProtectedRoute>
        </SimpleErrorBoundary>
      );
    }

    // Learning Resources page (protected) - With navigation
    if (currentPath === '/resources') {
      return (
        <SimpleErrorBoundary 
          componentName="LearningResourcesPage" 
          enableRecovery={true}
          onError={createRouteErrorHandler('LearningResourcesPage', '/dashboard')}
          fallback={
            <SimpleLayout showNavigation={true}>
              <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
                  <h2 className="text-xl font-semibold text-white mb-4">Learning Resources Unavailable</h2>
                  <p className="text-gray-400 mb-4">The learning resources are temporarily unavailable.</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Return to Dashboard
                    </button>
                    <button
                      onClick={() => window.open('https://github.com/topics/software-architecture', '_blank')}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                      Open External Resources
                    </button>
                  </div>
                </div>
              </div>
            </SimpleLayout>
          }
        >
          <SimpleProtectedRoute>
            <SimpleLayout showNavigation={true}>
              <LearningResourcesPage />
            </SimpleLayout>
          </SimpleProtectedRoute>
        </SimpleErrorBoundary>
      );
    }

    // Workspace (protected) - Without main navigation for focus
    if (currentPath.startsWith('/workspace/')) {
      return (
        <SimpleErrorBoundary 
          componentName="WorkspacePage" 
          enableRecovery={true}
          onError={createRouteErrorHandler('WorkspacePage', '/dashboard')}
        >
          <SimpleProtectedRoute>
            <SimpleLayout showNavigation={false}>
              <WorkspacePage />
            </SimpleLayout>
          </SimpleProtectedRoute>
        </SimpleErrorBoundary>
      );
    }

    // Home page - redirect unauthenticated users to auth
    if (currentPath === '/' || currentPath === '/home') {
      if (!isAuthenticated) {
        // Redirect to auth page for unauthenticated users
        try {
          navigate('/auth', true);
        } catch (error) {
          console.error('Redirect to auth failed:', error);
          setRouteError('Failed to redirect to authentication');
        }
        return (
          <SimpleErrorBoundary 
            componentName="SimpleAuthPage" 
            enableRecovery={true}
            onError={createRouteErrorHandler('SimpleAuthPage', '/auth')}
          >
            <SimpleAuthPage />
          </SimpleErrorBoundary>
        );
      }
      
      return (
        <SimpleErrorBoundary 
          componentName="SimpleHomePage" 
          enableRecovery={true}
          onError={createRouteErrorHandler('SimpleHomePage', '/dashboard')}
        >
          <SimpleLayout showNavigation={true}>
            <SimpleHomePage />
          </SimpleLayout>
        </SimpleErrorBoundary>
      );
    }

    // Default fallback - redirect to auth for unauthenticated, home for authenticated
    if (!isAuthenticated) {
      try {
        navigate('/auth', true);
      } catch (error) {
        console.error('Fallback redirect to auth failed:', error);
        setRouteError('Critical navigation error');
      }
      return (
        <SimpleErrorBoundary 
          componentName="SimpleAuthPage" 
          enableRecovery={true}
          onError={createRouteErrorHandler('SimpleAuthPage', '/auth')}
        >
          <SimpleAuthPage />
        </SimpleErrorBoundary>
      );
    }
    
    return (
      <SimpleErrorBoundary 
        componentName="SimpleHomePage" 
        enableRecovery={true}
        onError={createRouteErrorHandler('SimpleHomePage', '/dashboard')}
      >
        <SimpleLayout showNavigation={true}>
          <SimpleHomePage />
        </SimpleLayout>
      </SimpleErrorBoundary>
    );
  };

  return renderRoute();
};