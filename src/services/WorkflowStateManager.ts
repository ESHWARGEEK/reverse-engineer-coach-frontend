/**
 * WorkflowStateManager - Robust state management for multi-step workflow with persistence
 * 
 * This class provides:
 * - Local storage persistence for workflow progress
 * - State validation and error recovery mechanisms
 * - Workflow progress tracking and step validation
 * - Navigation controls with validation
 */

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  canSkip?: boolean;
  estimatedTime?: number;
  validation?: (data: any) => ValidationResult;
  dependencies?: string[]; // Steps that must be completed before this one
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

export interface WorkflowState {
  workflowId: string;
  currentStep: string;
  stepData: Record<string, any>;
  completedSteps: string[];
  skippedSteps: string[];
  progress: number;
  isProcessing: boolean;
  processingMessage?: string;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  canGoBack: boolean;
  canGoForward: boolean;
  lastSaved: Date;
  version: string; // For handling state migration
}

export interface WorkflowConfig {
  id: string;
  name: string;
  steps: WorkflowStep[];
  allowBackNavigation?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
  maxRetries?: number;
}

export interface StateChangeEvent {
  type: 'step_changed' | 'data_updated' | 'validation_failed' | 'error_occurred' | 'progress_updated';
  previousState?: WorkflowState;
  currentState: WorkflowState;
  metadata?: any;
}

export type StateChangeListener = (event: StateChangeEvent) => void;

export class WorkflowStateManager {
  private config: WorkflowConfig;
  private state: WorkflowState;
  private listeners: StateChangeListener[] = [];
  private autoSaveTimer?: NodeJS.Timeout;
  private storageKey: string;
  private retryCount: number = 0;

  constructor(config: WorkflowConfig, initialState?: Partial<WorkflowState>) {
    this.config = config;
    this.storageKey = `workflow-state-${config.id}`;
    
    // Initialize state
    this.state = this.createInitialState(initialState);
    
    // Setup auto-save if enabled
    if (config.autoSave !== false) {
      this.setupAutoSave();
    }
    
    // Load persisted state
    this.loadPersistedState();
  }

  /**
   * Create initial workflow state
   */
  private createInitialState(initialState?: Partial<WorkflowState>): WorkflowState {
    const firstStep = this.config.steps[0];
    
    return {
      workflowId: this.config.id,
      currentStep: firstStep?.id || '',
      stepData: {},
      completedSteps: [],
      skippedSteps: [],
      progress: 0,
      isProcessing: false,
      errors: {},
      warnings: {},
      canGoBack: false,
      canGoForward: true,
      lastSaved: new Date(),
      version: '1.0.0',
      ...initialState
    };
  }

  /**
   * Setup auto-save functionality
   */
  private setupAutoSave(): void {
    const interval = this.config.autoSaveInterval || 5000; // Default 5 seconds
    
    this.autoSaveTimer = setInterval(() => {
      this.saveState();
    }, interval);
  }

  /**
   * Load persisted state from localStorage
   */
  private loadPersistedState(): boolean {
    try {
      const savedState = localStorage.getItem(this.storageKey);
      if (!savedState) return false;

      const parsedState = JSON.parse(savedState) as WorkflowState;
      
      // Validate loaded state
      if (this.validatePersistedState(parsedState)) {
        // Merge with current state, preserving any new fields
        this.state = {
          ...this.state,
          ...parsedState,
          lastSaved: new Date(parsedState.lastSaved)
        };
        
        // Recalculate navigation state
        this.updateNavigationState();
        
        this.notifyListeners({
          type: 'progress_updated',
          currentState: this.state,
          metadata: { source: 'persisted_load' }
        });
        
        return true;
      }
    } catch (error) {
      console.warn('Failed to load persisted workflow state:', error);
      this.clearPersistedState();
    }
    
    return false;
  }

  /**
   * Validate persisted state structure and data
   */
  private validatePersistedState(state: any): boolean {
    if (!state || typeof state !== 'object') return false;
    
    // Check required fields
    const requiredFields = ['workflowId', 'currentStep', 'stepData', 'completedSteps'];
    for (const field of requiredFields) {
      if (!(field in state)) return false;
    }
    
    // Validate workflow ID matches
    if (state.workflowId !== this.config.id) return false;
    
    // Validate current step exists in configuration
    const stepExists = this.config.steps.some(step => step.id === state.currentStep);
    if (!stepExists) return false;
    
    // Validate completed steps exist in configuration
    const stepIds = new Set(this.config.steps.map(step => step.id));
    for (const completedStep of state.completedSteps || []) {
      if (!stepIds.has(completedStep)) return false;
    }
    
    return true;
  }

