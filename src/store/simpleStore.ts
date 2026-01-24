import React, { createContext, useContext, useReducer, ReactNode } from 'react';

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

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  preferred_ai_provider: string;
  preferred_language: string;
  preferred_frameworks?: string[];
  created_at: string;
}

export interface AppState {
  // Learning projects
  projects: LearningProject[];
  currentProject: LearningProject | null;
  
  // Authentication
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
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
}

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ARCHITECTURE_TOPIC'; payload: string }
  | { type: 'SET_REPOSITORY_URL'; payload: string }
  | { type: 'SET_VALIDATING'; payload: boolean }
  | { type: 'SET_VALIDATION_ERROR'; payload: string | null }
  | { type: 'RESET_LEARNING_INTENT' }
  | { type: 'ADD_PROJECT'; payload: LearningProject }
  | { type: 'SET_PROJECTS'; payload: LearningProject[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: LearningProject | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AppState = {
  projects: [],
  currentProject: null,
  user: null,
  token: localStorage.getItem('auth-token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  learningIntent: {
    architectureTopic: '',
    repositoryUrl: '',
    isValidating: false,
    validationError: null,
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ARCHITECTURE_TOPIC':
      return {
        ...state,
        learningIntent: { ...state.learningIntent, architectureTopic: action.payload }
      };
    case 'SET_REPOSITORY_URL':
      return {
        ...state,
        learningIntent: { ...state.learningIntent, repositoryUrl: action.payload }
      };
    case 'SET_VALIDATING':
      return {
        ...state,
        learningIntent: { ...state.learningIntent, isValidating: action.payload }
      };
    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        learningIntent: { ...state.learningIntent, validationError: action.payload }
      };
    case 'RESET_LEARNING_INTENT':
      return {
        ...state,
        learningIntent: {
          architectureTopic: '',
          repositoryUrl: '',
          isValidating: false,
          validationError: null,
        }
      };
    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload]
      };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TOKEN':
      if (action.payload) {
        localStorage.setItem('auth-token', action.payload);
      } else {
        localStorage.removeItem('auth-token');
      }
      return { ...state, token: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'LOGOUT':
      localStorage.removeItem('auth-token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        projects: [],
        currentProject: null,
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  const contextValue: AppContextType = {
    state,
    dispatch
  };
  
  return React.createElement(
    AppContext.Provider,
    { value: contextValue },
    children
  );
};

export const useSimpleAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useSimpleAppStore must be used within an AppProvider');
  }
  
  const { state, dispatch } = context;
  
  // Use useMemo to create stable function references
  return React.useMemo(() => ({
    // State
    ...state,
    
    // Actions
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    setArchitectureTopic: (topic: string) => dispatch({ type: 'SET_ARCHITECTURE_TOPIC', payload: topic }),
    setRepositoryUrl: (url: string) => dispatch({ type: 'SET_REPOSITORY_URL', payload: url }),
    setValidating: (validating: boolean) => dispatch({ type: 'SET_VALIDATING', payload: validating }),
    setValidationError: (error: string | null) => dispatch({ type: 'SET_VALIDATION_ERROR', payload: error }),
    resetLearningIntent: () => dispatch({ type: 'RESET_LEARNING_INTENT' }),
    addProject: (project: LearningProject) => dispatch({ type: 'ADD_PROJECT', payload: project }),
    setProjects: (projects: LearningProject[]) => dispatch({ type: 'SET_PROJECTS', payload: projects }),
    setCurrentProject: (project: LearningProject | null) => dispatch({ type: 'SET_CURRENT_PROJECT', payload: project }),
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    setToken: (token: string | null) => dispatch({ type: 'SET_TOKEN', payload: token }),
    setAuthenticated: (authenticated: boolean) => dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated }),
    logout: () => dispatch({ type: 'LOGOUT' }),
  }), [state, dispatch]);
};