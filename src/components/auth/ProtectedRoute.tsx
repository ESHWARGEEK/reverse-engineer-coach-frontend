import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that handles authentication checking and redirects
 * 
 * Features:
 * - Automatic redirect to login for unauthenticated users
 * - Preserves intended destination for post-login redirect
 * - Loading states during authentication verification
 * - Support for both protected and public routes
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/auth'
}) => {
  const { isAuthenticated, isLoading, token, refreshUser, checkTokenExpiration } = useAuthStore();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuthentication = async () => {
      if (token) {
        // Check if token is expired and refresh if needed
        checkTokenExpiration();
        
        // Refresh user data to ensure it's valid
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to verify user authentication:', error);
        }
      }
      
      setIsVerifying(false);
    };

    verifyAuthentication();
  }, [token, checkTokenExpiration, refreshUser]);

  // Show loading spinner while verifying authentication
  if (isVerifying || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If route requires authentication but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Store the intended destination for post-login redirect
    const from = location.pathname + location.search;
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from }} 
        replace 
      />
    );
  }

  // If route is for unauthenticated users only (like login/register) but user is authenticated
  if (!requireAuth && isAuthenticated) {
    // Check if there's a stored destination to redirect to
    const from = location.state?.from || '/dashboard';
    
    return (
      <Navigate 
        to={from} 
        replace 
      />
    );
  }

  // Render the protected content
  return <>{children}</>;
};

/**
 * Higher-order component version of ProtectedRoute for easier usage
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: { requireAuth?: boolean; redirectTo?: string }
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * Hook to check authentication status and get redirect utilities
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  const redirectToLogin = (from?: string) => {
    const destination = from || location.pathname + location.search;
    return {
      pathname: '/auth',
      state: { from: destination }
    };
  };

  const getRedirectDestination = () => {
    return location.state?.from || '/dashboard';
  };

  return {
    isAuthenticated,
    isLoading,
    redirectToLogin,
    getRedirectDestination
  };
};