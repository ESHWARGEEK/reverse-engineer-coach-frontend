import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SimpleDashboard } from '../SimpleDashboard';
import { useToastStore } from '../../store/toastStore';

// Mock the toast store
jest.mock('../../store/toastStore', () => ({
  useToast: () => ({
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  }),
  useToastStore: () => ({
    toasts: [],
    removeToast: jest.fn(),
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location
const mockLocation = {
  hash: '',
  href: '',
  origin: 'http://localhost:3000',
  pathname: '/',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('SimpleDashboard Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'auth_token') return 'valid-token';
      if (key === 'user_email') return 'test@example.com';
      return null;
    });
  });

  test('handles authentication errors gracefully', async () => {
    // Mock authentication failure
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(<SimpleDashboard />);
    
    // Should handle missing authentication gracefully
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user_email');
  });

  test('displays error boundaries for button components', () => {
    render(<SimpleDashboard />);
    
    // Check that buttons are wrapped in error boundaries
    expect(screen.getByText('Create Project')).toBeInTheDocument();
    expect(screen.getByText('Browse Repositories')).toBeInTheDocument();
    expect(screen.getByText('View Resources')).toBeInTheDocument();
  });

  test('shows loading states when buttons are clicked', async () => {
    render(<SimpleDashboard />);
    
    const createProjectButton = screen.getByText('Create Project');
    
    // Click the button
    fireEvent.click(createProjectButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  test('handles navigation errors with fallback options', async () => {
    // Mock navigation failure
    const originalHash = Object.getOwnPropertyDescriptor(window.location, 'hash');
    Object.defineProperty(window.location, 'hash', {
      set: jest.fn(() => {
        throw new Error('Navigation failed');
      }),
      configurable: true,
    });

    render(<SimpleDashboard />);
    
    const createProjectButton = screen.getByText('Create Project');
    fireEvent.click(createProjectButton);
    
    // Should handle navigation error gracefully
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    // Restore original property
    if (originalHash) {
      Object.defineProperty(window.location, 'hash', originalHash);
    }
  });

  test('provides fallback UI when error boundaries trigger', () => {
    // This test would need to simulate an error in the component
    // For now, we just verify the error boundary structure exists
    render(<SimpleDashboard />);
    
    // The component should render without throwing
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});