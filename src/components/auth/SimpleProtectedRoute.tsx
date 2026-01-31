import React, { useEffect, useState } from 'react';
import { useToast } from '../../store/toastStore';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Enhanced ProtectedRoute component with comprehensive authentication error handling
 */
export const SimpleProtectedRoute: React.FC<SimpleProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { showError, showWarning } = useToast();

  useEffect(() => {
    // Enhanced authentication check with error handling
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const email = localStorage.getItem('user_email');
        
        if (!token || !email) {
          setAuthError('No authentication credentials found');
          setIsAuthenticated(false);
          return;
        }

        // Additional token validation (basic format check)
        if (token.length < 10) {
          setAuthError('Invalid authentication token format');
          setIsAuthenticated(false);
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_email');
          return;
        }

        // Check if token is expired (if it contains expiration info)
        try {
          // Basic JWT structure check (if using JWT)
          if (token.includes('.')) {
            const parts = token.split('.');
            if (parts.length === 3) {
              // Decode payload to check expiration
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp && payload.exp * 1000 < Date.now()) {
                setAuthError('Authentication token has expired');
                setIsAuthenticated(false);
                // Clear expired token
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_email');
                showWarning('Session Expired', 'Your session has expired. Please log in again.');
                return;
              }
            }
          }
        } catch (tokenError) {
          // If token parsing fails, it might not be JWT - continue with basic validation
          console.warn('Token parsing failed (might not be JWT):', tokenError);
        }

        setIsAuthenticated(true);
        setAuthError(null);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setAuthError('Authentication verification failed');
        setIsAuthenticated(false);
        showError('Authentication Error', 'Failed to verify your login status. Please try logging in again.');
      }
    };

    checkAuthentication();
  }, [showError, showWarning]);

  // Handle authentication redirect with error handling
  const handleAuthRedirect = () => {
    try {
      // Store the current path for redirect after login
      const currentPath = window.location.hash.slice(1);
      if (currentPath && currentPath !== '/auth') {
        localStorage.setItem('redirect_after_login', currentPath);
      }
      
      // Navigate to auth page
      window.location.hash = '/auth';
    } catch (error) {
      console.error('Auth redirect failed:', error);
      // Fallback: force reload to auth page
      window.location.href = window.location.origin + window.location.pathname + '#/auth';
    }
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white">Verifying authentication...</div>
        </div>
      </div>
    );
  }

  // If authentication failed, show error and redirect options
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          
          <p className="text-gray-400 mb-4">
            {authError || 'You need to be logged in to access this page.'}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleAuthRedirect}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>

          {authError && (
            <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded">
              <p className="text-red-200 text-sm">
                Error: {authError}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render the protected content
  return <>{children}</>;
};