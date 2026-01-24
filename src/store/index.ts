import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types for our application state
export interface LearningProject {
  id: string;
  user_id: string;
  title: string;
  target_repository: string;
  architecture_topic: string;
  concept_description?: string;
  discovery_metadata?: any;
  status: 'created' | 'not_started' | 'in_progress' | 'completed' | 'ready' | 'analyzing' | 'failed';
  created_at: string;
  updated_at: string;
  implementation_language?: string;
  preferred_frameworks?: string[];
  language_specific_config?: any;
  total_tasks?: number;
  completed_tasks?: number;
  current_task_id?: string;
  completion_percentage?: number;
  // Legacy fields for backward compatibility
  name?: string;
  repositoryUrl?: string;
  architectureTopic?: string;
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
  totalTasks?: number;
  completedTasks?: number;
  currentTaskId?: string;
}

export interface WorkspaceState {
  selectedTaskId: string | null;
  openFiles: string[];
  activeFileId: string | null;
  layoutConfig: {
    leftPaneWidth: number;
    rightPaneWidth: number;
  };
  editorState: {
    [fileId: string]: {
      content: string;
      cursorPosition: { line: number; column: number };
      scrollPosition: { top: number; left: number };
    };
  };
  chatHistory: Array<{
    id: string;
    content: string;
    sender: 'user' | 'coach';
    timestamp: string;
  }>;
  lastActiveTime: string;
}

export interface ProjectWorkspaceState {
  [projectId: string]: WorkspaceState;
}

export interface AppState {
  // Learning projects
  projects: LearningProject[];
  currentProject: LearningProject | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Form state for learning intent
  learningIntent: {
    architectureTopic: string;
    repositoryUrl: string;
    isValidating: boolean;
    validationError: string | null;
  };
  
  // Workspace state per project
  workspaceStates: ProjectWorkspaceState;
  
  // Current workspace (derived from current project)
  workspace: WorkspaceState;
}

export interface AppActions {
  // Project actions
  setProjects: (projects: LearningProject[]) => void;
  addProject: (project: LearningProject) => void;
  updateProject: (id: string, updates: Partial<LearningProject>) => void;
  setCurrentProject: (project: LearningProject | null) => void;
  deleteProject: (id: string) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Learning intent actions
  setArchitectureTopic: (topic: string) => void;
  setRepositoryUrl: (url: string) => void;
  setValidating: (validating: boolean) => void;
  setValidationError: (error: string | null) => void;
  resetLearningIntent: () => void;
  
  // Workspace actions
  setSelectedTask: (taskId: string | null) => void;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (fileId: string | null) => void;
  updateLayoutConfig: (config: Partial<WorkspaceState['layoutConfig']>) => void;
  
  // Enhanced workspace state management
  saveFileContent: (fileId: string, content: string) => void;
  saveEditorState: (fileId: string, state: { cursorPosition: { line: number; column: number }; scrollPosition: { top: number; left: number } }) => void;
  restoreWorkspaceState: (projectId: string) => void;
  saveWorkspaceState: (projectId: string) => void;
  clearWorkspaceState: (projectId: string) => void;
  
  // Chat history management
  addChatMessage: (message: { content: string; sender: 'user' | 'coach' }) => void;
  clearChatHistory: () => void;
  
  // Progress tracking
  updateProgress: (projectId: string, completedTasks: number, totalTasks: number) => void;
  markTaskCompleted: (taskId: string) => void;
}

type Store = AppState & AppActions;

const createDefaultWorkspaceState = (): WorkspaceState => ({
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
});

const initialState: AppState = {
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
  workspace: createDefaultWorkspaceState(),
};

