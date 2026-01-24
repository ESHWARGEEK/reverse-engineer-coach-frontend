import { User } from '../store/simpleStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  github_token?: string;
  openai_api_key?: string;
  gemini_api_key?: string;
  preferred_ai_provider: string;
  preferred_language: string;
  preferred_frameworks?: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class SimpleAuthService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    return response.json();
  }

  async register(userData: RegisterData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  }

  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get user information');
    }

    return response.json();
  }

  async updateUser(token: string, updates: Partial<RegisterData>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'PUT',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update user');
    }

    return response.json();
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate API key format (basic validation)
  validateApiKey(key: string, type: 'openai' | 'gemini' | 'github'): boolean {
    if (!key) return false;
    
    switch (type) {
      case 'openai':
        return key.startsWith('sk-') && key.length > 20;
      case 'gemini':
        return key.length > 20; // Basic length check for Gemini
      case 'github':
        return key.startsWith('ghp_') || key.startsWith('github_pat_');
      default:
        return false;
    }
  }
}

export const simpleAuthService = new SimpleAuthService();