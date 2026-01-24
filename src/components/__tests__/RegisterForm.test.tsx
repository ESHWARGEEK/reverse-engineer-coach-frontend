import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../auth/RegisterForm';
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
  Key: ({ className }: any) => <div data-testid="key-icon" className={className} />,
  ChevronDown: ({ className }: any) => <div data-testid="chevron-down-icon" className={className} />,
  ChevronUp: ({ className }: any) => <div data-testid="chevron-up-icon" className={className} />,
  CheckCircle: ({ className }: any) => <div data-testid="check-circle-icon" className={className} />,
  Loader2: ({ className }: any) => <div data-testid="loader-icon" className={className} />,
}));

// Mock fetch for API key validation
global.fetch = jest.fn();

describe('RegisterForm', () => {
  const mockProps = {
    onSwitchToLogin: jest.fn(),
    onSuccess: jest.fn(),
  };

  const mockStoreState = {
    formData: {
      email: '',
      password: '',
      confirmPassword: '',
      githubToken: '',
      openaiApiKey: '',
      geminiApiKey: '',
      preferredAiProvider: 'openai',
      preferredLanguage: 'python',
      preferredFrameworks: [],
    },
    isLoading: false,
    error: null,
    showPassword: false,
    showConfirmPassword: false,
    showApiKeys: false,
    updateFormData: jest.fn(),
    togglePasswordVisibility: jest.fn(),
    toggleApiKeysVisibility: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    mockAuthService.validateEmail.mockReturnValue(true);
    mockAuthService.validatePassword.mockReturnValue({ isValid: true, errors: [] });
    mockAuthService.validateApiKey.mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ valid: true }),
    });
  });

  it('renders registration form with all required fields', () => {
    render(<RegisterForm {...mockProps} />);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Join the Reverse Engineer Coach platform')).toBeInTheDocument();
    
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password *')).toBeInTheDocument();
    expect(screen.getByText('Preferred AI Provider *')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred Programming Language *')).toBeInTheDocument();
  });

  it('displays AI provider options', () => {
    render(<RegisterForm {...mockProps} />);

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('GPT-4, GPT-3.5')).toBeInTheDocument();
    expect(screen.getByText('Google Gemini')).toBeInTheDocument();
    expect(screen.getByText('Gemini Pro')).toBeInTheDocument();
  });

  it('displays programming language options', () => {
    render(<RegisterForm {...mockProps} />);

    const languageSelect = screen.getByLabelText('Preferred Programming Language *');
    expect(languageSelect).toBeInTheDocument();
    
    // Check if Python is selected by default
    expect(languageSelect).toHaveValue('python');
  });

  it('calls updateFormData when email input changes', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const emailInput = screen.getByLabelText('Email Address *');
    await user.type(emailInput, 'test@example.com');

    expect(mockStoreState.updateFormData).toHaveBeenCalledWith('email', 'test@example.com');
  });

  it('calls updateFormData when password input changes', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const passwordInput = screen.getByLabelText('Password *');
    await user.type(passwordInput, 'password123');

    expect(mockStoreState.updateFormData).toHaveBeenCalledWith('password', 'password123');
  });

  it('shows validation error for invalid email', async () => {
    mockAuthService.validateEmail.mockReturnValue(false);
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { ...mockStoreState.formData, email: 'invalid-email' },
    });

    render(<RegisterForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows password strength requirements when password is weak', async () => {
    mockAuthService.validatePassword.mockReturnValue({
      isValid: false,
      errors: ['At least 8 characters', 'At least one uppercase letter'],
    });
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { ...mockStoreState.formData, password: 'weak' },
    });

    render(<RegisterForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Password requirements:')).toBeInTheDocument();
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('At least one uppercase letter')).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: {
        ...mockStoreState.formData,
        password: 'password123',
        confirmPassword: 'different',
      },
    });

    render(<RegisterForm {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('toggles API keys section when clicked', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const apiKeysButton = screen.getByRole('button', { name: /api keys/i });
    await user.click(apiKeysButton);

    expect(mockStoreState.toggleApiKeysVisibility).toHaveBeenCalled();
  });

  it('shows API key fields when API keys section is expanded', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      showApiKeys: true,
    });

    render(<RegisterForm {...mockProps} />);

    expect(screen.getByLabelText(/OpenAI API Key/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gemini API Key/)).toBeInTheDocument();
    expect(screen.getByLabelText(/GitHub Personal Access Token/)).toBeInTheDocument();
  });

  it('validates API keys when user types', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      showApiKeys: true,
    });

    render(<RegisterForm {...mockProps} />);

    const openaiInput = screen.getByLabelText(/OpenAI API Key/);
    await user.type(openaiInput, 'sk-test123');

    // Wait for debounced validation
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/auth/test-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'sk-test123', type: 'openai' }),
      });
    }, { timeout: 2000 });
  });

  it('changes frameworks when language is changed', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const languageSelect = screen.getByLabelText('Preferred Programming Language *');
    await user.selectOptions(languageSelect, 'typescript');

    expect(mockStoreState.updateFormData).toHaveBeenCalledWith('preferredLanguage', 'typescript');
    expect(mockStoreState.updateFormData).toHaveBeenCalledWith('preferredFrameworks', []);
  });

  it('shows framework options for selected language', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { ...mockStoreState.formData, preferredLanguage: 'typescript' },
    });

    render(<RegisterForm {...mockProps} />);

    expect(screen.getByText('Preferred Frameworks (Optional)')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('NestJS')).toBeInTheDocument();
  });

  it('toggles framework selection', async () => {
    const user = userEvent.setup();
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: { ...mockStoreState.formData, preferredLanguage: 'typescript' },
    });

    render(<RegisterForm {...mockProps} />);

    const reactCheckbox = screen.getByRole('checkbox', { name: /react/i });
    await user.click(reactCheckbox);

    expect(mockStoreState.updateFormData).toHaveBeenCalledWith('preferredFrameworks', ['react']);
  });

  it('calls register function on form submission', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: {
        ...mockStoreState.formData,
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });

    render(<RegisterForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStoreState.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        github_token: undefined,
        openai_api_key: undefined,
        gemini_api_key: undefined,
        preferred_ai_provider: 'openai',
        preferred_language: 'python',
        preferred_frameworks: undefined,
      });
    });
  });

  it('calls onSuccess callback after successful registration', async () => {
    mockStoreState.register.mockResolvedValue(undefined);
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: {
        ...mockStoreState.formData,
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });

    render(<RegisterForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message when registration fails', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      error: 'Email already exists',
    });

    render(<RegisterForm {...mockProps} />);

    expect(screen.getByText('Email already exists')).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
  });

  it('shows loading state during registration', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      isLoading: true,
    });

    render(<RegisterForm {...mockProps} />);

    expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });

  it('calls onSwitchToLogin when sign in link is clicked', async () => {
    const user = userEvent.setup();
    render(<RegisterForm {...mockProps} />);

    const signInLink = screen.getByRole('button', { name: /sign in here/i });
    await user.click(signInLink);

    expect(mockProps.onSwitchToLogin).toHaveBeenCalled();
  });

  it('prevents submission when API keys are being validated', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: {
        ...mockStoreState.formData,
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    });

    // Mock API key validation in progress
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RegisterForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockStoreState.setError).toHaveBeenCalledWith('Please wait for API key validation to complete');
    });
  });

  it('requires OpenAI API key when OpenAI is selected', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: {
        ...mockStoreState.formData,
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        preferredAiProvider: 'openai',
        openaiApiKey: '',
      },
    });

    render(<RegisterForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('OpenAI API key is required when OpenAI is selected')).toBeInTheDocument();
    });
  });

  it('requires Gemini API key when Gemini is selected', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      formData: {
        ...mockStoreState.formData,
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        preferredAiProvider: 'gemini',
        geminiApiKey: '',
      },
    });

    render(<RegisterForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Gemini API key is required when Gemini is selected')).toBeInTheDocument();
    });
  });

  it('shows API key validation success state', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      showApiKeys: true,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ valid: true }),
    });

    render(<RegisterForm {...mockProps} />);

    const openaiInput = screen.getByLabelText(/OpenAI API Key/);
    fireEvent.change(openaiInput, { target: { value: 'sk-valid123' } });

    await waitFor(() => {
      expect(screen.getByText('API key validated successfully')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows API key validation error state', async () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      showApiKeys: true,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Invalid API key' }),
    });

    render(<RegisterForm {...mockProps} />);

    const openaiInput = screen.getByLabelText(/OpenAI API Key/);
    fireEvent.change(openaiInput, { target: { value: 'sk-invalid123' } });

    await waitFor(() => {
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});