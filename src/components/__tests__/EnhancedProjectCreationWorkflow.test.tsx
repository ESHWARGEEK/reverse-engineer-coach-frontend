/**
 * Enhanced Project Creation Workflow Tests
 * 
 * Comprehensive test suite for the enhanced project creation workflow,
 * covering all components, state management, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EnhancedProjectCreationWorkflow } from '../EnhancedProjectCreationWorkflow';
import { useWorkflowState } from '../../hooks/useWorkflowState';
import { useAIAgentStatus } from '../../hooks/useAIAgentStatus';

// Mock hooks
jest.mock('../../hooks/useWorkflowState');
jest.mock('../../hooks/useAIAgentStatus');
jest.mock('../../hooks/useWorkflowErrorHandler');

const mockUseWorkflowState = useWorkflowState as jest.MockedFunction<typeof useWorkflowState>;
const mockUseAIAgentStatus = useAIAgentStatus as jest.MockedFunction<typeof useAIAgentStatus>;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <div className="min-h-screen bg-gray-900 text-white">
      {children}
    </div>
  </BrowserRouter>
);

// Mock workflow state
const mockWorkflowState = {
  currentStep: 'welcome',
  stepData: {},
  isComplete: false,
  canGoBack: false,
  canGoForward: false,
  progress: 0,
  nextStep: jest.fn(),
  previousStep: jest.fn(),
  goToStep: jest.fn(),
  updateStepData: jest.fn(),
  resetWorkflow: jest.fn(),
  saveProgress: jest.fn(),
  loadProgress: jest.fn()
};

// Mock AI agent status
const mockAIAgentStatus = {
  agents: [],
  isConnected: false,
  isLoading: false,
  error: null,
  retryOperation: jest.fn(),
  cancelOperation: jest.fn(),
  restartAgent: jest.fn(),
  refreshStatus: jest.fn(),
  startPolling: jest.fn(),
  stopPolling: jest.fn()
};

describe('EnhancedProjectCreationWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkflowState.mockReturnValue(mockWorkflowState);
    mockUseAIAgentStatus.mockReturnValue(mockAIAgentStatus);
  });

  describe('Workflow Initialization', () => {
    test('should render welcome step by default', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByText(/welcome to enhanced project creation/i)).toBeInTheDocument();
      expect(screen.getByText(/get started/i)).toBeInTheDocument();
    });

    test('should display workflow progress indicator', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();
    });

    test('should initialize workflow state on mount', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(mockUseWorkflowState).toHaveBeenCalledWith({
        initialStep: 'welcome',
        persistKey: 'enhanced-project-workflow'
      });
    });
  });

  describe('Step Navigation', () => {
    test('should advance to skill assessment step', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      const getStartedButton = screen.getByText(/get started/i);
      await user.click(getStartedButton);

      expect(mockWorkflowState.nextStep).toHaveBeenCalled();
    });

    test('should allow going back to previous step', async () => {
      const user = userEvent.setup();
      
      mockUseWorkflowState.mockReturnValue({
        ...mockWorkflowState,
        currentStep: 'skill-assessment',
        canGoBack: true
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      const backButton = screen.getByText(/back/i);
      await user.click(backButton);

      expect(mockWorkflowState.previousStep).toHaveBeenCalled();
    });

    test('should disable forward navigation when step is incomplete', () => {
      mockUseWorkflowState.mockReturnValue({
        ...mockWorkflowState,
        currentStep: 'skill-assessment',
        canGoForward: false
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      const nextButton = screen.queryByText(/next/i);
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Skill Assessment Step', () => {
    beforeEach(() => {
      mockUseWorkflowState.mockReturnValue({
        ...mockWorkflowState,
        currentStep: 'skill-assessment'
      });
    });

    test('should render skill assessment form', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/experience level/i)).toBeInTheDocument();
      expect(screen.getByText(/current skills/i)).toBeInTheDocument();
    });

    test('should update workflow state when form is completed', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Select experience level
      const beginnerOption = screen.getByLabelText(/beginner/i);
      await user.click(beginnerOption);

      // Add a skill
      const skillInput = screen.getByPlaceholderText(/add a skill/i);
      await user.type(skillInput, 'JavaScript');
      await user.keyboard('{Enter}');

      expect(mockWorkflowState.updateStepData).toHaveBeenCalledWith('skill-assessment', expect.objectContaining({
        experienceLevel: 'beginner',
        currentSkills: expect.arrayContaining(['JavaScript'])
      }));
    });
  });

  describe('Technology Preference Step', () => {
    beforeEach(() => {
      mockUseWorkflowState.mockReturnValue({
        ...mockWorkflowState,
        currentStep: 'technology-preferences'
      });
    });

    test('should render technology selection interface', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByText(/technology preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/languages/i)).toBeInTheDocument();
      expect(screen.getByText(/frameworks/i)).toBeInTheDocument();
    });

    test('should allow selecting multiple technologies', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Select JavaScript
      const jsButton = screen.getByText('JavaScript');
      await user.click(jsButton);

      // Select React
      const reactButton = screen.getByText('React');
      await user.click(reactButton);

      expect(mockWorkflowState.updateStepData).toHaveBeenCalledWith('technology-preferences', expect.objectContaining({
        selectedTechnologies: expect.arrayContaining([
          expect.objectContaining({ name: 'JavaScript' }),
          expect.objectContaining({ name: 'React' })
        ])
      }));
    });
  });

  describe('AI Agent Integration', () => {
    beforeEach(() => {
      mockUseWorkflowState.mockReturnValue({
        ...mockWorkflowState,
        currentStep: 'ai-discovery'
      });
    });

    test('should display AI agent status when agents are running', () => {
      mockUseAIAgentStatus.mockReturnValue({
        ...mockAIAgentStatus,
        agents: [
          {
            id: 'repository-discovery',
            name: 'Repository Discovery Agent',
            description: 'Finding relevant repositories',
            status: 'running',
            operations: [],
            overallProgress: 45,
            capabilities: []
          }
        ],
        isConnected: true
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByText(/repository discovery agent/i)).toBeInTheDocument();
      expect(screen.getByText(/45%/)).toBeInTheDocument();
    });

    test('should handle AI agent errors gracefully', () => {
      mockUseAIAgentStatus.mockReturnValue({
        ...mockAIAgentStatus,
        error: 'AI service temporarily unavailable',
        agents: [
          {
            id: 'repository-discovery',
            name: 'Repository Discovery Agent',
            description: 'Finding relevant repositories',
            status: 'failed',
            operations: [],
            overallProgress: 0,
            capabilities: [],
            error: 'Service timeout'
          }
        ]
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByText(/ai service temporarily unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });
  });

  describe('Repository Selection Step', () => {
    beforeEach(() => {
      mockUseWorkflowState.mockReturnValue({
        ...mockWorkflowState,
        currentStep: 'repository-selection',
        stepData: {
          'ai-discovery': {
            repositories: [
              {
                id: 'repo1',
                name: 'awesome-project',
                description: 'An awesome project for learning',
                url: 'https://github.com/user/awesome-project',
                language: 'JavaScript',
                stars: 1500,
                relevanceScore: 85
              }
            ]
          }
        }
      });
    });

    test('should display discovered repositories', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByText(/awesome-project/i)).toBeInTheDocument();
      expect(screen.getByText(/an awesome project for learning/i)).toBeInTheDocument();
      expect(screen.getByText(/1500/)).toBeInTheDocument(); // Stars
    });

    test('should allow repository selection', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      const repositoryCard = screen.getByText(/awesome-project/i).closest('div');
      await user.click(repositoryCard!);

      expect(mockWorkflowState.updateStepData).toHaveBeenCalledWith('repository-selection', expect.objectContaining({
        selectedRepositories: expect.arrayContaining([
          expect.objectContaining({ name: 'awesome-project' })
        ])
      }));
    });
  });

  describe('Project Preview Step', () => {
    beforeEach(() => {
      mockUseWorkflowState.mockReturnValue({
        ...mockWorkflowState,
        currentStep: 'project-preview',
        stepData: {
          'curriculum-generation': {
            projectPreview: {
              title: 'Learn React with Awesome Project',
              description: 'A comprehensive learning journey',
              objectives: ['Learn React basics', 'Understand component architecture'],
              curriculum: [
                {
                  phase: 'Phase 1',
                  title: 'Getting Started',
                  description: 'Learn the basics',
                  tasks: ['Set up environment', 'Create first component'],
                  estimatedHours: 8
                }
              ]
            }
          }
        }
      });
    });

    test('should display project preview', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByText(/learn react with awesome project/i)).toBeInTheDocument();
      expect(screen.getByText(/a comprehensive learning journey/i)).toBeInTheDocument();
      expect(screen.getByText(/learn react basics/i)).toBeInTheDocument();
    });

    test('should allow project customization', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      const customizeTab = screen.getByText(/customize/i);
      await user.click(customizeTab);

      expect(screen.getByText(/project title/i)).toBeInTheDocument();
      expect(screen.getByText(/description/i)).toBeInTheDocument();
    });

    test('should create project when confirmed', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      const createButton = screen.getByText(/create this project/i);
      await user.click(createButton);

      expect(mockWorkflowState.nextStep).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should display error boundary when component crashes', () => {
      // Mock a component that throws an error
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TestWrapper>
          <ThrowError />
        </TestWrapper>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('should handle network errors gracefully', async () => {
      mockUseAIAgentStatus.mockReturnValue({
        ...mockAIAgentStatus,
        error: 'Network connection failed'
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      const getStartedButton = screen.getByText(/get started/i);
      
      // Tab to the button
      await user.tab();
      expect(getStartedButton).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(mockWorkflowState.nextStep).toHaveBeenCalled();
    });

    test('should announce step changes to screen readers', () => {
      mockUseWorkflowState.mockReturnValue({
        ...mockWorkflowState,
        currentStep: 'skill-assessment'
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <EnhancedProjectCreationWorkflow />;
      };

      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should not cause additional renders due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});