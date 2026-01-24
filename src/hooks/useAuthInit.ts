import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Hook to initialize authentication state and set up automatic token refresh
 * Safe version that handles store initialization errors
 */
export const useAuthInit = () => {
  useEffect(() => {
    // Delay the store access to ensure React is fully initialized
    const initializeAuth = () => {
      try {
        const store = useAuthStore.getState();
        
        if (store.isAuthenticated && store.checkTokenExpiration) {
          // Check token expiration on app load
          store.checkTokenExpiration();
          
          // Refresh user data to ensure it's up to date
          if (store.refreshUser) {
            store.refreshUser().catch(console.error);
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      }
    };

    // Initialize immediately
    initializeAuth();

    // Set up periodic token expiration checks
    const interval = setInterval(() => {
      try {
        const store = useAuthStore.getState();
        if (store.isAuthenticated && store.checkTokenExpiration) {
          store.checkTokenExpiration();
        }
      } catch (error) {
        console.error('Error during token expiration check:', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Return store state safely
  try {
    const store = useAuthStore();
    return {
      isAuthenticated: store?.isAuthenticated || false,
      user: store?.user || null,
      isLoading: store?.isLoading || false,
      error: store?.error || null
    };
  } catch (error) {
    console.error('Error accessing auth store:', error);
    return {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null
    };
  }
};