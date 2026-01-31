/**
 * useWorkflowErrorHandler - React hook for comprehensive workflow error handling
 * 
 * Features:
 * - Automatic error categorization and handling
 * - Recovery strategy execution
 * - Fallback workflow activation
 * - Error state management
 * - User-friendly error display
 */

import { useState, useCallback, useRef } from 'react';
import { workflowErrorHandler, WorkflowError, RecoveryStrategy, FallbackWorkflow } from '../services/WorkflowErrorHandler';
import { useToast } from '../store/toastStore';

export interface ErrorState {
  hasError: boolean;
  error: WorkflowError | null;
  userMessage: string;
  actions: Array<{ label: string; action: () => Promise<void> }>;
  recovery?: RecoveryStrategy;
  fallback?: FallbackWorkflow;
  isRecovering: boolean;
}

export interface UseWorkflowErrorHandlerOptions {
  onError?: (error: WorkflowError) => void;
  onRecovery?: (success: boolean) => void;
  onFallback?: (fallback: FallbackWorkflow) => void;
  autoRetry?: boolean;
  maxRetries?: number;
  showToast?: boolean;
}

export const useWorkflowErrorHandler = (options: UseWorkflowErrorHandlerOptions = {}) => {
  const {
    onError,
    onRecovery,
    onFallback,
    autoRetry = false,
    maxRetries = 3,
    showToast = true
  } = options;

  const { showError, showInfo, showSuccess } = useToast();
  const retryCountRef = useRef<Map<string, number>>(new Map());

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    userMessage: '',
    actions: [],
    isRecovering: false
  });

  /**
   * Handle an error with comprehensive recovery options
   */
  const handleError = useCallback(async (error: any, context: any = {}) => {
    try {
      const result = await workflowErrorHandler.handleError(error, context);
      
      const workflowError = result.recovery?.id ? 
        workflowErrorHandler['categorizeError'](error, context) : 
        workflowErrorHandler['categorizeError'](error, context);

      // Create enhanced actions with error handling
      const enhancedActions = result.actions.map(action => ({
        ...action,
        action: async () => {
          setErrorState(prev => ({ ...prev, isRecovering: true }));
          try {
            await action.action();
            setErrorState(prev => ({ ...prev, hasError: false, isRecovering: false }));
            if (showToast) {
              showSuccess('Issue resolved', 'The problem has been fixed and you can continue.');
            }
            onRecovery?.(true);
          } catch (recoveryError) {
            console.error('Recovery action failed:', recoveryError);
            if (showToast) {
              showError('Recovery failed', 'The recovery action didn\'t work. Please try another option.');
            }
            onRecovery?.(false);
          } finally {
            setErrorState(prev => ({ ...prev, isRecovering: false }));
          }
        }
      }));

      setErrorState({
        hasError: true,
        error: workflowError,
        userMessage: result.userMessage,
        actions: enhancedActions,
        recovery: result.recovery,
        fallback: result.fallback,
        isRecovering: false
      });

      // Show toast notification
      if (showToast) {
        const severity = workflowError.severity;
        if (severity === 'critical' || severity === 'high') {
          showError('Error occurred', result.userMessage);
        } else {
          showInfo('Issue detected', result.userMessage);
        }
      }

      // Call error callback
      onError?.(workflowError);

      // Auto-retry if enabled and error is retryable
      if (autoRetry && workflowError.retryable) {
        const errorKey = `${workflowError.type}_${context.currentStep || 'unknown'}`;
        const currentRetries = retryCountRef.current.get(errorKey) || 0;
        
        if (currentRetries < maxRetries) {
          retryCountRef.current.set(errorKey, currentRetries + 1);
          
          // Wait a bit before retrying
          setTimeout(async () => {
            if (result.recovery) {
              try {
                await result.recovery.action();
                retryCountRef.current.delete(errorKey); // Reset on success
              } catch (retryError) {
                console.error('Auto-retry failed:', retryError);
              }
            }
          }, 1000 * (currentRetries + 1)); // Progressive delay
        }
      }

    } catch (handlerError) {
      console.error('Error handler failed:', handlerError);
      
      // Fallback to basic error display
      setErrorState({
        hasError: true,
        error: {
          id: `fallback_${Date.now()}`,
          type: 'unknown',
          severity: 'high',
          message: 'An unexpected error occurred',
          timestamp: new Date(),
          recoverable: true,
          retryable: true,
          fallbackAvailable: false
        },
        userMessage: 'Something went wrong. Please try refreshing the page.',
        actions: [
          {
            label: 'Refresh Page',
            action: async () => {
              window.location.reload();
            }
          }
        ],
        isRecovering: false
      });

      if (showToast) {
        showError('System error', 'A system error occurred. Please refresh the page.');
      }
    }
  }, [onError, onRecovery, autoRetry, maxRetries, showToast, showError, showInfo, showSuccess]);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      userMessage: '',
      actions: [],
      isRecovering: false
    });
  }, []);

  /**
   * Execute a recovery strategy
   */
  const executeRecovery = useCallback(async (strategy: RecoveryStrategy) => {
    setErrorState(prev => ({ ...prev, isRecovering: true }));
    
    try {
      const success = await strategy.action();
      
      if (success) {
        clearError();
        if (showToast) {
          showSuccess('Recovery successful', 'The issue has been resolved.');
        }
        onRecovery?.(true);
      } else {
        if (showToast) {
          showError('Recovery failed', 'The recovery attempt was not successful.');
        }
        onRecovery?.(false);
      }
    } catch (error) {
      console.error('Recovery execution failed:', error);
      if (showToast) {
        showError('Recovery error', 'An error occurred during recovery.');
      }
      onRecovery?.(false);
    } finally {
      setErrorState(prev => ({ ...prev, isRecovering: false }));
    }
  }, [clearError, showToast, showSuccess, showError, onRecovery]);

  /**
   * Execute a fallback workflow
   */
  const executeFallback = useCallback(async (fallback: FallbackWorkflow, context: any = {}) => {
    setErrorState(prev => ({ ...prev, isRecovering: true }));
    
    try {
      const result = await fallback.execute(context);
      
      clearError();
      
      if (showToast) {
        showInfo('Using alternative approach', `Switched to ${fallback.name}`);
      }
      
      onFallback?.(fallback);
      
      return result;
    } catch (error) {
      console.error('Fallback execution failed:', error);
      if (showToast) {
        showError('Fallback failed', 'The alternative approach also failed.');
      }
      throw error;
    } finally {
      setErrorState(prev => ({ ...prev, isRecovering: false }));
    }
  }, [clearError, showToast, showInfo, showError, onFallback]);

  /**
   * Retry an operation with exponential backoff
   */
  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    context: any = {},
    customMaxRetries?: number
  ): Promise<T> => {
    try {
      return await workflowErrorHandler.retryWithBackoff(operation, customMaxRetries || maxRetries);
    } catch (error) {
      await handleError(error, context);
      throw error;
    }
  }, [handleError, maxRetries]);

  /**
   * Wrap an async operation with error handling
   */
  const withErrorHandling = useCallback(<T>(
    operation: () => Promise<T>,
    context: any = {}
  ) => {
    return async (): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        await handleError(error, context);
        throw error;
      }
    };
  }, [handleError]);

  /**
   * Check if an error is retryable
   */
  const isRetryable = useCallback((error: any): boolean => {
    return workflowErrorHandler.isRetryable(error);
  }, []);

  /**
   * Check if a fallback is available for an error
   */
  const hasFallback = useCallback((error: any, context: any = {}): boolean => {
    return workflowErrorHandler.hasFallback(error, context);
  }, []);

  /**
   * Get error statistics
   */
  const getErrorStats = useCallback(() => {
    return workflowErrorHandler.getErrorStats();
  }, []);

  return {
    // Error state
    errorState,
    hasError: errorState.hasError,
    error: errorState.error,
    isRecovering: errorState.isRecovering,

    // Error handling functions
    handleError,
    clearError,
    executeRecovery,
    executeFallback,
    retryOperation,
    withErrorHandling,

    // Utility functions
    isRetryable,
    hasFallback,
    getErrorStats
  };
};