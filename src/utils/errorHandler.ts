import { AxiosError } from 'axios';
import React from 'react';

export interface APIError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface ServiceDegradationInfo {
  strategy: string;
  message: string;
  limitations: string[];
  recovery_actions: string[];
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, { status: string; error?: string }>;
  degradation_strategies?: Record<string, ServiceDegradationInfo>;
  timestamp: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  enableRetry?: boolean;
  maxRetries?: number;
  silent?: boolean;
}

export class ServiceError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: any;
  public readonly retryable: boolean;
  public readonly degradationInfo?: ServiceDegradationInfo;

  constructor(
    message: string, 
    status: number = 500, 
    code?: string, 
    details?: any,
    retryable: boolean = false,
    degradationInfo?: ServiceDegradationInfo
  ) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.degradationInfo = degradationInfo;
  }
}

// System health monitoring
class SystemHealthMonitor {
  private healthStatus: SystemHealthStatus | null = null;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds
  
  async checkSystemHealth(): Promise<SystemHealthStatus> {
    const now = Date.now();
    
    // Use cached health status if recent
    if (this.healthStatus && (now - this.lastHealthCheck) < this.healthCheckInterval) {
      return this.healthStatus;
    }
    
    try {
      const response = await fetch('/health');
      const healthData = await response.json();
      
      this.healthStatus = healthData;
      this.lastHealthCheck = now;
      
      return healthData;
    } catch (error) {
      // Fallback health status on error
      const fallbackStatus: SystemHealthStatus = {
        status: 'unhealthy',
        services: {
          api: { status: 'unhealthy', error: 'Cannot reach API' }
        },
        timestamp: new Date().toISOString()
      };
      
      this.healthStatus = fallbackStatus;
      this.lastHealthCheck = now;
      
      return fallbackStatus;
    }
  }
  
  getDegradationInfo(serviceName: string): ServiceDegradationInfo | null {
    return this.healthStatus?.degradation_strategies?.[serviceName] || null;
  }
  
  isServiceHealthy(serviceName: string): boolean {
    return this.healthStatus?.services[serviceName]?.status === 'healthy';
  }
}

export const systemHealthMonitor = new SystemHealthMonitor();

// Enhanced toast integration
let toastStore: any = null;

export const initializeErrorHandler = () => {
  // Simple initialization without Zustand
  console.log('Error handler initialized');
};

const showErrorToast = (title: string, message?: string, options?: any) => {
  if (toastStore) {
    toastStore.showError(title, message, options);
  } else {
    // Fallback to console if toast store not available
    console.error(`${title}: ${message}`);
  }
};

const showWarningToast = (title: string, message?: string, options?: any) => {
  if (toastStore) {
    toastStore.showWarning(title, message, options);
  } else {
    console.warn(`${title}: ${message}`);
  }
};

const showInfoToast = (title: string, message?: string, options?: any) => {
  if (toastStore) {
    toastStore.showInfo(title, message, options);
  } else {
    console.info(`${title}: ${message}`);
  }
};