  /**
   * Save current state to localStorage
   */
  public saveState(): boolean {
    try {
      const stateToSave = {
        ...this.state,
        lastSaved: new Date()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
      this.state.lastSaved = stateToSave.lastSaved;
      this.retryCount = 0; // Reset retry count on successful save
      
      return true;
    } catch (error) {
      console.error('Failed to save workflow state:', error);
      
      // Retry logic
      if (this.retryCount < (this.config.maxRetries || 3)) {
        this.retryCount++;
        setTimeout(() => this.saveState(), 1000 * this.retryCount);
      }
      
      return false;
    }
  }

  /**
   * Clear persisted state
   */
  public clearPersistedState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear persisted state:', error);
    }
  }

  /**
   * Get current workflow state
   */
  public getState(): WorkflowState {
    return { ...this.state };
  }

  /**
   * Get current step configuration
   */
  public getCurrentStep(): WorkflowStep | null {
    return this.config.steps.find(step => step.id === this.state.currentStep) || null;
  }

  /**
   * Get step by ID
   */
  public getStep(stepId: string): WorkflowStep | null {
    return this.config.steps.find(step => step.id === stepId) || null;
  }

  /**
   * Get all workflow steps
   */
  public getSteps(): WorkflowStep[] {
    return [...this.config.steps];
  }

  /**
   * Navigate to next step with validation
   */
  public async nextStep(): Promise<boolean> {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return false;

    // Validate current step data if validation function exists
    if (currentStep.validation) {
      const stepData = this.state.stepData[this.state.currentStep] || {};
      const validationResult = currentStep.validation(stepData);
      
      if (!validationResult.isValid) {
        this.updateState({
          errors: validationResult.errors,
          warnings: validationResult.warnings || {}
        });
        
        this.notifyListeners({
          type: 'validation_failed',
          currentState: this.state,
          metadata: { validationResult }
        });
        
        return false;
      }
    }

    // Find next step
    const currentIndex = this.config.steps.findIndex(step => step.id === this.state.currentStep);
    if (currentIndex === -1 || currentIndex >= this.config.steps.length - 1) {
      return false; // Already at last step
    }

    const nextStep = this.config.steps[currentIndex + 1];
    
    // Check dependencies
    if (nextStep.dependencies) {
      const unmetDependencies = nextStep.dependencies.filter(
        dep => !this.state.completedSteps.includes(dep)
      );
      
      if (unmetDependencies.length > 0) {
        this.updateState({
          errors: {
            dependencies: `Cannot proceed. Please complete: ${unmetDependencies.join(', ')}`
          }
        });
        return false;
      }
    }

    // Mark current step as completed
    const previousState = { ...this.state };
    const completedSteps = [...this.state.completedSteps];
    if (!completedSteps.includes(this.state.currentStep)) {
      completedSteps.push(this.state.currentStep);
    }

    // Update state
    this.updateState({
      currentStep: nextStep.id,
      completedSteps,
      progress: ((currentIndex + 1) / this.config.steps.length) * 100,
      errors: {},
      warnings: {}
    });

    this.notifyListeners({
      type: 'step_changed',
      previousState,
      currentState: this.state,
      metadata: { direction: 'forward', fromStep: previousState.currentStep, toStep: nextStep.id }
    });

    return true;
  }

  /**
   * Navigate to previous step
   */
  public async previousStep(): Promise<boolean> {
    if (!this.config.allowBackNavigation && this.config.allowBackNavigation !== undefined) {
      return false;
    }

    const currentIndex = this.config.steps.findIndex(step => step.id === this.state.currentStep);
    if (currentIndex <= 0) {
      return false; // Already at first step
    }

    const previousStep = this.config.steps[currentIndex - 1];
    const previousState = { ...this.state };

    // Update state
    this.updateState({
      currentStep: previousStep.id,
      progress: ((currentIndex - 1) / this.config.steps.length) * 100,
      errors: {},
      warnings: {}
    });

    this.notifyListeners({
      type: 'step_changed',
      previousState,
      currentState: this.state,
      metadata: { direction: 'backward', fromStep: previousState.currentStep, toStep: previousStep.id }
    });

    return true;
  }

  /**
   * Navigate to specific step
   */
  public async goToStep(stepId: string): Promise<boolean> {
    const targetStep = this.getStep(stepId);
    if (!targetStep) return false;

    const targetIndex = this.config.steps.findIndex(step => step.id === stepId);
    const currentIndex = this.config.steps.findIndex(step => step.id === this.state.currentStep);

    // Check if we can navigate to this step
    if (targetIndex > currentIndex) {
      // Forward navigation - check if all intermediate steps are completed or skippable
      for (let i = currentIndex; i < targetIndex; i++) {
        const step = this.config.steps[i];
        if (!this.state.completedSteps.includes(step.id) && !step.canSkip) {
          this.updateState({
            errors: {
              navigation: `Cannot skip to ${targetStep.title}. Please complete ${step.title} first.`
            }
          });
          return false;
        }
      }
    }

    // Check dependencies
    if (targetStep.dependencies) {
      const unmetDependencies = targetStep.dependencies.filter(
        dep => !this.state.completedSteps.includes(dep)
      );
      
      if (unmetDependencies.length > 0) {
        this.updateState({
          errors: {
            dependencies: `Cannot navigate to ${targetStep.title}. Please complete: ${unmetDependencies.join(', ')}`
          }
        });
        return false;
      }
    }

    const previousState = { ...this.state };

    // Update state
    this.updateState({
      currentStep: stepId,
      progress: (targetIndex / this.config.steps.length) * 100,
      errors: {},
      warnings: {}
    });

    this.notifyListeners({
      type: 'step_changed',
      previousState,
      currentState: this.state,
      metadata: { 
        direction: targetIndex > currentIndex ? 'forward' : 'backward',
        fromStep: previousState.currentStep, 
        toStep: stepId,
        isDirectNavigation: true
      }
    });

    return true;
  }

  /**
   * Skip current step if allowed
   */
  public async skipStep(): Promise<boolean> {
    const currentStep = this.getCurrentStep();
    if (!currentStep?.canSkip) return false;

    // Add to skipped steps
    const skippedSteps = [...this.state.skippedSteps];
    if (!skippedSteps.includes(this.state.currentStep)) {
      skippedSteps.push(this.state.currentStep);
    }

    this.updateState({ skippedSteps });

    // Navigate to next step
    return this.nextStep();
  }

  /**
   * Update step data
   */
  public updateStepData(stepId: string, data: any): void {
    const previousState = { ...this.state };
    
    this.updateState({
      stepData: {
        ...this.state.stepData,
        [stepId]: {
          ...this.state.stepData[stepId],
          ...data
        }
      }
    });

    this.notifyListeners({
      type: 'data_updated',
      previousState,
      currentState: this.state,
      metadata: { stepId, updatedData: data }
    });
  }

  /**
   * Update current step data
   */
  public updateCurrentStepData(data: any): void {
    this.updateStepData(this.state.currentStep, data);
  }

  /**
   * Get step data
   */
  public getStepData(stepId: string): any {
    return this.state.stepData[stepId] || {};
  }

  /**
   * Get current step data
   */
  public getCurrentStepData(): any {
    return this.getStepData(this.state.currentStep);
  }

  /**
   * Set processing state
   */
  public setProcessing(isProcessing: boolean, message?: string): void {
    this.updateState({
      isProcessing,
      processingMessage: message
    });
  }

  /**
   * Add error
   */
  public addError(field: string, message: string): void {
    this.updateState({
      errors: {
        ...this.state.errors,
        [field]: message
      }
    });
  }

  /**
   * Clear errors
   */
  public clearErrors(): void {
    this.updateState({ errors: {} });
  }

  /**
   * Add warning
   */
  public addWarning(field: string, message: string): void {
    this.updateState({
      warnings: {
        ...this.state.warnings,
        [field]: message
      }
    });
  }

  /**
   * Clear warnings
   */
  public clearWarnings(): void {
    this.updateState({ warnings: {} });
  }

  /**
   * Reset workflow to initial state
   */
  public reset(): void {
    const previousState = { ...this.state };
    this.state = this.createInitialState();
    this.clearPersistedState();
    
    this.notifyListeners({
      type: 'progress_updated',
      previousState,
      currentState: this.state,
      metadata: { action: 'reset' }
    });
  }

  /**
   * Check if workflow is complete
   */
  public isComplete(): boolean {
    const requiredSteps = this.config.steps.filter(step => !step.canSkip);
    return requiredSteps.every(step => 
      this.state.completedSteps.includes(step.id) || 
      this.state.skippedSteps.includes(step.id)
    );
  }

  /**
   * Get completion percentage
   */
  public getCompletionPercentage(): number {
    const totalSteps = this.config.steps.length;
    const completedCount = this.state.completedSteps.length + this.state.skippedSteps.length;
    return totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  }

  /**
   * Add state change listener
   */
  public addListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove state change listener
   */
  public removeListener(listener: StateChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update state and recalculate navigation
   */
  private updateState(updates: Partial<WorkflowState>): void {
    this.state = { ...this.state, ...updates };
    this.updateNavigationState();
    
    // Auto-save if enabled
    if (this.config.autoSave !== false) {
      this.saveState();
    }
  }

  /**
   * Update navigation state based on current position
   */
  private updateNavigationState(): void {
    const currentIndex = this.config.steps.findIndex(step => step.id === this.state.currentStep);
    
    this.state.canGoBack = currentIndex > 0 && (this.config.allowBackNavigation !== false);
    this.state.canGoForward = currentIndex < this.config.steps.length - 1;
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(event: StateChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.listeners = [];
    this.saveState(); // Final save
  }
}