import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../auth/LoginForm';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

// Mock the auth store
jest.mock('../../store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock the auth service
jest.mock('../../services/authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Eye: ({ className }: any) => <div data-testid="eye-icon" className={className} />,
  EyeOff: ({ className }: any) => <div data-testid="eye-off-icon" className={className} />,
  Mail: ({ className }: any) => <div data-testid="mail-icon" className={className} />,
  Lock: ({ className }: any) => <div data-testid="lock-icon" className={className} />,
  AlertCircle: ({ className }: any) => <div data-testid="alert-circle-icon" className={className} />,
}));

describe('LoginForm', () => {
  const mockProps = {
    onSwitchToRegister: jest.fn(),
    onSuccess: jest.fn(),
  };

  const mockStoreState = {
    formData: {
      email: '',
      password: '',
    },
    isLoading: false,
    error: null,
    showPassword: false,
    updateFormData: jest.fn(),
    togglePasswordVisibility: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    mockAuthService.validateEmail.mockReturnValue(true);
  });

  it('renders login form with all required fields', () => {
    render(<LoginForm {...mockProps} />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to continue your learning journey')).toBeInTheDocument();
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays email and password icons', () => {
    render(<LoginForm {...mockProps} />);

    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('calls updateFormData when email input changes', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    expect(mockStoreState.updateFormData).toHaveBeenCalledWith('email', 'test@example.com');
  });

  it('calls updateFormData when password input changes', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'password123');

    expect(mockStoreState.updateFormData).toHaveBeenCalledWith('password', 'password123');
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button
    await user.click(toggleButton);

    expect(mockStoreState.togglePasswordVisibility).toHaveBeenCalledWith('password');
  });

  it('shows validation error for invalid email', async () => {
    mockAuthService.validateEmail.mockReturnValue(false);
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: 'invalid-email', password: '' },
    });

    render(<LoginForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: 'test@example.com', password: '' },
    });

    render(<LoginForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('disables submit button when form is invalid', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: '', password: '' },
    });

    render(<LoginForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: 'test@example.com', password: 'password123' },
    });

    render(<LoginForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls login function on form submission', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: 'test@example.com', password: 'password123' },
    });

    render(<LoginForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStoreState.login).toHaveBeenCalledWith('test@example.com', 'password123', false);
    });
  });

  it('calls onSuccess callback after successful login', async () => {
    mockStoreState.login.mockResolvedValue(undefined);
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: 'test@example.com', password: 'password123' },
    });

    render(<LoginForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message when login fails', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      error: 'Invalid credentials',
    });

    render(<LoginForm {...mockProps} />);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('shows loading state during login', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      isLoading: true,
    });

    render(<LoginForm {...mockProps} />);

    expect(screen.getByText('Signing In...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('handles remember me checkbox', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: 'test@example.com', password: 'password123' },
    });

    render(<LoginForm {...mockProps} />);

    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    await user.click(rememberMeCheckbox);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStoreState.login).toHaveBeenCalledWith('test@example.com', 'password123', true);
    });
  });

  it('calls onSwitchToRegister when sign up link is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const signUpLink = screen.getByRole('button', { name: /sign up here/i });
    await user.click(signUpLink);

    expect(mockProps.onSwitchToRegister).toHaveBeenCalled();
  });

  it('shows forgot password message when forgot password is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginForm {...mockProps} />);

    const forgotPasswordLink = screen.getByRole('button', { name: /forgot password/i });
    await user.click(forgotPasswordLink);

    expect(mockStoreState.setError).toHaveBeenCalledWith('Forgot password functionality coming soon');
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    mockAuthService.validateEmail.mockReturnValue(false);
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: 'invalid', password: '' },
    });

    render(<LoginForm {...mockProps} />);

    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    // Start typing in email field
    const emailInput = screen.getByLabelText('Email Address');
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');

    // Validation error should be cleared
    expect(mockStoreState.updateFormData).toHaveBeenCalledWith('email', 'test@example.com');
  });

  it('prevents form submission when validation fails', async () => {
    mockAuthService.validateEmail.mockReturnValue(false);
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { email: 'invalid-email', password: '' },
    });

    render(<LoginForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    expect(mockStoreState.login).not.toHaveBeenCalled();
  });
});