export const handleAPIError = (
  error: unknown,
  options: ErrorHandlerOptions = {}
): APIError => {
  const {
    showToast = false,
    logError = true,
    fallbackMessage = 'An unexpected error occurred',
    silent = false
  } = options;

  let apiError: APIError;
  let retryable = false;
  let degradationInfo: ServiceDegradationInfo | undefined;

  if (error instanceof AxiosError) {
    // Handle Axios/HTTP errors
    const status = error.response?.status || 500;
    const responseData = error.response?.data;

    // Check for service degradation information
    if (responseData?.degradation_strategies) {
      const serviceName = responseData.details?.service;
      if (serviceName && responseData.degradation_strategies[serviceName]) {
        degradationInfo = responseData.degradation_strategies[serviceName];
      }
    }

    if (status === 401) {
      apiError = {
        message: 'Authentication required. Please log in.',
        code: 'UNAUTHORIZED',
        status: 401
      };
      if (showToast && !silent) {
        showErrorToast('Authentication Required', 'Please log in to continue.');
      }
    } else if (status === 403) {
      apiError = {
        message: 'Access denied. You don\'t have permission to perform this action.',
        code: 'FORBIDDEN',
        status: 403
      };
      if (showToast && !silent) {
        showErrorToast('Access Denied', 'You don\'t have permission for this action.');
      }
    } else if (status === 404) {
      apiError = {
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        status: 404
      };
      if (showToast && !silent) {
        showErrorToast('Not Found', 'The requested resource was not found.');
      }
    } else if (status === 422) {
      // Enhanced validation error handling
      const fieldErrors = responseData?.details?.field_errors || responseData?.detail;
      let message = 'Invalid input data.';
      
      if (fieldErrors && typeof fieldErrors === 'object') {
        const errorMessages = Object.entries(fieldErrors).map(([field, error]) => 
          `${field}: ${error}`
        ).join(', ');
        message = `Validation errors: ${errorMessages}`;
      } else if (typeof fieldErrors === 'string') {
        message = fieldErrors;
      }
      
      apiError = {
        message,
        code: 'VALIDATION_ERROR',
        status: 422,
        details: fieldErrors
      };
      
      if (showToast && !silent) {
        showErrorToast('Invalid Input', message);
      }
    } else if (status === 429) {
      retryable = true;
      apiError = {
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429
      };
      if (showToast && !silent) {
        showWarningToast('Rate Limited', 'Too many requests. Please wait before trying again.');
      }
    } else if (status === 503) {
      retryable = true;
      // Service unavailable - check for specific service errors
      const serviceError = responseData?.details?.service;
      let message = 'Service temporarily unavailable. Please try again later.';
      let toastTitle = 'Service Unavailable';
      
      if (serviceError === 'github') {
        message = 'GitHub service is temporarily unavailable. Using cached data where possible.';
        toastTitle = 'GitHub Service Issue';
      } else if (serviceError === 'llm' || serviceError === 'ai') {
        message = 'AI services are temporarily limited. Some features may be simplified.';
        toastTitle = 'AI Service Limited';
      } else if (serviceError === 'database') {
        message = 'Database is temporarily unavailable. Some features may be limited.';
        toastTitle = 'Database Issue';
      }
      
      apiError = {
        message,
        code: responseData?.code || 'SERVICE_UNAVAILABLE',
        status: 503,
        details: responseData?.details
      };
      
      if (showToast && !silent) {
        if (degradationInfo) {
          showWarningToast(toastTitle, degradationInfo.message, {
            action: {
              label: 'Learn More',
              onClick: () => {
                showInfoToast('Recovery Information', 
                  `Available actions: ${degradationInfo?.recovery_actions?.join(', ') || 'None available'}`
                );
              }
            }
          });
        } else {
          showWarningToast(toastTitle, message);
        }
      }
    } else if (status >= 500) {
      apiError = {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status: status
      };
      if (showToast && !silent) {
        showErrorToast('Server Error', 'Something went wrong on our end. Please try again.');
      }
    } else {
      apiError = {
        message: responseData?.message || responseData?.detail || error.message || fallbackMessage,
        code: responseData?.code || 'API_ERROR',
        status: status,
        details: responseData
      };
      if (showToast && !silent) {
        showErrorToast('Request Failed', apiError.message);
      }
    }
  } else if (error instanceof ServiceError) {
    // Handle custom service errors
    apiError = {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    };
    
    if (showToast && !silent) {
      if (error.retryable) {
        showWarningToast('Service Issue', error.message);
      } else {
        showErrorToast('Service Error', error.message);
      }
    }
  } else if (error instanceof Error) {
    // Handle generic JavaScript errors
    apiError = {
      message: error.message || fallbackMessage,
      code: 'GENERIC_ERROR',
      status: 500
    };
    if (showToast && !silent) {
      showErrorToast('Unexpected Error', apiError.message);
    }
  } else {
    // Handle unknown errors
    apiError = {
      message: fallbackMessage,
      code: 'UNKNOWN_ERROR',
      status: 500,
      details: error
    };
    if (showToast && !silent) {
      showErrorToast('Unknown Error', fallbackMessage);
    }
  }

  // Log error if requested
  if (logError) {
    console.error('API Error:', apiError, error);
    
    // Log degradation info if available
    if (degradationInfo) {
      console.warn('Service Degradation:', degradationInfo);
    }
  }

  return apiError;
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return !error.response && error.code === 'NETWORK_ERROR';
  }
  return false;
};

export const isTimeoutError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.code === 'ECONNABORTED' || error.message.includes('timeout');
  }
  return false;
};

export const getRetryDelay = (attemptNumber: number, baseDelay: number = 1000): number => {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attemptNumber - 1);
  const jitter = Math.random() * 0.1 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
};

export const shouldRetry = (error: unknown, attemptNumber: number, maxRetries: number = 3): boolean => {
  if (attemptNumber >= maxRetries) {
    return false;
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    
    // Retry on network errors, timeouts, and 5xx server errors
    if (isNetworkError(error) || isTimeoutError(error)) {
      return true;
    }
    
    if (status && status >= 500) {
      return true;
    }
    
    // Don't retry on 4xx client errors (except 429 rate limit)
    if (status && status >= 400 && status < 500 && status !== 429) {
      return false;
    }
  }

  return true;
};

