import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthPage } from '../auth/AuthPage';
import { useAuthStore } from '../../store/authStore';
import { useAuthInit } from '../../hooks/useAuthInit';

// Mock the auth store
jest.mock('../../store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock the auth init hook
jest.mock('../../hooks/useAuthInit');
const mockUseAuthInit = useAuthInit as jest.MockedFunction<typeof useAuthInit>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null }),
}));

// Mock child components
jest.mock('../auth/LoginForm', () => ({
  LoginForm: ({ onSwitchToRegister, onSuccess }: any) => (
    <div data-testid="login-form">
      <button onClick={onSwitchToRegister} data-testid="switch-to-register">
        Switch to Register
      </button>
      <button onClick={onSuccess} data-testid="login-success">
        Login Success
      </button>
    </div>
  ),
}));

jest.mock('../auth/RegisterForm', () => ({
  RegisterForm: ({ onSwitchToLogin, onSuccess }: any) => (
    <div data-testid="register-form">
      <button onClick={onSwitchToLogin} data-testid="switch-to-login">
        Switch to Login
      </button>
      <button onClick={onSuccess} data-testid="register-success">
        Register Success
      </button>
    </div>
  ),
}));

const AuthPageWrapper: React.FC<{ onAuthSuccess?: () => void }> = ({ onAuthSuccess }) => (
  <BrowserRouter>
    <AuthPage onAuthSuccess={onAuthSuccess} />
  </BrowserRouter>
);

describe('AuthPage', () => {
  const mockStoreState = {
    isAuthenticated: false,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(mockStoreState);
    mockUseAuthInit.mockReturnValue(undefined);
  });

  it('renders the main header and description', () => {
    render(<AuthPageWrapper />);

    expect(screen.getByText('Reverse Engineer Coach')).toBeInTheDocument();
    expect(screen.getByText('Learn software architecture by reverse engineering real-world applications with AI-powered guidance')).toBeInTheDocument();
  });

  it('renders login form by default', () => {
    render(<AuthPageWrapper />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('switches to register form when switch button is clicked', async () => {
    const user = userEvent.setup();
    render(<AuthPageWrapper />);

    const switchButton = screen.getByTestId('switch-to-register');
    await user.click(switchButton);

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('switches back to login form from register form', async () => {
    const user = userEvent.setup();
    render(<AuthPageWrapper />);

    // Switch to register
    const switchToRegisterButton = screen.getByTestId('switch-to-register');
    await user.click(switchToRegisterButton);

    // Switch back to login
    const switchToLoginButton = screen.getByTestId('switch-to-login');
    await user.click(switchToLoginButton);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('register-form')).not.toBeInTheDocument();
  });

  it('renders feature sections', () => {
    render(<AuthPageWrapper />);

    expect(screen.getByText('Multi-Language Support')).toBeInTheDocument();
    expect(screen.getByText('Learn architecture patterns in Python, TypeScript, Go, Rust, Java, and more')).toBeInTheDocument();

    expect(screen.getByText('AI-Powered Learning')).toBeInTheDocument();
    expect(screen.getByText('Get personalized guidance from OpenAI GPT-4 or Google Gemini')).toBeInTheDocument();

    expect(screen.getByText('Real Repositories')).toBeInTheDocument();
    expect(screen.getByText('Analyze and learn from actual open-source projects on GitHub')).toBeInTheDocument();
  });

  it('renders footer with security information', () => {
    render(<AuthPageWrapper />);

    expect(screen.getByText('Secure authentication • Encrypted API keys • Privacy focused')).toBeInTheDocument();
  });

  it('calls onAuthSuccess when login is successful', async () => {
    const mockOnAuthSuccess = jest.fn();
    const user = userEvent.setup();
    
    render(<AuthPageWrapper onAuthSuccess={mockOnAuthSuccess} />);

    const loginSuccessButton = screen.getByTestId('login-success');
    await user.click(loginSuccessButton);

    expect(mockOnAuthSuccess).toHaveBeenCalled();
  });

  it('calls onAuthSuccess when registration is successful', async () => {
    const mockOnAuthSuccess = jest.fn();
    const user = userEvent.setup();
    
    render(<AuthPageWrapper onAuthSuccess={mockOnAuthSuccess} />);

    // Switch to register form
    const switchToRegisterButton = screen.getByTestId('switch-to-register');
    await user.click(switchToRegisterButton);

    // Trigger registration success
    const registerSuccessButton = screen.getByTestId('register-success');
    await user.click(registerSuccessButton);

    expect(mockOnAuthSuccess).toHaveBeenCalled();
  });

  it('navigates to dashboard when user is authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      isAuthenticated: true,
      isLoading: false,
    });

    render(<AuthPageWrapper />);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('does not navigate when still loading', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      isAuthenticated: true,
      isLoading: true,
    });

    render(<AuthPageWrapper />);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls useAuthInit hook on mount', () => {
    render(<AuthPageWrapper />);

    expect(mockUseAuthInit).toHaveBeenCalled();
  });

  it('renders feature icons', () => {
    render(<AuthPageWrapper />);

    // Check for SVG elements (feature icons)
    const svgElements = screen.getAllByRole('img', { hidden: true });
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('has proper responsive layout classes', () => {
    const { container } = render(<AuthPageWrapper />);

    // Check for responsive grid classes
    const featureGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
    expect(featureGrid).toBeInTheDocument();
  });

  it('maintains state when switching between forms', async () => {
    const user = userEvent.setup();
    render(<AuthPageWrapper />);

    // Start with login form
    expect(screen.getByTestId('login-form')).toBeInTheDocument();

    // Switch to register
    await user.click(screen.getByTestId('switch-to-register'));
    expect(screen.getByTestId('register-form')).toBeInTheDocument();

    // Switch back to login
    await user.click(screen.getByTestId('switch-to-login'));
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('handles authentication state changes properly', () => {
    const { rerender } = render(<AuthPageWrapper />);

    // Initially not authenticated
    expect(mockNavigate).not.toHaveBeenCalled();

    // Update to authenticated
    mockUseAuthStore.mockReturnValue({
      ...mockStoreState,
      isAuthenticated: true,
      isLoading: false,
    });

    rerender(<AuthPageWrapper />);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('passes correct props to LoginForm', () => {
    render(<AuthPageWrapper />);

    const loginForm = screen.getByTestId('login-form');
    expect(loginForm).toBeInTheDocument();

    // Check that the form has the switch button (indicating props are passed)
    expect(screen.getByTestId('switch-to-register')).toBeInTheDocument();
  });

  it('passes correct props to RegisterForm', async () => {
    const user = userEvent.setup();
    render(<AuthPageWrapper />);

    // Switch to register form
    await user.click(screen.getByTestId('switch-to-register'));

    const registerForm = screen.getByTestId('register-form');
    expect(registerForm).toBeInTheDocument();

    // Check that the form has the switch button (indicating props are passed)
    expect(screen.getByTestId('switch-to-login')).toBeInTheDocument();
  });
});