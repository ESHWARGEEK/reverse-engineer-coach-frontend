/**
 * WorkflowErrorHandler - Comprehensive error handling system with intelligent fallbacks
 * 
 * Features:
 * - Multiple recovery strategies for different error types
 * - Fallback workflows for each potential failure point
 * - User-friendly error messages and recovery options
 * - Error logging and monitoring for system improvement
 * - Graceful degradation to simpler workflows when needed
 */

export interface WorkflowError {
  id: string;
  type: 'network' | 'validation' | 'ai_service' | 'authentication' | 'rate_limit' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
  step?: string;
  recoverable: boolean;
  retryable: boolean;
  fallbackAvailable: boolean;
}

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  action: () => Promise<boolean>;
  requiresUserInput?: boolean;
  userMessage?: string;
  buttonText?: string;
}

export interface FallbackWorkflow {
  id: string;
  name: string;
  description: string;
  steps: string[];
  execute: (context: any) => Promise<any>;
}

export class WorkflowErrorHandler {
  private errorLog: WorkflowError[] = [];
  private recoveryStrategies: Map<string, RecoveryStrategy[]> = new Map();
  private fallbackWorkflows: Map<string, FallbackWorkflow> = new Map();
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 5000]; // Progressive delays

  constructor() {
    this.initializeRecoveryStrategies();
    this.initializeFallbackWorkflows();
  }

  /**
   * Handle an error with appropriate recovery strategies
   */
  async handleError(error: any, context: any): Promise<{
    handled: boolean;
    recovery?: RecoveryStrategy;
    fallback?: FallbackWorkflow;
    userMessage: string;
    actions: Array<{ label: string; action: () => Promise<void> }>;
  }> {
    const workflowError = this.categorizeError(error, context);
    this.logError(workflowError);

    // Get available recovery strategies
    const strategies = this.getRecoveryStrategies(workflowError);
    const fallback = this.getFallbackWorkflow(workflowError, context);

    // Determine user message and actions
    const userMessage = this.generateUserMessage(workflowError);
    const actions = this.generateUserActions(workflowError, strategies, fallback);

    return {
      handled: true,
      recovery: strategies[0], // Primary recovery strategy
      fallback,
      userMessage,
      actions
    };
  }

  /**
   * Categorize error and create WorkflowError object
   */
  private categorizeError(error: any, context: any): WorkflowError {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR' || 
        (error.response && error.response.status >= 500)) {
      return {
        id,
        type: 'network',
        severity: 'medium',
        message: 'Network connection issue',
        details: error,
        timestamp,
        step: context.currentStep,
        recoverable: true,
        retryable: true,
        fallbackAvailable: true
      };
    }

    // Authentication errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return {
        id,
        type: 'authentication',
        severity: 'high',
        message: 'Authentication required',
        details: error,
        timestamp,
        step: context.currentStep,
        recoverable: true,
        retryable: false,
        fallbackAvailable: false
      };
    }

    // Rate limit errors
    if (error.response && error.response.status === 429) {
      return {
        id,
        type: 'rate_limit',
        severity: 'medium',
        message: 'Rate limit exceeded',
        details: error,
        timestamp,
        step: context.currentStep,
        recoverable: true,
        retryable: true,
        fallbackAvailable: true
      };
    }

    // Validation errors
    if (error.type === 'validation' || error.name === 'ValidationError') {
      return {
        id,
        type: 'validation',
        severity: 'low',
        message: 'Invalid input data',
        details: error,
        timestamp,
        step: context.currentStep,
        recoverable: true,
        retryable: false,
        fallbackAvailable: false
      };
    }

    // AI service errors
    if (error.service === 'ai' || error.message?.includes('AI') || error.message?.includes('LLM')) {
      return {
        id,
        type: 'ai_service',
        severity: 'high',
        message: 'AI service unavailable',
        details: error,
        timestamp,
        step: context.currentStep,
        recoverable: true,
        retryable: true,
        fallbackAvailable: true
      };
    }

    // Unknown errors
    return {
      id,
      type: 'unknown',
      severity: 'medium',
      message: error.message || 'An unexpected error occurred',
      details: error,
      timestamp,
      step: context.currentStep,
      recoverable: true,
      retryable: true,
      fallbackAvailable: true
    };
  }

  /**
   * Initialize recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Network error strategies
    this.recoveryStrategies.set('network', [
      {
        id: 'retry_request',
        name: 'Retry Request',
        description: 'Retry the failed request with exponential backoff',
        action: async () => {
          // Implemented by caller with retry logic
          return true;
        },
        userMessage: 'We\'ll try the request again automatically.',
        buttonText: 'Retry Now'
      },
      {
        id: 'check_connection',
        name: 'Check Connection',
        description: 'Guide user to check their internet connection',
        action: async () => {
          return navigator.onLine;
        },
        requiresUserInput: true,
        userMessage: 'Please check your internet connection and try again.',
        buttonText: 'I\'ve Checked My Connection'
      }
    ]);

    // AI service error strategies
    this.recoveryStrategies.set('ai_service', [
      {
        id: 'retry_ai_request',
        name: 'Retry AI Request',
        description: 'Retry the AI service request',
        action: async () => {
          return true;
        },
        userMessage: 'We\'ll try to contact the AI service again.',
        buttonText: 'Retry AI Request'
      },
      {
        id: 'use_fallback_ai',
        name: 'Use Fallback AI',
        description: 'Switch to backup AI service',
        action: async () => {
          return true;
        },
        userMessage: 'We\'ll try using our backup AI service.',
        buttonText: 'Use Backup Service'
      }
    ]);

    // Authentication error strategies
    this.recoveryStrategies.set('authentication', [
      {
        id: 'refresh_token',
        name: 'Refresh Authentication',
        description: 'Attempt to refresh the authentication token',
        action: async () => {
          // Implemented by auth service
          return true;
        },
        userMessage: 'We\'ll try to refresh your authentication.',
        buttonText: 'Refresh Authentication'
      },
      {
        id: 'relogin',
        name: 'Re-login',
        description: 'Redirect user to login page',
        action: async () => {
          window.location.href = '/auth';
          return true;
        },
        requiresUserInput: true,
        userMessage: 'Please log in again to continue.',
        buttonText: 'Go to Login'
      }
    ]);

    // Rate limit error strategies
    this.recoveryStrategies.set('rate_limit', [
      {
        id: 'wait_and_retry',
        name: 'Wait and Retry',
        description: 'Wait for rate limit to reset and retry',
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
          return true;
        },
        userMessage: 'We\'ll wait a moment and try again automatically.',
        buttonText: 'Wait and Retry'
      },
      {
        id: 'use_cached_data',
        name: 'Use Cached Data',
        description: 'Use previously cached data if available',
        action: async () => {
          return true;
        },
        userMessage: 'We\'ll use previously saved data to continue.',
        buttonText: 'Use Saved Data'
      }
    ]);

    // Validation error strategies
    this.recoveryStrategies.set('validation', [
      {
        id: 'fix_validation',
        name: 'Fix Input',
        description: 'Guide user to fix validation errors',
        action: async () => {
          return true;
        },
        requiresUserInput: true,
        userMessage: 'Please review and correct the highlighted fields.',
        buttonText: 'I\'ve Fixed the Issues'
      }
    ]);

    // Unknown error strategies
    this.recoveryStrategies.set('unknown', [
      {
        id: 'generic_retry',
        name: 'Try Again',
        description: 'Generic retry for unknown errors',
        action: async () => {
          return true;
        },
        userMessage: 'Let\'s try that again.',
        buttonText: 'Try Again'
      },
      {
        id: 'report_error',
        name: 'Report Error',
        description: 'Allow user to report the error',
        action: async () => {
          // Send error report
          return true;
        },
        requiresUserInput: true,
        userMessage: 'Help us improve by reporting this error.',
        buttonText: 'Report Error'
      }
    ]);
  }

  /**
   * Initialize fallback workflows for different scenarios
   */
  private initializeFallbackWorkflows(): void {
    // AI Discovery fallback - use manual repository entry
    this.fallbackWorkflows.set('ai_discovery_failed', {
      id: 'manual_repository_entry',
      name: 'Manual Repository Entry',
      description: 'Switch to manual repository entry when AI discovery fails',
      steps: ['manual-repository-entry', 'repository-validation', 'project-preview'],
      execute: async (context) => {
        return {
          step: 'manual-repository-entry',
          message: 'AI discovery is temporarily unavailable. You can manually enter a repository URL instead.',
          data: { mode: 'manual', previousAttempt: 'ai_discovery' }
        };
      }
    });

    // Repository analysis fallback - use basic metadata
    this.fallbackWorkflows.set('repository_analysis_failed', {
      id: 'basic_repository_info',
      name: 'Basic Repository Information',
      description: 'Use basic repository metadata when detailed analysis fails',
      steps: ['basic-repository-info', 'simple-project-preview'],
      execute: async (context) => {
        return {
          step: 'basic-repository-info',
          message: 'We\'ll create a basic learning plan using the repository\'s general information.',
          data: { analysisMode: 'basic', repository: context.repository }
        };
      }
    });

    // Curriculum generation fallback - use template
    this.fallbackWorkflows.set('curriculum_generation_failed', {
      id: 'template_curriculum',
      name: 'Template-based Curriculum',
      description: 'Use pre-built curriculum templates when AI generation fails',
      steps: ['template-selection', 'template-customization', 'project-creation'],
      execute: async (context) => {
        return {
          step: 'template-selection',
          message: 'We\'ll help you choose from our pre-built learning templates.',
          data: { mode: 'template', technologies: context.technologies }
        };
      }
    });

    // Complete workflow fallback - simple project creation
    this.fallbackWorkflows.set('enhanced_workflow_failed', {
      id: 'simple_project_creation',
      name: 'Simple Project Creation',
      description: 'Fall back to basic project creation when enhanced workflow fails',
      steps: ['simple-project-form', 'project-creation'],
      execute: async (context) => {
        return {
          step: 'simple-project-form',
          message: 'Let\'s create a simple project to get you started quickly.',
          data: { mode: 'simple', preservedData: context }
        };
      }
    });

    // Network connectivity fallback - offline mode
    this.fallbackWorkflows.set('network_unavailable', {
      id: 'offline_mode',
      name: 'Offline Mode',
      description: 'Continue with cached data when network is unavailable',
      steps: ['offline-notification', 'cached-data-workflow'],
      execute: async (context) => {
        return {
          step: 'offline-notification',
          message: 'Working offline with previously saved data.',
          data: { mode: 'offline', cachedData: context.cachedData }
        };
      }
    });
  }

  /**
   * Get recovery strategies for a specific error
   */
  private getRecoveryStrategies(error: WorkflowError): RecoveryStrategy[] {
    return this.recoveryStrategies.get(error.type) || this.recoveryStrategies.get('unknown') || [];
  }

  /**
   * Get appropriate fallback workflow for an error
   */
  private getFallbackWorkflow(error: WorkflowError, context: any): FallbackWorkflow | undefined {
    // Determine fallback based on error type and context
    if (error.type === 'ai_service' && context.currentStep === 'ai-discovery') {
      return this.fallbackWorkflows.get('ai_discovery_failed');
    }

    if (error.type === 'ai_service' && context.currentStep === 'repository-analysis') {
      return this.fallbackWorkflows.get('repository_analysis_failed');
    }

    if (error.type === 'ai_service' && context.currentStep === 'curriculum-generation') {
      return this.fallbackWorkflows.get('curriculum_generation_failed');
    }

    if (error.type === 'network') {
      return this.fallbackWorkflows.get('network_unavailable');
    }

    if (error.severity === 'critical') {
      return this.fallbackWorkflows.get('enhanced_workflow_failed');
    }

    return undefined;
  }

  /**
   * Generate user-friendly error message
   */
  private generateUserMessage(error: WorkflowError): string {
    const baseMessages = {
      network: 'We\'re having trouble connecting to our servers.',
      ai_service: 'Our AI service is temporarily unavailable.',
      authentication: 'Your session has expired.',
      rate_limit: 'We\'re receiving a lot of requests right now.',
      validation: 'There are some issues with the information provided.',
      unknown: 'Something unexpected happened.'
    };

    const severityModifiers = {
      low: 'This is a minor issue that we can easily fix.',
      medium: 'Don\'t worry, we have several ways to resolve this.',
      high: 'This is a significant issue, but we have solutions.',
      critical: 'This is a serious problem, but we won\'t leave you stuck.'
    };

    return `${baseMessages[error.type]} ${severityModifiers[error.severity]}`;
  }

  /**
   * Generate user action options
   */
  private generateUserActions(
    error: WorkflowError, 
    strategies: RecoveryStrategy[], 
    fallback?: FallbackWorkflow
  ): Array<{ label: string; action: () => Promise<void> }> {
    const actions: Array<{ label: string; action: () => Promise<void> }> = [];

    // Add primary recovery strategy
    if (strategies.length > 0) {
      const primary = strategies[0];
      actions.push({
        label: primary.buttonText || primary.name,
        action: async () => {
          await primary.action();
        }
      });
    }

    // Add fallback option
    if (fallback) {
      actions.push({
        label: `Use ${fallback.name}`,
        action: async () => {
          await fallback.execute({});
        }
      });
    }

    // Add alternative strategies
    strategies.slice(1, 3).forEach(strategy => {
      actions.push({
        label: strategy.buttonText || strategy.name,
        action: async () => {
          await strategy.action();
        }
      });
    });

    // Always provide a way to go back or start over
    actions.push({
      label: 'Go Back',
      action: async () => {
        // Implemented by caller
      }
    });

    actions.push({
      label: 'Start Over',
      action: async () => {
        // Implemented by caller
      }
    });

    return actions;
  }

  /**
   * Log error for monitoring and improvement
   */
  private logError(error: WorkflowError): void {
    this.errorLog.push(error);
    
    // Keep only last 100 errors in memory
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Send to monitoring service (in production)
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error);
    }

    console.error('Workflow Error:', error);
  }

  /**
   * Send error to monitoring service
   */
  private async sendToMonitoring(error: WorkflowError): Promise<void> {
    try {
      // In production, send to monitoring service like Sentry, LogRocket, etc.
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
    } catch (monitoringError) {
      console.warn('Failed to send error to monitoring:', monitoringError);
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }

        // Wait before retrying
        const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: any): boolean {
    const workflowError = this.categorizeError(error, {});
    return workflowError.retryable;
  }

  /**
   * Check if fallback is available
   */
  hasFallback(error: any, context: any): boolean {
    const workflowError = this.categorizeError(error, context);
    return workflowError.fallbackAvailable;
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: WorkflowError[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorLog.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(-10)
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

export const workflowErrorHandler = new WorkflowErrorHandler();