// Enhanced retry wrapper for async functions with better error handling
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  options: { 
    onRetry?: (attempt: number, error: unknown) => void;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
    exponentialBackoff?: boolean;
  } = {}
): Promise<T> => {
  const { 
    onRetry, 
    shouldRetry = defaultShouldRetry, 
    exponentialBackoff = true 
  } = options;
  
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt) || attempt === maxRetries) {
        throw error;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }

      if (attempt < maxRetries) {
        const delay = exponentialBackoff 
          ? getRetryDelay(attempt, baseDelay)
          : baseDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Enhanced should retry logic
const defaultShouldRetry = (error: unknown, attemptNumber: number): boolean => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    
    // Retry on network errors, timeouts, and 5xx server errors
    if (isNetworkError(error) || isTimeoutError(error)) {
      return true;
    }
    
    if (status && status >= 500) {
      return true;
    }
    
    // Retry on rate limits with exponential backoff
    if (status === 429) {
      return true;
    }
    
    // Don't retry on 4xx client errors (except 429)
    if (status && status >= 400 && status < 500) {
      return false;
    }
  }

  return true;
};

// Enhanced graceful degradation helper with service monitoring
export const withFallback = async <T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T> | T,
  options: { 
    logError?: boolean; 
    serviceName?: string;
    enableDegradation?: boolean;
  } = {}
): Promise<T> => {
  const { logError = true, serviceName, enableDegradation = true } = options;
  
  try {
    return await primaryFn();
  } catch (error) {
    if (logError) {
      console.warn(`Primary function failed${serviceName ? ` for ${serviceName}` : ''}, using fallback:`, error);
    }
    
    // Check for service degradation info
    if (enableDegradation && serviceName) {
      const degradationInfo = systemHealthMonitor.getDegradationInfo(serviceName);
      if (degradationInfo) {
        console.info(`Service degradation strategy for ${serviceName}:`, degradationInfo);
        
        // You could show a toast notification here about the degradation
        // showDegradationNotification(serviceName, degradationInfo);
      }
    }
    
    return await fallbackFn();
  }
};

// Service-specific error recovery strategies
export const recoverFromServiceError = async (
  error: ServiceError,
  recoveryOptions: {
    enableCache?: boolean;
    enableSimplifiedMode?: boolean;
    enableOfflineMode?: boolean;
  } = {}
): Promise<{ recovered: boolean; strategy: string; message: string }> => {
  const { enableCache = true, enableSimplifiedMode = true, enableOfflineMode = false } = recoveryOptions;
  
  // GitHub service recovery
  if (error.code === 'GITHUB_SERVICE_ERROR' && enableCache) {
    return {
      recovered: true,
      strategy: 'cache_fallback',
      message: 'Using cached repository data. Some information may be outdated.'
    };
  }
  
  // AI service recovery
  if (error.code === 'AI_SERVICE_UNAVAILABLE' && enableSimplifiedMode) {
    return {
      recovered: true,
      strategy: 'simplified_mode',
      message: 'AI features temporarily limited. Using simplified explanations.'
    };
  }
  
  // Database recovery
  if (error.code === 'DATABASE_UNAVAILABLE' && enableOfflineMode) {
    return {
      recovered: true,
      strategy: 'offline_mode',
      message: 'Running in offline mode. Changes will sync when connection is restored.'
    };
  }
  
  return {
    recovered: false,
    strategy: 'none',
    message: 'No recovery strategy available. Please try again later.'
  };
};

// Enhanced error boundary integration
export const createErrorBoundaryHandler = (
  componentName: string,
  options: {
    enableRecovery?: boolean;
    enableReporting?: boolean;
    fallbackComponent?: React.ComponentType;
  } = {}
) => {
  return (error: Error, errorInfo: React.ErrorInfo) => {
    const { enableRecovery = true, enableReporting = true } = options;
    
    // Log error with component context
    console.error(`Error in ${componentName}:`, error, errorInfo);
    
    // Report error to monitoring service (if enabled)
    if (enableReporting) {
      // reportErrorToService(error, { component: componentName, ...errorInfo });
    }
    
    // Attempt recovery if enabled
    if (enableRecovery) {
      // Implement component-specific recovery logic
      setTimeout(() => {
        // Trigger component recovery or refresh
        window.location.reload();
      }, 5000);
    }
  };
};