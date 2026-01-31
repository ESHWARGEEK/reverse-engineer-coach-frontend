/**
 * useWorkflowState - React hook for integrating WorkflowStateManager with React components
 * 
 * This hook provides:
 * - Reactive state updates from WorkflowStateManager
 * - Convenient methods for workflow navigation and data management
 * - Automatic cleanup and error handling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  WorkflowStateManager, 
  WorkflowConfig, 
  WorkflowState, 
  StateChangeEvent,
  StateChangeListener,
  ValidationResult
} from '../services/WorkflowStateManager';

export interface UseWorkflowStateOptions {
  config: WorkflowConfig;
  initialState?: Partial<WorkflowState>;
  onStateChange?: (event: StateChangeEvent) => void;
  onError?: (error: Error) => void;
}

export interface UseWorkflowStateReturn {
  // State
  state: WorkflowState;
  currentStep: any;
  isLoading: boolean;
  
  // Navigation
  nextStep: () => Promise<boolean>;
  previousStep: () => Promise<boolean>;
  goToStep: (stepId: string) => Promise<boolean>;
  skipStep: () => Promise<boolean>;
  
  // Data management
  updateStepData: (data: any) => void;
  updateCurrentStepData: (data: any) => void;
  getStepData: (stepId: string) => any;
  getCurrentStepData: () => any;
  
  // State management
  setProcessing: (isProcessing: boolean, message?: string) => void;
  addError: (field: string, message: string) => void;
  clearErrors: () => void;
  addWarning: (field: string, message: string) => void;
  clearWarnings: () => void;
  
  // Workflow control
  reset: () => void;
  saveState: () => boolean;
  clearPersistedState: () => void;
  
  // Utility
  isComplete: () => boolean;
  getCompletionPercentage: () => number;
  canNavigateToStep: (stepId: string) => boolean;
  validateCurrentStep: () => Promise<ValidationResult>;
}

export const useWorkflowState = (options: UseWorkflowStateOptions): UseWorkflowStateReturn => {
  const { config, initialState, onStateChange, onError } = options;
  
  // Create manager instance (only once)
  const managerRef = useRef<WorkflowStateManager | null>(null);
  const [state, setState] = useState<WorkflowState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize manager
  useEffect(() => {
    try {
      const manager = new WorkflowStateManager(config, initialState);
      managerRef.current = manager;
      
      // Set initial state
      setState(manager.getState());
      setIsLoading(false);
      
      // Setup state change listener
      const listener: StateChangeListener = (event) => {
        setState(event.currentState);
        onStateChange?.(event);
      };
      
      manager.addListener(listener);
      
      // Cleanup function
      return () => {
        manager.removeListener(listener);
        manager.destroy();
        managerRef.current = null;
      };
    } catch (error) {
      console.error('Failed to initialize WorkflowStateManager:', error);
      onError?.(error as Error);
      setIsLoading(false);
    }
  }, [config, initialState, onStateChange, onError]);
  
  // Navigation methods
  const nextStep = useCallback(async (): Promise<boolean> => {
    if (!managerRef.current) return false;
    
    try {
      return await managerRef.current.nextStep();
    } catch (error) {
      console.error('Error in nextStep:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);
  
  const previousStep = useCallback(async (): Promise<boolean> => {
    if (!managerRef.current) return false;
    
    try {
      return await managerRef.current.previousStep();
    } catch (error) {
      console.error('Error in previousStep:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);
  
  const goToStep = useCallback(async (stepId: string): Promise<boolean> => {
    if (!managerRef.current) return false;
    
    try {
      return await managerRef.current.goToStep(stepId);
    } catch (error) {
      console.error('Error in goToStep:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);
  
  const skipStep = useCallback(async (): Promise<boolean> => {
    if (!managerRef.current) return false;
    
    try {
      return await managerRef.current.skipStep();
    } catch (error) {
      console.error('Error in skipStep:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);
  
  // Data management methods
  const updateStepData = useCallback((data: any): void => {
    if (!managerRef.current || !state) return;
    
    try {
      managerRef.current.updateCurrentStepData(data);
    } catch (error) {
      console.error('Error in updateStepData:', error);
      onError?.(error as Error);
    }
  }, [state, onError]);
  
  const updateCurrentStepData = useCallback((data: any): void => {
    updateStepData(data);
  }, [updateStepData]);
  
  const getStepData = useCallback((stepId: string): any => {
    if (!managerRef.current) return {};
    
    try {
      return managerRef.current.getStepData(stepId);
    } catch (error) {
      console.error('Error in getStepData:', error);
      onError?.(error as Error);
      return {};
    }
  }, [onError]);
  
  const getCurrentStepData = useCallback((): any => {
    if (!managerRef.current) return {};
    
    try {
      return managerRef.current.getCurrentStepData();
    } catch (error) {
      console.error('Error in getCurrentStepData:', error);
      onError?.(error as Error);
      return {};
    }
  }, [onError]);
  
  // State management methods
  const setProcessing = useCallback((isProcessing: boolean, message?: string): void => {
    if (!managerRef.current) return;
    
    try {
      managerRef.current.setProcessing(isProcessing, message);
    } catch (error) {
      console.error('Error in setProcessing:', error);
      onError?.(error as Error);
    }
  }, [onError]);
  
  const addError = useCallback((field: string, message: string): void => {
    if (!managerRef.current) return;
    
    try {
      managerRef.current.addError(field, message);
    } catch (error) {
      console.error('Error in addError:', error);
      onError?.(error as Error);
    }
  }, [onError]);
  
  const clearErrors = useCallback((): void => {
    if (!managerRef.current) return;
    
    try {
      managerRef.current.clearErrors();
    } catch (error) {
      console.error('Error in clearErrors:', error);
      onError?.(error as Error);
    }
  }, [onError]);
  
  const addWarning = useCallback((field: string, message: string): void => {
    if (!managerRef.current) return;
    
    try {
      managerRef.current.addWarning(field, message);
    } catch (error) {
      console.error('Error in addWarning:', error);
      onError?.(error as Error);
    }
  }, [onError]);
  
  const clearWarnings = useCallback((): void => {
    if (!managerRef.current) return;
    
    try {
      managerRef.current.clearWarnings();
    } catch (error) {
      console.error('Error in clearWarnings:', error);
      onError?.(error as Error);
    }
  }, [onError]);
  
  // Workflow control methods
  const reset = useCallback((): void => {
    if (!managerRef.current) return;
    
    try {
      managerRef.current.reset();
    } catch (error) {
      console.error('Error in reset:', error);
      onError?.(error as Error);
    }
  }, [onError]);
  
  const saveState = useCallback((): boolean => {
    if (!managerRef.current) return false;
    
    try {
      return managerRef.current.saveState();
    } catch (error) {
      console.error('Error in saveState:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);
  
  const clearPersistedState = useCallback((): void => {
    if (!managerRef.current) return;
    
    try {
      managerRef.current.clearPersistedState();
    } catch (error) {
      console.error('Error in clearPersistedState:', error);
      onError?.(error as Error);
    }
  }, [onError]);
  
  // Utility methods
  const isComplete = useCallback((): boolean => {
    if (!managerRef.current) return false;
    
    try {
      return managerRef.current.isComplete();
    } catch (error) {
      console.error('Error in isComplete:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onError]);
  
  const getCompletionPercentage = useCallback((): number => {
    if (!managerRef.current) return 0;
    
    try {
      return managerRef.current.getCompletionPercentage();
    } catch (error) {
      console.error('Error in getCompletionPercentage:', error);
      onError?.(error as Error);
      return 0;
    }
  }, [onError]);
  
  const canNavigateToStep = useCallback((stepId: string): boolean => {
    if (!managerRef.current || !state) return false;
    
    try {
      const targetStep = managerRef.current.getStep(stepId);
      if (!targetStep) return false;
      
      const steps = managerRef.current.getSteps();
      const targetIndex = steps.findIndex(step => step.id === stepId);
      const currentIndex = steps.findIndex(step => step.id === state.currentStep);
      
      if (targetIndex <= currentIndex) {
        return true; // Can always go back to previous steps
      }
      
      // Check if all intermediate steps are completed or skippable
      for (let i = currentIndex; i < targetIndex; i++) {
        const step = steps[i];
        if (!state.completedSteps.includes(step.id) && !step.canSkip) {
          return false;
        }
      }
      
      // Check dependencies
      if (targetStep.dependencies) {
        return targetStep.dependencies.every(dep => state.completedSteps.includes(dep));
      }
      
      return true;
    } catch (error) {
      console.error('Error in canNavigateToStep:', error);
      onError?.(error as Error);
      return false;
    }
  }, [state, onError]);
  
  const validateCurrentStep = useCallback(async (): Promise<ValidationResult> => {
    if (!managerRef.current || !state) {
      return { isValid: false, errors: { general: 'Workflow not initialized' } };
    }
    
    try {
      const currentStep = managerRef.current.getCurrentStep();
      if (!currentStep) {
        return { isValid: false, errors: { general: 'Current step not found' } };
      }
      
      if (!currentStep.validation) {
        return { isValid: true, errors: {} };
      }
      
      const stepData = managerRef.current.getCurrentStepData();
      return currentStep.validation(stepData);
    } catch (error) {
      console.error('Error in validateCurrentStep:', error);
      onError?.(error as Error);
      return { isValid: false, errors: { general: 'Validation error occurred' } };
    }
  }, [state, onError]);
  
  // Get current step configuration
  const currentStep = state ? managerRef.current?.getCurrentStep() || null : null;
  
  // Return hook interface
  return {
    // State
    state: state || {
      workflowId: '',
      currentStep: '',
      stepData: {},
      completedSteps: [],
      skippedSteps: [],
      progress: 0,
      isProcessing: false,
      errors: {},
      warnings: {},
      canGoBack: false,
      canGoForward: false,
      lastSaved: new Date(),
      version: '1.0.0'
    },
    currentStep,
    isLoading,
    
    // Navigation
    nextStep,
    previousStep,
    goToStep,
    skipStep,
    
    // Data management
    updateStepData,
    updateCurrentStepData,
    getStepData,
    getCurrentStepData,
    
    // State management
    setProcessing,
    addError,
    clearErrors,
    addWarning,
    clearWarnings,
    
    // Workflow control
    reset,
    saveState,
    clearPersistedState,
    
    // Utility
    isComplete,
    getCompletionPercentage,
    canNavigateToStep,
    validateCurrentStep
  };
};