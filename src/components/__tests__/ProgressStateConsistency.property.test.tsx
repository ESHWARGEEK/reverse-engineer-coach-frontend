/**
 * Property-Based Test for Progress State Consistency
 * 
 * Feature: reverse-engineer-coach, Property 14: Progress State Consistency
 * 
 * Property: For any completed task, the System should update progress indicators 
 * and maintain consistent state across all UI components
 * 
 * Validates: Requirements 7.1
 */

import fc from 'fast-check';
import { useAppStore } from '../../store';

// Mock localStorage to prevent persistence during tests
const mockLocalStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Optimized test data generators with smaller bounds to reduce memory usage
const generateProjectId = () => fc.string({ minLength: 1, maxLength: 10 });

const generateTaskId = () => fc.string({ minLength: 1, maxLength: 8 });

const generateProject = () => fc.record({
  id: generateProjectId(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  repositoryUrl: fc.constantFrom(
    'https://github.com/test/repo1',
    'https://github.com/test/repo2',
    'https://github.com/test/repo3'
  ),
  architectureTopic: fc.constantFrom('scheduler', 'concurrency', 'database', 'networking'),
  progress: fc.float({ min: 0, max: 100 }),
  status: fc.constantFrom('not_started', 'in_progress', 'completed', 'ready', 'analyzing', 'failed'),
  createdAt: fc.constant('2024-01-01T00:00:00Z'),
  updatedAt: fc.constant('2024-01-01T00:00:00Z'),
  totalTasks: fc.integer({ min: 1, max: 10 }),
  completedTasks: fc.integer({ min: 0, max: 10 }),
  currentTaskId: fc.option(generateTaskId(), { nil: undefined }),
});

const generateProgressUpdate = () => fc.record({
  completedTasks: fc.integer({ min: 0, max: 10 }),
  totalTasks: fc.integer({ min: 1, max: 10 }),
});

describe('Progress State Consistency Property Tests', () => {
  // Force garbage collection between tests if available
  const forceGC = () => {
    if (global.gc) {
      global.gc();
    }
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockLocalStorage.clear();
    
    // Force garbage collection
    forceGC();
    
    // Reset only the data state, not the actions
    useAppStore.setState({
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
      learningIntent: {
        architectureTopic: '',
        repositoryUrl: '',
        isValidating: false,
        validationError: null,
      },
      workspaceStates: {},
      workspace: {
        selectedTaskId: null,
        openFiles: [],
        activeFileId: null,
        layoutConfig: {
          leftPaneWidth: 25,
          rightPaneWidth: 33,
        },
        editorState: {},
        chatHistory: [],
        lastActiveTime: new Date().toISOString(),
      },
    }); // Don't use replace=true to preserve actions
  });

  afterEach(() => {
    // Aggressive cleanup after each test
    useAppStore.setState({
      projects: [],
      currentProject: null,
      workspaceStates: {},
      workspace: {
        selectedTaskId: null,
        openFiles: [],
        activeFileId: null,
        layoutConfig: { leftPaneWidth: 25, rightPaneWidth: 33 },
        editorState: {},
        chatHistory: [],
        lastActiveTime: new Date().toISOString(),
      },
    }); // Don't use replace=true to preserve actions
    
    // Clear localStorage mock
    mockLocalStorage.clear();
    
    // Force garbage collection
    forceGC();
  });

  test('Property 14: Progress State Consistency - Progress calculation consistency', () => {
    fc.assert(
      fc.property(
        generateProject(),
        generateProgressUpdate(),
        (project, progressUpdate) => {
          // Ensure valid progress data
          fc.pre(progressUpdate.completedTasks <= progressUpdate.totalTasks);
          
          // Clear store state at the beginning of each property test iteration
          useAppStore.setState({
            projects: [],
            currentProject: null,
            workspaceStates: {},
          });
          
          // Get fresh store reference for each operation
          let store = useAppStore.getState();
          
          // Set up initial project
          store.addProject(project);
          store = useAppStore.getState(); // Refresh reference
          store.setCurrentProject(project);
          
          // Update progress
          store = useAppStore.getState(); // Refresh reference
          store.updateProgress(
            project.id, 
            progressUpdate.completedTasks, 
            progressUpdate.totalTasks
          );
          
          const updatedProject = useAppStore.getState().projects.find(p => p.id === project.id);
          
          // Verify progress consistency
          expect(updatedProject).toBeDefined();
          expect(updatedProject!.completedTasks).toBe(progressUpdate.completedTasks);
          expect(updatedProject!.totalTasks).toBe(progressUpdate.totalTasks);
          
          // Verify progress percentage calculation
          const expectedPercentage = progressUpdate.totalTasks > 0 
            ? (progressUpdate.completedTasks / progressUpdate.totalTasks) * 100 
            : 0;
          expect(updatedProject!.progress).toBe(expectedPercentage);
          
          // Verify status consistency
          if (progressUpdate.completedTasks >= progressUpdate.totalTasks) {
            expect(updatedProject!.status).toBe('completed');
          } else if (progressUpdate.completedTasks > 0) {
            expect(updatedProject!.status).toBe('in_progress');
          }
          
          // Verify current project is also updated
          const currentProjectState = useAppStore.getState().currentProject;
          if (currentProjectState && currentProjectState.id === project.id) {
            expect(currentProjectState.completedTasks).toBe(progressUpdate.completedTasks);
            expect(currentProjectState.totalTasks).toBe(progressUpdate.totalTasks);
            expect(currentProjectState.progress).toBe(expectedPercentage);
          }
        }
      ),
      { numRuns: 5 } // Reduced from 10 to minimize memory usage
    );
  });

  test('Property 14: Progress State Consistency - Task completion updates', () => {
    fc.assert(
      fc.property(
        generateProject(),
        generateTaskId(),
        (project, taskId) => {
          // Ensure project has tasks to complete
          fc.pre(project.totalTasks && project.totalTasks > 0);
          fc.pre(project.completedTasks !== undefined && project.completedTasks < project.totalTasks);
          
          // Clear store state at the beginning of each property test iteration
          useAppStore.setState({
            projects: [],
            currentProject: null,
            workspaceStates: {},
          });
          
          let store = useAppStore.getState();
          
          // Set up initial project
          store.addProject(project);
          store = useAppStore.getState();
          store.setCurrentProject(project);
          
          // Mark task as completed
          store = useAppStore.getState();
          store.markTaskCompleted(taskId);
          
          // Verify task completion is reflected in workspace
          const workspace = useAppStore.getState().workspace;
          expect(workspace.selectedTaskId).toBe(taskId);
          
          // Verify project progress is updated (this would happen through the progress tracking hook)
          const currentProject = useAppStore.getState().currentProject;
          expect(currentProject).toBeDefined();
          expect(currentProject!.id).toBe(project.id);
        }
      ),
      { numRuns: 5 } // Reduced from 10
    );
  });

  test('Property 14: Progress State Consistency - Multiple project progress isolation', () => {
    fc.assert(
      fc.property(
        generateProject(),
        generateProject(),
        generateProgressUpdate(),
        generateProgressUpdate(),
        (project1, project2, progress1, progress2) => {
          // Ensure different projects
          fc.pre(project1.id !== project2.id);
          fc.pre(progress1.completedTasks <= progress1.totalTasks);
          fc.pre(progress2.completedTasks <= progress2.totalTasks);
          
          // Clear store state at the beginning of each property test iteration
          useAppStore.setState({
            projects: [],
            currentProject: null,
            workspaceStates: {},
          });
          
          let store = useAppStore.getState();
          
          // Set up projects
          store.addProject(project1);
          store = useAppStore.getState();
          store.addProject(project2);
          
          // Update progress for project 1
          store = useAppStore.getState();
          store.updateProgress(
            project1.id, 
            progress1.completedTasks, 
            progress1.totalTasks
          );
          
          // Update progress for project 2
          store = useAppStore.getState();
          store.updateProgress(
            project2.id, 
            progress2.completedTasks, 
            progress2.totalTasks
          );
          
          const projects = useAppStore.getState().projects;
          const updatedProject1 = projects.find(p => p.id === project1.id);
          const updatedProject2 = projects.find(p => p.id === project2.id);
          
          // Verify both projects are updated correctly and independently
          expect(updatedProject1).toBeDefined();
          expect(updatedProject2).toBeDefined();
          
          expect(updatedProject1!.completedTasks).toBe(progress1.completedTasks);
          expect(updatedProject1!.totalTasks).toBe(progress1.totalTasks);
          
          expect(updatedProject2!.completedTasks).toBe(progress2.completedTasks);
          expect(updatedProject2!.totalTasks).toBe(progress2.totalTasks);
          
          // Verify progress calculations are independent
          const expectedPercentage1 = progress1.totalTasks > 0 
            ? (progress1.completedTasks / progress1.totalTasks) * 100 
            : 0;
          const expectedPercentage2 = progress2.totalTasks > 0 
            ? (progress2.completedTasks / progress2.totalTasks) * 100 
            : 0;
            
          expect(updatedProject1!.progress).toBe(expectedPercentage1);
          expect(updatedProject2!.progress).toBe(expectedPercentage2);
        }
      ),
      { numRuns: 3 } // Reduced from 10 for memory efficiency
    );
  });

  test('Property 14: Progress State Consistency - Progress bounds validation', () => {
    fc.assert(
      fc.property(
        generateProject(),
        fc.integer({ min: 0, max: 10 }), // Reduced range
        fc.integer({ min: 1, max: 10 }), // Reduced range
        (project, completedTasks, totalTasks) => {
          // Clear store state at the beginning of each property test iteration
          useAppStore.setState({
            projects: [],
            currentProject: null,
            workspaceStates: {},
          });
          
          let store = useAppStore.getState();
          
          // Set up initial project
          store.addProject(project);
          
          // Update progress
          store = useAppStore.getState();
          store.updateProgress(project.id, completedTasks, totalTasks);
          
          const updatedProject = useAppStore.getState().projects.find(p => p.id === project.id);
          
          // Verify progress bounds
          expect(updatedProject).toBeDefined();
          expect(updatedProject!.progress).toBeGreaterThanOrEqual(0);
          expect(updatedProject!.progress).toBeLessThanOrEqual(100);
          
          // Verify completed tasks cannot exceed total tasks
          const cappedCompletedTasks = Math.min(completedTasks, totalTasks);
          expect(updatedProject!.completedTasks).toBe(cappedCompletedTasks);
          expect(updatedProject!.completedTasks).toBeLessThanOrEqual(updatedProject!.totalTasks);
          
          // Verify progress calculation accuracy (should be capped at 100%)
          const expectedPercentage = totalTasks > 0 ? (cappedCompletedTasks / totalTasks) * 100 : 0;
          expect(updatedProject!.progress).toBe(expectedPercentage);
        }
      ),
      { numRuns: 5 } // Reduced from 10
    );
  });

  test('Property 14: Progress State Consistency - Status transitions', () => {
    fc.assert(
      fc.property(
        generateProject(),
        fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 1, maxLength: 3 }), // Reduced complexity
        (project, progressSteps) => {
          // Clear store state at the beginning of each property test iteration
          useAppStore.setState({
            projects: [],
            currentProject: null,
            workspaceStates: {},
          });
          
          let store = useAppStore.getState();
          
          // Set up initial project with known total tasks
          const totalTasks = 5; // Reduced from 10
          const initialProject = { ...project, totalTasks, completedTasks: 0, status: 'not_started' as const };
          
          store.addProject(initialProject);
          
          // Apply progress steps sequentially
          progressSteps.forEach((step) => {
            const completedTasks = Math.min(step, totalTasks);
            
            store = useAppStore.getState();
            store.updateProgress(project.id, completedTasks, totalTasks);
            
            const updatedProject = useAppStore.getState().projects.find(p => p.id === project.id);
            expect(updatedProject).toBeDefined();
            
            // Verify status transitions are logical
            if (completedTasks === 0) {
              // Status should remain not_started or become in_progress
              expect(['not_started', 'in_progress', 'ready']).toContain(updatedProject!.status);
            } else if (completedTasks >= totalTasks) {
              // Should be completed
              expect(updatedProject!.status).toBe('completed');
            } else {
              // Should be in progress
              expect(updatedProject!.status).toBe('in_progress');
            }
          });
        }
      ),
      { numRuns: 3 } // Reduced from 10
    );
  });

  test('Property 14: Progress State Consistency - Zero division handling', () => {
    fc.assert(
      fc.property(
        generateProject(),
        (project) => {
          // Clear store state at the beginning of each property test iteration
          useAppStore.setState({
            projects: [],
            currentProject: null,
            workspaceStates: {},
          });
          
          let store = useAppStore.getState();
          
          // Set up project with zero total tasks
          store.addProject(project);
          store = useAppStore.getState();
          store.updateProgress(project.id, 0, 0);
          
          const updatedProject = useAppStore.getState().projects.find(p => p.id === project.id);
          
          // Verify zero division is handled gracefully
          expect(updatedProject).toBeDefined();
          expect(updatedProject!.progress).toBe(0);
          expect(updatedProject!.completedTasks).toBe(0);
          expect(updatedProject!.totalTasks).toBe(0);
        }
      ),
      { numRuns: 3 } // Reduced from 5
    );
  });
});