export const useAppStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Project actions
        setProjects: (projects) => set({ projects }),
        addProject: (project) => set((state) => ({ 
          projects: [...state.projects, project] 
        })),
        updateProject: (id, updates) => set((state) => ({
          projects: state.projects.map(p => 
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
          currentProject: state.currentProject?.id === id 
            ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
            : state.currentProject
        })),
        setCurrentProject: (project) => {
          set({ currentProject: project });
          // Restore workspace state for this project
          if (project) {
            get().restoreWorkspaceState(project.id);
          }
        },
        deleteProject: (id) => set((state) => {
          const updatedProjects = state.projects.filter(p => p.id !== id);
          const updatedWorkspaceStates = { ...state.workspaceStates };
          delete updatedWorkspaceStates[id];
          
          return {
            projects: updatedProjects,
            workspaceStates: updatedWorkspaceStates,
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
          };
        }),
        
        // UI actions
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        
        // Learning intent actions
        setArchitectureTopic: (architectureTopic) => set((state) => ({
          learningIntent: { ...state.learningIntent, architectureTopic }
        })),
        setRepositoryUrl: (repositoryUrl) => set((state) => ({
          learningIntent: { ...state.learningIntent, repositoryUrl }
        })),
        setValidating: (isValidating) => set((state) => ({
          learningIntent: { ...state.learningIntent, isValidating }
        })),
        setValidationError: (validationError) => set((state) => ({
          learningIntent: { ...state.learningIntent, validationError }
        })),
        resetLearningIntent: () => set((state) => ({
          learningIntent: {
            architectureTopic: '',
            repositoryUrl: '',
            isValidating: false,
            validationError: null,
          }
        })),
        
        // Workspace actions
        setSelectedTask: (selectedTaskId) => set((state) => {
          const newWorkspace = { 
            ...state.workspace, 
            selectedTaskId,
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        openFile: (fileId) => set((state) => {
          const openFiles = state.workspace.openFiles.includes(fileId) 
            ? state.workspace.openFiles 
            : [...state.workspace.openFiles, fileId];
          const newWorkspace = { 
            ...state.workspace, 
            openFiles,
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        closeFile: (fileId) => set((state) => {
          const openFiles = state.workspace.openFiles.filter(id => id !== fileId);
          const activeFileId = state.workspace.activeFileId === fileId ? null : state.workspace.activeFileId;
          const newWorkspace = { 
            ...state.workspace, 
            openFiles, 
            activeFileId,
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        setActiveFile: (activeFileId) => set((state) => {
          const newWorkspace = { 
            ...state.workspace, 
            activeFileId,
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        updateLayoutConfig: (config) => set((state) => {
          const newWorkspace = {
            ...state.workspace,
            layoutConfig: { ...state.workspace.layoutConfig, ...config },
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        
        // Enhanced workspace state management
        saveFileContent: (fileId, content) => set((state) => {
          const editorState = {
            ...state.workspace.editorState,
            [fileId]: {
              content,
              cursorPosition: state.workspace.editorState[fileId]?.cursorPosition || { line: 1, column: 1 },
              scrollPosition: state.workspace.editorState[fileId]?.scrollPosition || { top: 0, left: 0 },
            }
          };
          const newWorkspace = { 
            ...state.workspace, 
            editorState,
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        
        saveEditorState: (fileId, editorStateUpdate) => set((state) => {
          const editorState = {
            ...state.workspace.editorState,
            [fileId]: {
              content: state.workspace.editorState[fileId]?.content || '',
              cursorPosition: editorStateUpdate.cursorPosition || { line: 1, column: 1 },
              scrollPosition: editorStateUpdate.scrollPosition || { top: 0, left: 0 },
            }
          };
          const newWorkspace = { 
            ...state.workspace, 
            editorState,
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        
        restoreWorkspaceState: (projectId) => set((state) => {
          const savedState = state.workspaceStates[projectId];
          if (savedState && typeof savedState === 'object' && savedState !== null) {
            // Validate that savedState has the expected structure
            const isValidWorkspaceState = (
              savedState.hasOwnProperty('selectedTaskId') &&
              savedState.hasOwnProperty('openFiles') &&
              Array.isArray(savedState.openFiles) &&
              savedState.hasOwnProperty('layoutConfig') &&
              typeof savedState.layoutConfig === 'object'
            );
            
            if (isValidWorkspaceState) {
              // Create a deep copy of the saved state to avoid reference issues
              const restoredWorkspace: WorkspaceState = {
                selectedTaskId: savedState.selectedTaskId,
                openFiles: [...savedState.openFiles],
                activeFileId: savedState.activeFileId,
                layoutConfig: {
                  leftPaneWidth: savedState.layoutConfig.leftPaneWidth,
                  rightPaneWidth: savedState.layoutConfig.rightPaneWidth,
                },
                editorState: Object.entries(savedState.editorState || {}).reduce((acc, [fileId, editorState]) => {
                  acc[fileId] = {
                    content: editorState.content || '',
                    cursorPosition: { 
                      line: editorState.cursorPosition?.line || 1, 
                      column: editorState.cursorPosition?.column || 1 
                    },
                    scrollPosition: { 
                      top: editorState.scrollPosition?.top || 0, 
                      left: editorState.scrollPosition?.left || 0 
                    },
                  };
                  return acc;
                }, {} as WorkspaceState['editorState']),
                chatHistory: (savedState.chatHistory || []).map(msg => ({ ...msg })),
                lastActiveTime: new Date().toISOString(),
              };
              return { workspace: restoredWorkspace };
            }
          }
          // Return a fresh default workspace state for new projects or invalid saved states
          return { workspace: createDefaultWorkspaceState() };
        }),
        
        saveWorkspaceState: (projectId) => set((state) => {
          // Create a deep copy of the current workspace state to save
          const workspaceToSave: WorkspaceState = {
            selectedTaskId: state.workspace.selectedTaskId,
            openFiles: [...state.workspace.openFiles],
            activeFileId: state.workspace.activeFileId,
            layoutConfig: {
              leftPaneWidth: state.workspace.layoutConfig.leftPaneWidth,
              rightPaneWidth: state.workspace.layoutConfig.rightPaneWidth,
            },
            editorState: Object.entries(state.workspace.editorState || {}).reduce((acc, [fileId, editorState]) => {
              acc[fileId] = {
                content: editorState.content || '',
                cursorPosition: { 
                  line: editorState.cursorPosition?.line || 1, 
                  column: editorState.cursorPosition?.column || 1 
                },
                scrollPosition: { 
                  top: editorState.scrollPosition?.top || 0, 
                  left: editorState.scrollPosition?.left || 0 
                },
              };
              return acc;
            }, {} as WorkspaceState['editorState']),
            chatHistory: (state.workspace.chatHistory || []).map(msg => ({ ...msg })),
            lastActiveTime: new Date().toISOString(),
          };
          
          return {
            workspaceStates: {
              ...state.workspaceStates,
              [projectId]: workspaceToSave
            }
          };
        }),
        
        clearWorkspaceState: (projectId) => set((state) => {
          const updatedWorkspaceStates = { ...state.workspaceStates };
          delete updatedWorkspaceStates[projectId];
          return { workspaceStates: updatedWorkspaceStates };
        }),
        
        // Chat history management
        addChatMessage: (message) => set((state) => {
          const newMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...message,
            timestamp: new Date().toISOString(),
          };
          const chatHistory = [...state.workspace.chatHistory, newMessage];
          const newWorkspace = { 
            ...state.workspace, 
            chatHistory,
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        
        clearChatHistory: () => set((state) => {
          const newWorkspace = { 
            ...state.workspace, 
            chatHistory: [],
            lastActiveTime: new Date().toISOString()
          };
          return { workspace: newWorkspace };
        }),
        
        // Progress tracking
        updateProgress: (projectId, completedTasks, totalTasks) => {
          // Ensure completedTasks doesn't exceed totalTasks
          const validCompletedTasks = Math.min(completedTasks, totalTasks);
          const completionPercentage = totalTasks > 0 ? (validCompletedTasks / totalTasks) * 100 : 0;
          get().updateProject(projectId, {
            completedTasks: validCompletedTasks,
            totalTasks,
            progress: completionPercentage,
            status: completionPercentage === 100 ? 'completed' : 'in_progress'
          });
        },
        
        markTaskCompleted: (taskId) => set((state) => {
          // This would typically update the task completion status
          // For now, we'll just update the selected task
          const newWorkspace = { ...state.workspace, selectedTaskId: taskId };
          return { workspace: newWorkspace };
        }),
      }),
      {
        name: 'reverse-engineer-coach-store',
        partialize: (state) => ({
          projects: state.projects,
          workspaceStates: state.workspaceStates,
        }),
      }
    ),
    { name: 'reverse-engineer-coach' }
  )
);