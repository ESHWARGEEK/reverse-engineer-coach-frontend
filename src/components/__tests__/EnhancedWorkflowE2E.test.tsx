/**
 * End-to-End Tests for Enhanced Project Creation Workflow
 * 
 * These tests verify complete user journeys through the enhanced workflow,
 * covering all major scenarios and edge cases from start to finish.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EnhancedProjectCreationWorkflow } from '../EnhancedProjectCreationWorkflow';
import { useSimpleAppStore } from '../../store/simpleStore';

// Mock external dependencies
jest.mock('../../store/simpleStore');
jest.mock('../../hooks/useWorkflowState');
jest.mock('../../hooks/useAIAgentStatus');
jest.mock('../../services/enhancedWorkflowService');

const mockUseSimpleAppStore = useSimpleAppStore as jest.MockedFunction<typeof useSimpleAppStore>;

// Test wrapper with all necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <div className="min-h-screen bg-gray-900 text-white">
      {children}
    </div>
  </BrowserRouter>
);

// Mock store state
const mockStoreState = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User'
  },
  projects: [],
  currentProject: null,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  deleteProject: jest.fn(),
  setCurrentProject: jest.fn()
};

describe('Enhanced Workflow E2E Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSimpleAppStore.mockReturnValue(mockStoreState);
    
    // Mock successful API responses
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/workflow/start')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ workflowId: 'test-workflow-123' })
        });
      }
      if (url.includes('/api/repositories/discover')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            repositories: [
              {
                id: 1,
                name: 'awesome-react-app',
                fullName: 'user/awesome-react-app',
                description: 'A comprehensive React application for learning',
                url: 'https://github.com/user/awesome-react-app',
                language: 'JavaScript',
                stars: 2500,
                forks: 450,
                topics: ['react', 'javascript', 'tutorial'],
                relevanceScore: 92,
                selectionReasoning: 'Perfect match for React learning goals',
                learningPathSuggestions: [
                  'Start with component basics',
                  'Learn state management',
                  'Practice with hooks'
                ]
              }
            ]
          })
        });
      }
      if (url.includes('/api/curriculum/generate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'Master React Development',
            description: 'Comprehensive React learning journey',
            objectives: [
              'Understand React fundamentals',
              'Build interactive components',
              'Master state management'
            ],
            curriculum: [
              {
                phase: 'Foundation',
                title: 'React Basics',
                description: 'Learn the fundamentals of React',
                tasks: [
                  'Set up React development environment',
                  'Create your first React component',
                  'Understand JSX syntax'
                ],
                estimatedHours: 8
              },
              {
                phase: 'Development',
                title: 'Building Applications',
                description: 'Create interactive React applications',
                tasks: [
                  'Implement state management',
                  'Handle user interactions',
                  'Connect to APIs'
                ],
                estimatedHours: 12
              }
            ],
            prerequisites: ['Basic JavaScript knowledge', 'HTML/CSS fundamentals'],
            learningOutcomes: ['Build React applications', 'Deploy to production']
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Beginner User Journey', () => {
    test('should guide beginner through complete workflow successfully', async () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Step 1: Welcome screen
      expect(screen.getByText(/welcome to enhanced project creation/i)).toBeInTheDocument();
      
      const getStartedButton = screen.getByText(/get started/i);
      await user.click(getStartedButton);

      // Step 2: Skill Assessment
      await waitFor(() => {
        expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      });

      // Fill out skill assessment for beginner
      const beginnerRadio = screen.getByLabelText(/beginner/i);
      await user.click(beginnerRadio);

      // Add current skills
      const skillInput = screen.getByPlaceholderText(/add a skill/i);
      await user.type(skillInput, 'HTML');
      await user.keyboard('{Enter}');
      await user.type(skillInput, 'CSS');
      await user.keyboard('{Enter}');

      // Set learning goals
      const goalsTextarea = screen.getByPlaceholderText(/what do you want to learn/i);
      await user.type(goalsTextarea, 'I want to learn React and build modern web applications');

      // Select learning style
      const visualLearningRadio = screen.getByLabelText(/visual/i);
      await user.click(visualLearningRadio);

      // Select time commitment
      const timeSelect = screen.getByLabelText(/time commitment/i);
      await user.selectOptions(timeSelect, '5-10 hours/week');

      // Continue to next step
      const continueButton = screen.getByText(/continue/i);
      await user.click(continueButton);

      // Step 3: Technology Preferences
      await waitFor(() => {
        expect(screen.getByText(/technology preferences/i)).toBeInTheDocument();
      });

      // Select technologies
      const javascriptButton = screen.getByText('JavaScript');
      await user.click(javascriptButton);

      const reactButton = screen.getByText('React');
      await user.click(reactButton);

      // Continue to AI discovery
      const nextButton = screen.getByText(/next/i);
      await user.click(nextButton);

      // Step 4: AI Discovery
      await waitFor(() => {
        expect(screen.getByText(/ai.*discovering/i)).toBeInTheDocument();
      });

      // Wait for AI discovery to complete
      await waitFor(() => {
        expect(screen.getByText(/repository selection/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 5: Repository Selection
      expect(screen.getByText(/awesome-react-app/i)).toBeInTheDocument();
      expect(screen.getByText(/92%.*match/i)).toBeInTheDocument();

      // Select the repository
      const repositoryCard = screen.getByText(/awesome-react-app/i).closest('div');
      await user.click(repositoryCard!);

      // Continue to project preview
      const selectRepoButton = screen.getByText(/continue with selected/i);
      await user.click(selectRepoButton);

      // Step 6: Project Preview
      await waitFor(() => {
        expect(screen.getByText(/master react development/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/comprehensive react learning journey/i)).toBeInTheDocument();
      expect(screen.getByText(/understand react fundamentals/i)).toBeInTheDocument();

      // Review curriculum
      const curriculumTab = screen.getByText(/curriculum/i);
      await user.click(curriculumTab);

      expect(screen.getByText(/react basics/i)).toBeInTheDocument();
      expect(screen.getByText(/building applications/i)).toBeInTheDocument();

      // Create the project
      const createProjectButton = screen.getByText(/create this project/i);
      await user.click(createProjectButton);

      // Verify project creation
      await waitFor(() => {
        expect(mockStoreState.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Master React Development',
            description: 'Comprehensive React learning journey'
          })
        );
      });
    });
  });

  describe('Intermediate User Journey', () => {
    test('should handle intermediate user with existing skills', async () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Navigate to skill assessment
      await user.click(screen.getByText(/get started/i));

      await waitFor(() => {
        expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      });

      // Fill intermediate level assessment
      const intermediateRadio = screen.getByLabelText(/intermediate/i);
      await user.click(intermediateRadio);

      // Add multiple skills
      const skillInput = screen.getByPlaceholderText(/add a skill/i);
      const skills = ['JavaScript', 'HTML', 'CSS', 'Node.js', 'Express'];
      
      for (const skill of skills) {
        await user.type(skillInput, skill);
        await user.keyboard('{Enter}');
      }

      // Set advanced learning goals
      const goalsTextarea = screen.getByPlaceholderText(/what do you want to learn/i);
      await user.type(goalsTextarea, 'Advanced React patterns, state management, and testing');

      // Continue through workflow
      await user.click(screen.getByText(/continue/i));

      // Technology selection - select more advanced technologies
      await waitFor(() => {
        expect(screen.getByText(/technology preferences/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText('React'));
      await user.click(screen.getByText('TypeScript'));
      await user.click(screen.getByText('Redux'));

      await user.click(screen.getByText(/next/i));

      // Verify AI discovery considers intermediate level
      await waitFor(() => {
        expect(screen.getByText(/ai.*discovering/i)).toBeInTheDocument();
      });

      // Should find more advanced repositories
      await waitFor(() => {
        expect(screen.getByText(/repository selection/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Complete the workflow
      const repositoryCard = screen.getByText(/awesome-react-app/i).closest('div');
      await user.click(repositoryCard!);
      await user.click(screen.getByText(/continue with selected/i));

      await waitFor(() => {
        expect(screen.getByText(/master react development/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/create this project/i));

      expect(mockStoreState.createProject).toHaveBeenCalled();
    });
  });

  describe('Advanced User Journey', () => {
    test('should provide advanced options for expert users', async () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Navigate through to skill assessment
      await user.click(screen.getByText(/get started/i));

      await waitFor(() => {
        expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      });

      // Select advanced level
      const advancedRadio = screen.getByLabelText(/advanced/i);
      await user.click(advancedRadio);

      // Add extensive skill set
      const skillInput = screen.getByPlaceholderText(/add a skill/i);
      const advancedSkills = [
        'React', 'TypeScript', 'Node.js', 'GraphQL', 
        'Docker', 'Kubernetes', 'AWS', 'Testing'
      ];
      
      for (const skill of advancedSkills) {
        await user.type(skillInput, skill);
        await user.keyboard('{Enter}');
      }

      // Set expert-level goals
      const goalsTextarea = screen.getByPlaceholderText(/what do you want to learn/i);
      await user.type(goalsTextarea, 'Microservices architecture, advanced React patterns, performance optimization');

      await user.click(screen.getByText(/continue/i));

      // Select advanced technology stack
      await waitFor(() => {
        expect(screen.getByText(/technology preferences/i)).toBeInTheDocument();
      });

      const advancedTechs = ['React', 'TypeScript', 'GraphQL', 'Docker'];
      for (const tech of advancedTechs) {
        await user.click(screen.getByText(tech));
      }

      await user.click(screen.getByText(/next/i));

      // Complete workflow
      await waitFor(() => {
        expect(screen.getByText(/repository selection/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      const repositoryCard = screen.getByText(/awesome-react-app/i).closest('div');
      await user.click(repositoryCard!);
      await user.click(screen.getByText(/continue with selected/i));

      await waitFor(() => {
        expect(screen.getByText(/master react development/i)).toBeInTheDocument();
      });

      // Customize the project
      const customizeTab = screen.getByText(/customize/i);
      await user.click(customizeTab);

      // Modify project title
      const titleInput = screen.getByDisplayValue(/master react development/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Advanced React Architecture Patterns');

      await user.click(screen.getByText(/create this project/i));

      expect(mockStoreState.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Advanced React Architecture Patterns'
        })
      );
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('should handle AI service failures gracefully', async () => {
      // Mock AI service failure
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/api/repositories/discover')) {
          return Promise.reject(new Error('AI service unavailable'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Complete skill assessment
      await user.click(screen.getByText(/get started/i));
      
      await waitFor(() => {
        expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/beginner/i));
      await user.click(screen.getByText(/continue/i));

      // Complete technology selection
      await waitFor(() => {
        expect(screen.getByText(/technology preferences/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText('React'));
      await user.click(screen.getByText(/next/i));

      // Should show error and fallback options
      await waitFor(() => {
        expect(screen.getByText(/ai service.*unavailable/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/manual repository entry/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();

      // Use manual fallback
      await user.click(screen.getByText(/manual repository entry/i));

      await waitFor(() => {
        expect(screen.getByText(/enter repository url/i)).toBeInTheDocument();
      });

      // Enter repository manually
      const urlInput = screen.getByPlaceholderText(/https:\/\/github.com/i);
      await user.type(urlInput, 'https://github.com/facebook/react');

      await user.click(screen.getByText(/validate repository/i));

      // Should continue with manual entry
      await waitFor(() => {
        expect(screen.getByText(/repository validated/i)).toBeInTheDocument();
      });
    });

    test('should handle network connectivity issues', async () => {
      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      await user.click(screen.getByText(/get started/i));

      // Should show offline mode
      await waitFor(() => {
        expect(screen.getByText(/working offline/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/continue offline/i)).toBeInTheDocument();
      expect(screen.getByText(/try to reconnect/i)).toBeInTheDocument();

      // Continue in offline mode
      await user.click(screen.getByText(/continue offline/i));

      // Should provide basic workflow
      await waitFor(() => {
        expect(screen.getByText(/simple project creation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Usability', () => {
    test('should be fully keyboard navigable', async () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Tab through the interface
      await user.tab();
      expect(screen.getByText(/get started/i)).toHaveFocus();

      // Use Enter to activate
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      });

      // Navigate form with keyboard
      await user.tab();
      await user.keyboard('{ArrowDown}'); // Select beginner
      await user.keyboard(' '); // Activate radio button

      // Continue with keyboard
      await user.tab(); // Move to continue button
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/technology preferences/i)).toBeInTheDocument();
      });
    });

    test('should provide proper ARIA labels and announcements', () => {
      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Check for proper ARIA attributes
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check for step announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Check for form labels
      const getStartedButton = screen.getByText(/get started/i);
      expect(getStartedButton).toHaveAttribute('type', 'button');
    });

    test('should work on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Should render mobile-friendly layout
      expect(screen.getByText(/welcome to enhanced project creation/i)).toBeInTheDocument();
      
      // Progress indicator should be responsive
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();

      // Navigation should work on mobile
      await user.click(screen.getByText(/get started/i));

      await waitFor(() => {
        expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should load quickly and respond to user interactions', async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render within 100ms

      // Interactions should be responsive
      const interactionStart = performance.now();
      await user.click(screen.getByText(/get started/i));
      
      await waitFor(() => {
        expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      });

      const interactionTime = performance.now() - interactionStart;
      expect(interactionTime).toBeLessThan(500); // Should respond within 500ms
    });

    test('should handle large amounts of data efficiently', async () => {
      // Mock large dataset
      const largeRepositoryList = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `repository-${i}`,
        description: `Description for repository ${i}`,
        stars: Math.floor(Math.random() * 5000),
        language: 'JavaScript'
      }));

      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/api/repositories/discover')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ repositories: largeRepositoryList })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      });

      render(
        <TestWrapper>
          <EnhancedProjectCreationWorkflow />
        </TestWrapper>
      );

      // Navigate to repository selection
      await user.click(screen.getByText(/get started/i));
      
      await waitFor(() => {
        expect(screen.getByText(/skill assessment/i)).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText(/beginner/i));
      await user.click(screen.getByText(/continue/i));

      await waitFor(() => {
        expect(screen.getByText(/technology preferences/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText('React'));
      await user.click(screen.getByText(/next/i));

      // Should handle large list efficiently
      await waitFor(() => {
        expect(screen.getByText(/repository selection/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show pagination or virtualization
      const repositoryItems = screen.getAllByText(/repository-/);
      expect(repositoryItems.length).toBeLessThanOrEqual(20); // Should limit displayed items
    });
  });
});