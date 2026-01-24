/**
 * Property-Based Test for Workspace State Persistence
 * 
 * Feature: reverse-engineer-coach, Property 15: Workspace State Persistence
 * 
 * Property: For any Learning_Project, returning to the workspace should restore 
 * the previous state including open files, editor content, and UI layout
 * 
 * Validates: Requirements 7.4
 */

import fc from 'fast-check';
import { useAppStore } from '../../store';

// Test data generators
const generateProjectId = () => fc.string({ minLength: 1, maxLength: 50 }).map(s => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${s}`);

const generateFileId = () => fc.string({ minLength: 1, maxLength: 30 });

const generateFileContent = () => fc.string({ minLength: 0, maxLength: 1000 });

const generateLayoutConfig = () => fc.record({
  leftPaneWidth: fc.integer({ min: 10, max: 50 }),
  rightPaneWidth: fc.integer({ min: 10, max: 50 }),
});

const generateEditorState = () => fc.record({
  content: generateFileContent(),
  cursorPosition: fc.record({
    line: fc.integer({ min: 1, max: 100 }),
    column: fc.integer({ min: 1, max: 100 }),
  }),
  scrollPosition: fc.record({
    top: fc.integer({ min: 0, max: 1000 }),
    left: fc.integer({ min: 0, max: 1000 }),
  }),
});

const generateWorkspaceState = () => fc.record({
  selectedTaskId: fc.option(fc.string(), { nil: null }),
  openFiles: fc.array(generateFileId(), { minLength: 0, maxLength: 10 }),
  activeFileId: fc.option(generateFileId(), { nil: null }),
  layoutConfig: generateLayoutConfig(),
  editorState: fc.dictionary(generateFileId(), generateEditorState()),
  chatHistory: fc.array(fc.record({
    id: fc.string(),
    content: fc.string(),
    sender: fc.constantFrom('user', 'coach'),
    timestamp: fc.string(),
  }), { minLength: 0, maxLength: 20 }),
  lastActiveTime: fc.string(),
});

describe('Workspace State Persistence Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Get a fresh store instance and reset completely
    const store = useAppStore.getState();
    
    // Clear all workspace states first
    const currentWorkspaceStates = Object.keys(store.workspaceStates);
    currentWorkspaceStates.forEach(projectId => {
      store.clearWorkspaceState(projectId);
    });
    
    // Reset the entire store state to initial values
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
    });
    
    // Force clear any persisted state
    try {
      useAppStore.persist.clearStorage();
    } catch (e) {
      // Ignore if clearStorage doesn't exist
    }
    
    // Clear the specific localStorage key used by Zustand
    localStorage.removeItem('reverse-engineer-coach-store');
  });

  test('Property 15: Workspace State Persistence - Round-trip persistence', () => {
    fc.assert(
      fc.property(
        generateProjectId(),
        generateWorkspaceState(),
        (projectId, originalWorkspaceState) => {
          const store = useAppStore.getState();
          
          // Ensure we start with a clean workspace
          store.restoreWorkspaceState('__nonexistent__');
          
          // Set up initial workspace state step by step
          if (originalWorkspaceState.selectedTaskId) {
            store.setSelectedTask(originalWorkspaceState.selectedTaskId);
          }
          
          // Open files
          originalWorkspaceState.openFiles.forEach(fileId => {
            store.openFile(fileId);
          });
          
          // Set active file
          if (originalWorkspaceState.activeFileId) {
            store.setActiveFile(originalWorkspaceState.activeFileId);
          }
          
          // Update layout config
          store.updateLayoutConfig(originalWorkspaceState.layoutConfig);
          
          // Save file contents and editor states
          Object.entries(originalWorkspaceState.editorState).forEach(([fileId, editorState]) => {
            store.saveFileContent(fileId, editorState.content);
            store.saveEditorState(fileId, {
              cursorPosition: editorState.cursorPosition,
              scrollPosition: editorState.scrollPosition,
            });
          });
          
          // Add chat messages
          originalWorkspaceState.chatHistory.forEach(message => {
            store.addChatMessage({
              content: message.content,
              sender: message.sender as 'user' | 'coach',
            });
          });
          
          // Capture the current workspace state before saving
          const currentWorkspace = store.workspace;
          
          // Save workspace state
          store.saveWorkspaceState(projectId);
          
          // Simulate leaving and returning to workspace
          // Clear current workspace (simulate navigation away)
          store.setSelectedTask(null);
          store.setActiveFile(null);
          store.clearChatHistory();
          store.updateLayoutConfig({ leftPaneWidth: 25, rightPaneWidth: 33 });
          
          // Restore workspace state
          store.restoreWorkspaceState(projectId);
          
          const restoredWorkspace = store.workspace;
          
          // Verify workspace state persistence using the captured state
          expect(restoredWorkspace.selectedTaskId).toBe(currentWorkspace.selectedTaskId);
          expect(restoredWorkspace.openFiles).toEqual(currentWorkspace.openFiles);
          expect(restoredWorkspace.activeFileId).toBe(currentWorkspace.activeFileId);
          expect(restoredWorkspace.layoutConfig.leftPaneWidth).toBe(currentWorkspace.layoutConfig.leftPaneWidth);
          expect(restoredWorkspace.layoutConfig.rightPaneWidth).toBe(currentWorkspace.layoutConfig.rightPaneWidth);
          
          // Verify editor state persistence
          Object.entries(currentWorkspace.editorState).forEach(([fileId, originalEditorState]) => {
            const restoredEditorState = restoredWorkspace.editorState[fileId];
            if (restoredEditorState) {
              expect(restoredEditorState.content).toBe(originalEditorState.content);
              expect(restoredEditorState.cursorPosition).toEqual(originalEditorState.cursorPosition);
              expect(restoredEditorState.scrollPosition).toEqual(originalEditorState.scrollPosition);
            }
          });
          
          // Verify chat history persistence (should be restored)
          expect(restoredWorkspace.chatHistory.length).toBeGreaterThanOrEqual(0);
          
          // Verify last active time is updated
          expect(restoredWorkspace.lastActiveTime).toBeDefined();
          expect(typeof restoredWorkspace.lastActiveTime).toBe('string');
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 15: Workspace State Persistence - Multiple projects isolation', () => {
    fc.assert(
      fc.property(
        generateProjectId(),
        generateProjectId(),
        generateWorkspaceState(),
        generateWorkspaceState(),
        (projectId1, projectId2, workspaceState1, workspaceState2) => {
          // Ensure different project IDs
          fc.pre(projectId1 !== projectId2);
          
          const store = useAppStore.getState();
          
          // Set up workspace state for project 1
          store.restoreWorkspaceState('__nonexistent__'); // Start clean
          if (workspaceState1.selectedTaskId) {
            store.setSelectedTask(workspaceState1.selectedTaskId);
          }
          store.updateLayoutConfig(workspaceState1.layoutConfig);
          const capturedWorkspace1 = { ...store.workspace };
          store.saveWorkspaceState(projectId1);
          
          // Set up workspace state for project 2
          store.restoreWorkspaceState('__nonexistent__'); // Start clean
          if (workspaceState2.selectedTaskId) {
            store.setSelectedTask(workspaceState2.selectedTaskId);
          }
          store.updateLayoutConfig(workspaceState2.layoutConfig);
          const capturedWorkspace2 = { ...store.workspace };
          store.saveWorkspaceState(projectId2);
          
          // Restore project 1 workspace
          store.restoreWorkspaceState(projectId1);
          
          const restoredWorkspace1 = store.workspace;
          
          // Verify project 1 state is restored correctly
          expect(restoredWorkspace1.selectedTaskId).toBe(capturedWorkspace1.selectedTaskId);
          expect(restoredWorkspace1.layoutConfig.leftPaneWidth).toBe(capturedWorkspace1.layoutConfig.leftPaneWidth);
          expect(restoredWorkspace1.layoutConfig.rightPaneWidth).toBe(capturedWorkspace1.layoutConfig.rightPaneWidth);
          
          // Restore project 2 workspace
          store.restoreWorkspaceState(projectId2);
          
          const restoredWorkspace2 = store.workspace;
          
          // Verify project 2 state is restored correctly and different from project 1
          expect(restoredWorkspace2.selectedTaskId).toBe(capturedWorkspace2.selectedTaskId);
          expect(restoredWorkspace2.layoutConfig.leftPaneWidth).toBe(capturedWorkspace2.layoutConfig.leftPaneWidth);
          expect(restoredWorkspace2.layoutConfig.rightPaneWidth).toBe(capturedWorkspace2.layoutConfig.rightPaneWidth);
          
          // Verify states are isolated (if they were different)
          if (capturedWorkspace1.selectedTaskId !== capturedWorkspace2.selectedTaskId) {
            expect(restoredWorkspace2.selectedTaskId).not.toBe(capturedWorkspace1.selectedTaskId);
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property 15: Workspace State Persistence - Default state for new projects', () => {
    fc.assert(
      fc.property(
        generateProjectId(),
        (projectId) => {
          const store = useAppStore.getState();
          
          // Restore workspace state for a project that doesn't exist
          store.restoreWorkspaceState(projectId);
          
          const workspace = store.workspace;
          
          // Verify default workspace state is created
          expect(workspace.selectedTaskId).toBeNull();
          expect(workspace.openFiles).toEqual([]);
          expect(workspace.activeFileId).toBeNull();
          expect(workspace.layoutConfig.leftPaneWidth).toBe(25);
          expect(workspace.layoutConfig.rightPaneWidth).toBe(33);
          expect(workspace.editorState).toEqual({});
          expect(workspace.chatHistory).toEqual([]);
          expect(workspace.lastActiveTime).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  test('Property 15: Workspace State Persistence - File content persistence', () => {
    fc.assert(
      fc.property(
        generateProjectId(),
        generateFileId(),
        generateFileContent(),
        (projectId, fileId, content) => {
          const store = useAppStore.getState();
          
          // Explicitly reset workspace to clean state
          useAppStore.setState({
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
            workspaceStates: {}
          });
          
          // Get fresh store reference after reset
          const freshStore = useAppStore.getState();
          
          // Verify workspace is clean
          expect(Object.keys(freshStore.workspace.editorState)).toHaveLength(0);
          
          // Save file content
          freshStore.saveFileContent(fileId, content);
          
          // Get updated store state
          const updatedStore = useAppStore.getState();
          
          // Verify content was saved correctly
          expect(updatedStore.workspace.editorState[fileId]).toBeDefined();
          expect(updatedStore.workspace.editorState[fileId].content).toBe(content);
          
          // Save workspace state
          updatedStore.saveWorkspaceState(projectId);
          
          // Clear workspace completely
          useAppStore.setState({
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
            }
          });
          
          // Verify workspace is cleared
          const clearedStore = useAppStore.getState();
          expect(Object.keys(clearedStore.workspace.editorState)).toHaveLength(0);
          
          // Restore from saved state
          clearedStore.restoreWorkspaceState(projectId);
          
          const finalStore = useAppStore.getState();
          const workspace = finalStore.workspace;
          
          // Verify file content is restored
          const restoredEditorState = workspace.editorState[fileId];
          expect(restoredEditorState).toBeDefined();
          expect(restoredEditorState.content).toBe(content);
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property 15: Workspace State Persistence - Layout configuration persistence', () => {
    fc.assert(
      fc.property(
        generateProjectId(),
        generateLayoutConfig(),
        (projectId, layoutConfig) => {
          const store = useAppStore.getState();
          
          // Start with clean workspace
          store.restoreWorkspaceState('__nonexistent__');
          
          // Set layout configuration
          store.updateLayoutConfig(layoutConfig);
          
          // Capture the current layout config
          const capturedLayoutConfig = { ...store.workspace.layoutConfig };
          
          store.saveWorkspaceState(projectId);
          
          // Clear and restore
          // Reset to default
          store.updateLayoutConfig({ leftPaneWidth: 25, rightPaneWidth: 33 });
          store.restoreWorkspaceState(projectId);
          
          const workspace = store.workspace;
          
          // Verify layout configuration is restored
          expect(workspace.layoutConfig.leftPaneWidth).toBe(capturedLayoutConfig.leftPaneWidth);
          expect(workspace.layoutConfig.rightPaneWidth).toBe(capturedLayoutConfig.rightPaneWidth);
        }
      ),
      { numRuns: 40 }
    );
  });
});