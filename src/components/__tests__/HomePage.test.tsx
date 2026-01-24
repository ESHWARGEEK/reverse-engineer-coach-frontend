import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../HomePage';

// Mock the API module
jest.mock('../../utils/api', () => ({
  repositoryAPI: {
    validate: jest.fn(),
  },
  projectAPI: {
    create: jest.fn(),
  },
}));

// Create a mock store with all required functions
const mockStore = {
  learningIntent: {
    architectureTopic: '',
    repositoryUrl: '',
    isValidating: false,
    validationError: null,
  },
  setArchitectureTopic: jest.fn(),
  setRepositoryUrl: jest.fn(),
  setValidating: jest.fn(),
  setValidationError: jest.fn(),
  resetLearningIntent: jest.fn(),
  isLoading: false,
  setLoading: jest.fn(),
  addProject: jest.fn(),
};

// Mock the store
jest.mock('../../store', () => ({
  useAppStore: () => mockStore,
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderHomePage = () => {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store state
    mockStore.learningIntent = {
      architectureTopic: '',
      repositoryUrl: '',
      isValidating: false,
      validationError: null,
    };
    mockStore.isLoading = false;
  });

  describe('Form Rendering', () => {
    test('renders all required form fields', () => {
      renderHomePage();
      
      // Check for main heading
      expect(screen.getByText('Reverse Engineer Coach')).toBeInTheDocument();
      
      // Check for form fields
      expect(screen.getByLabelText(/architecture topic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target repository/i)).toBeInTheDocument();
      
      // Check for submit button
      expect(screen.getByRole('button', { name: /start learning journey/i })).toBeInTheDocument();
    });

    test('renders architecture topic options', () => {
      renderHomePage();
      
      const select = screen.getByLabelText(/architecture topic/i);
      expect(select).toBeInTheDocument();
      
      // Check for placeholder option
      expect(screen.getByText('Select a topic to master')).toBeInTheDocument();
    });

    test('renders repository URL input with correct attributes', () => {
      renderHomePage();
      
      const input = screen.getByLabelText(/target repository/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'url');
      expect(input).toHaveAttribute('placeholder', 'https://github.com/kubernetes/kubernetes');
    });

    test('renders workflow stepper', () => {
      renderHomePage();
      
      // Check for workflow steps
      expect(screen.getByText('Learning Intent')).toBeInTheDocument();
      expect(screen.getByText('Repository Analysis')).toBeInTheDocument();
      expect(screen.getByText('Curriculum Generation')).toBeInTheDocument();
      expect(screen.getByText('Interactive Learning')).toBeInTheDocument();
    });

    test('submit button is initially disabled', () => {
      renderHomePage();
      
      const submitButton = screen.getByRole('button', { name: /start learning journey/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Repository URL Validation', () => {
    test('shows validation error for invalid URL format', async () => {
      const user = userEvent.setup();
      renderHomePage();
      
      const input = screen.getByLabelText(/target repository/i);
      
      // Enter invalid URL
      await user.type(input, 'invalid-url');
      
      // Check that setValidationError was called with error message
      await waitFor(() => {
        expect(mockStore.setValidationError).toHaveBeenCalledWith(
          expect.stringContaining('Please enter a valid GitHub repository URL')
        );
      });
    });

    test('shows validation error for non-GitHub URL', async () => {
      const user = userEvent.setup();
      renderHomePage();
      
      const input = screen.getByLabelText(/target repository/i);
      
      // Enter non-GitHub URL
      await user.type(input, 'https://gitlab.com/owner/repo');
      
      // Check that setValidationError was called with error message
      await waitFor(() => {
        expect(mockStore.setValidationError).toHaveBeenCalledWith(
          expect.stringContaining('Please enter a valid GitHub repository URL')
        );
      });
    });

    test('accepts valid GitHub URL format', async () => {
      const user = userEvent.setup();
      renderHomePage();
      
      const input = screen.getByLabelText(/target repository/i);
      
      // Enter valid GitHub URL
      await user.type(input, 'https://github.com/kubernetes/kubernetes');
      
      // Should call setRepositoryUrl with the URL
      expect(mockStore.setRepositoryUrl).toHaveBeenCalledWith('https://github.com/kubernetes/kubernetes');
    });

    test('clears validation error when input is cleared', async () => {
      const user = userEvent.setup();
      renderHomePage();
      
      const input = screen.getByLabelText(/target repository/i);
      
      // Enter invalid URL to trigger error
      await user.type(input, 'invalid-url');
      
      // Clear the input
      await user.clear(input);
      
      // Should clear validation error
      expect(mockStore.setValidationError).toHaveBeenCalledWith(null);
    });
  });

  describe('Form Interaction', () => {
    test('calls store functions when form fields change', async () => {
      const user = userEvent.setup();
      renderHomePage();
      
      // Change architecture topic
      const topicSelect = screen.getByLabelText(/architecture topic/i);
      await user.selectOptions(topicSelect, 'scheduler');
      
      expect(mockStore.setArchitectureTopic).toHaveBeenCalledWith('scheduler');
      
      // Change repository URL
      const urlInput = screen.getByLabelText(/target repository/i);
      await user.type(urlInput, 'https://github.com/kubernetes/kubernetes');
      
      expect(mockStore.setRepositoryUrl).toHaveBeenCalledWith('https://github.com/kubernetes/kubernetes');
    });

    test('shows helper text for form fields', () => {
      renderHomePage();
      
      // Check for helper text
      expect(screen.getByText(/choose the architectural pattern you want to learn/i)).toBeInTheDocument();
      expect(screen.getByText(/enter a github repository url to analyze/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('form fields have proper labels', () => {
      renderHomePage();
      
      // Check that form fields are properly labeled
      expect(screen.getByLabelText(/architecture topic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target repository/i)).toBeInTheDocument();
    });

    test('displays validation error when present in store', () => {
      // Set validation error in mock store
      mockStore.learningIntent.validationError = 'Repository not found';
      
      renderHomePage();
      
      expect(screen.getByText('Repository not found')).toBeInTheDocument();
    });

    test('displays loading state when validating', () => {
      // Set validating state in mock store
      mockStore.learningIntent.isValidating = true;
      
      renderHomePage();
      
      expect(screen.getByText(/validating repository/i)).toBeInTheDocument();
    });

    test('submit button shows loading state when form is loading', () => {
      // Set loading state in mock store
      mockStore.isLoading = true;
      
      renderHomePage();
      
      const submitButton = screen.getByRole('button', { name: /creating learning project/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});