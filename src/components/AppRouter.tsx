import React, { useEffect, useState } from 'react';
import { Layout } from './layout';
import { HomePage } from './HomePage';
import { WorkspacePage } from './WorkspacePage';
import { ProjectDashboard } from './ProjectDashboard';
import { Dashboard } from './Dashboard';
import { AuthPage } from './auth/AuthPage';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ErrorBoundary } from './error/ErrorBoundary';
import { useAuthInit } from '../hooks/useAuthInit';

/**
 * Simple hash-based router with authentication support
 */
export const AppRouter: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
  
  // Initialize authentication state - now safely handles store errors
  useAuthInit();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderRoute = () => {
    // Authentication routes (public only)
    if (currentPath === '/auth' || currentPath === '/login' || currentPath === '/register') {
      return (
        <ErrorBoundary componentName="AuthPage" enableRecovery={true}>
          <ProtectedRoute requireAuth={false}>
            <AuthPage />
          </ProtectedRoute>
        </ErrorBoundary>
      );
    }

    // Dashboard (protected) - Full screen layout
    if (currentPath === '/dashboard') {
      return (
        <ErrorBoundary componentName="Dashboard" enableRecovery={true}>
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </ErrorBoundary>
      );
    }

    // Projects page (protected) - With navigation
    if (currentPath === '/projects') {
      return (
        <ErrorBoundary componentName="ProjectDashboard" enableRecovery={true}>
          <ProtectedRoute>
            <Layout showNavigation={true}>
              <ProjectDashboard />
            </Layout>
          </ProtectedRoute>
        </ErrorBoundary>
      );
    }

    // Workspace (protected) - Without main navigation for focus
    if (currentPath.startsWith('/workspace/')) {
      return (
        <ErrorBoundary componentName="WorkspacePage" enableRecovery={true}>
          <ProtectedRoute>
            <Layout showNavigation={false}>
              <WorkspacePage />
            </Layout>
          </ProtectedRoute>
        </ErrorBoundary>
      );
    }

    // Home page (public, but enhanced for authenticated users) - With navigation
    if (currentPath === '/' || currentPath === '/home') {
      return (
        <ErrorBoundary componentName="HomePage" enableRecovery={true}>
          <Layout showNavigation={true}>
            <HomePage />
          </Layout>
        </ErrorBoundary>
      );
    }

    // Default fallback - redirect to home
    return (
      <ErrorBoundary componentName="HomePage" enableRecovery={true}>
        <Layout showNavigation={true}>
          <HomePage />
        </Layout>
      </ErrorBoundary>
    );
  };

  return renderRoute();
};

/**
 * Navigation helper functions for hash-based routing
 */
export const navigate = (path: string, replace: boolean = false) => {
  if (replace) {
    window.location.replace(`#${path}`);
  } else {
    window.location.hash = path;
  }
};

export const getCurrentPath = () => {
  return window.location.hash.slice(1) || '/';
};

export const getSearchParams = () => {
  const hash = window.location.hash;
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return new URLSearchParams();
  
  return new URLSearchParams(hash.slice(queryStart + 1));
};