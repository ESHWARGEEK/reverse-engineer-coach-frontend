import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  preferred_ai_provider: string;
  preferred_language: string;
  preferred_frameworks: string[] | null;
  created_at: string;
}

export interface AuthState {
  // Authentication state
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenExpiresAt: number | null;
  
  // Registration/Login form state
  formData: {
    email: string;
    password: string;
    confirmPassword: string;
    githubToken: string;
    openaiApiKey: string;
    geminiApiKey: string;
    preferredAiProvider: 'openai' | 'gemini';
    preferredLanguage: string;
    preferredFrameworks: string[];
  };
  
  // UI state
  showPassword: boolean;
  showConfirmPassword: boolean;
  showApiKeys: boolean;
}

export interface AuthActions {
  // Authentication actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  checkTokenExpiration: () => void;
  
  // Profile management
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateCredentials: (credentials: Partial<RegisterData>) => Promise<void>;
  
  // Form actions
  updateFormData: (field: string, value: any) => void;
  resetForm: () => void;
  togglePasswordVisibility: (field: 'password' | 'confirmPassword') => void;
  toggleApiKeysVisibility: () => void;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  github_token?: string;
  openai_api_key?: string;
  gemini_api_key?: string;
  preferred_ai_provider: 'openai' | 'gemini';
  preferred_language: string;
  preferred_frameworks?: string[];
}

const initialFormData = {
  email: '',
  password: '',
  confirmPassword: '',
  githubToken: '',
  openaiApiKey: '',
  geminiApiKey: '',
  preferredAiProvider: 'openai' as const,
  preferredLanguage: 'python',
  preferredFrameworks: [] as string[],
};

// Safe API base URL detection
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  
  // In production, use the environment variable or default to current origin
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // For production, check if we have a backend URL configured
  const backendUrl = process.env.REACT_APP_API_URL;
  if (backendUrl) {
    return backendUrl;
  }
  
  // Fallback to current origin (for when backend is on same domain)
  return window.location.origin;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenExpiresAt: null,
      formData: initialFormData,
      showPassword: false,
      showConfirmPassword: false,
      showApiKeys: false,

      // Authentication actions
      login: async (email: string, password: string, rememberMe: boolean = false) => {
        set({ isLoading: true, error: null });
        
        try {
          const apiUrl = getApiBaseUrl();
          const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, remember_me: rememberMe }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
          }

          const data = await response.json();
          const token = data.access_token;
          const refreshToken = data.refresh_token;
          const expiresIn = data.expires_in || 3600; // Default to 1 hour
          const tokenExpiresAt = Date.now() + (expiresIn * 1000);
          
          // Get user info
          const userResponse = await fetch(`${apiUrl}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!userResponse.ok) {
            throw new Error('Failed to get user information');
          }

          const user = await userResponse.json();
          
          set({
            user,
            token,
            refreshToken,
            tokenExpiresAt,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set up automatic token refresh
          const currentGet = get();
          if (currentGet.checkTokenExpiration) {
            currentGet.checkTokenExpiration();
          }
          
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const apiUrl = getApiBaseUrl();
          const response = await fetch(`${apiUrl}/api/v1/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
          }

          await response.json();
          
          // Auto-login after registration
          const currentGet = get();
          if (currentGet.login) {
            await currentGet.login(userData.email, userData.password);
          }
          
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          error: null,
          formData: initialFormData,
        });
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const apiUrl = getApiBaseUrl();
          const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            // Token might be expired
            const currentGet = get();
            if (currentGet.logout) {
              currentGet.logout();
            }
            return;
          }

          const user = await response.json();
          set({ user });
          
        } catch (error) {
          console.error('Failed to refresh user:', error);
          const currentGet = get();
          if (currentGet.logout) {
            currentGet.logout();
          }
        }
      },

      refreshAuthToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          const currentGet = get();
          if (currentGet.logout) {
            currentGet.logout();
          }
          return;
        }

        try {
          const apiUrl = getApiBaseUrl();
          const response = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!response.ok) {
            const currentGet = get();
            if (currentGet.logout) {
              currentGet.logout();
            }
            return;
          }

          const data = await response.json();
          const token = data.access_token;
          const newRefreshToken = data.refresh_token;
          const expiresIn = data.expires_in || 3600;
          const tokenExpiresAt = Date.now() + (expiresIn * 1000);

          set({
            token,
            refreshToken: newRefreshToken,
            tokenExpiresAt,
          });

          // Set up next refresh
          const currentGet = get();
          if (currentGet.checkTokenExpiration) {
            currentGet.checkTokenExpiration();
          }

        } catch (error) {
          console.error('Failed to refresh token:', error);
          const currentGet = get();
          if (currentGet.logout) {
            currentGet.logout();
          }
        }
      },

      checkTokenExpiration: () => {
        const { tokenExpiresAt, refreshToken } = get();
        if (!tokenExpiresAt || !refreshToken) return;

        const timeUntilExpiry = tokenExpiresAt - Date.now();
        const refreshThreshold = 5 * 60 * 1000; // 5 minutes before expiry

        if (timeUntilExpiry <= refreshThreshold) {
          const currentGet = get();
          if (currentGet.refreshAuthToken) {
            currentGet.refreshAuthToken();
          }
        } else {
          // Set timeout to check again before expiry
          setTimeout(() => {
            const currentGet = get();
            if (currentGet.checkTokenExpiration) {
              currentGet.checkTokenExpiration();
            }
          }, timeUntilExpiry - refreshThreshold);
        }
      },

      // Profile management
      updateProfile: async (updates: Partial<User>) => {
        const { token } = get();
        if (!token) throw new Error('Not authenticated');

        set({ isLoading: true, error: null });

        try {
          const apiUrl = getApiBaseUrl();
          const response = await fetch(`${apiUrl}/api/v1/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update profile');
          }

          const updatedUser = await response.json();
          set({ user: updatedUser, isLoading: false });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update profile',
            isLoading: false,
          });
          throw error;
        }
      },

      updateCredentials: async (credentials: Partial<RegisterData>) => {
        const { token } = get();
        if (!token) throw new Error('Not authenticated');

        set({ isLoading: true, error: null });

        try {
          const apiUrl = getApiBaseUrl();
          const response = await fetch(`${apiUrl}/api/v1/auth/credentials`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to update credentials');
          }

          set({ isLoading: false });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update credentials',
            isLoading: false,
          });
          throw error;
        }
      },

      // Form actions
      updateFormData: (field: string, value: any) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [field]: value,
          },
        }));
      },

      resetForm: () => {
        set({ formData: initialFormData });
      },

      togglePasswordVisibility: (field: 'password' | 'confirmPassword') => {
        if (field === 'password') {
          set((state) => ({ showPassword: !state.showPassword }));
        } else {
          set((state) => ({ showConfirmPassword: !state.showConfirmPassword }));
        }
      },

      toggleApiKeysVisibility: () => {
        set((state) => ({ showApiKeys: !state.showApiKeys }));
      },

      // Error handling
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);