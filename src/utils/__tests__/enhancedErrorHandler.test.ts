/**
 * Comprehensive tests for the enhanced error handling system.
 * Tests error handling, recovery mechanisms, and user experience integration.
 */

import { AxiosError } from 'axios';
import {
  EnhancedErrorHandler,
  enhancedErrorHandler,
  handleAuthenticationError,
  handleServiceError,
  handleValidationError,
  NetworkMonitor,
  networkMonitor,
  setToastInstance,
  ErrorCategory,
  ErrorSeverity,
  APIErrorResponse
} from '../enhancedErrorHandler';

// Mock toast instance
const mockToast = {
  showError: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn(),
  showSuccess: jest.fn()
};

// Mock auth store
const mockAuthStore = {
  refreshToken: jest.fn()
};

// Mock window.location
const mockLocation = {
  href: ''
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('EnhancedErrorHandler', () => {
  let errorHandler: EnhancedErrorHandler;

  beforeEach(() => {
    errorHandler = new EnhancedErrorHandler();
    setToastInstance(mockToast);
    jest.clearAllMocks();
  });

  describe('Error Parsing', () => {
    it('should parse Axios errors correctly', async () => {
      const axiosError = new AxiosError('Request failed');
      axiosError.response = {
        status: 401,
        data: {
          error: {
            message: 'Authentication required',
            code: 'AUTH_REQUIRED',
            category: 'authentication',
            timestamp: new Date().toISOString()
          }
        }
      } as any;

      const result = await errorHandler.handleError(axiosError);

      expect(result.handled).toBe(true);
      expect(result.userMessage).toContain('Authentication required');
    });

    it('should parse generic errors correctly', async () => {
      const genericError = new Error('Something went wrong');

      const result = await errorHandler.handleError(genericError);

      expect(result.handled).toBe(true);
      expect(result.userMessage).toBe('Something went wrong');
    });

    it('should handle unknown errors gracefully', async () => {
      const unknownError = 'string error';

      const result = await errorHandler.handleError(unknownError);

      expect(result.handled).toBe(true);
      expect(result.userMessage).toBe('An unknown error occurred');
    });
  });

  describe('Error Categorization', () => {
    it('should categorize authentication errors correctly', async () => {
      const authError = new AxiosError('Unauthorized');
      authError.response = {
        status: 401,
        data: { message: 'Unauthorized' }
      } as any;

      await errorHandler.handleError(authError);

      expect(mockToast.showError).toHaveBeenCalledWith(
        'Authentication Required',
        expect.any(String)
      );
    });

    it('should categorize validation errors correctly', async () => {
      const validationError = new AxiosError('Validation failed');
      validationError.response = {
        status: 422,
        data: {
          error: {
            message: 'Validation failed',
            field_errors: {
              email: 'Invalid email format',
              password: 'Password too short'
            }
          }
        }
      } as any;

      await errorHandler.handleError(validationError);

      expect(mockToast.showError).toHaveBeenCalledWith(
        'Invalid Input',
        expect.stringContaining('email: Invalid email format')
      );
    });

    it('should categorize rate limit errors correctly', async () => {
      const rateLimitError = new AxiosError('Rate limited');
      rateLimitError.response = {
        status: 429,
        data: { message: 'Too many requests' }
      } as any;

      await errorHandler.handleError(rateLimitError);

      expect(mockToast.showWarning).toHaveBeenCalledWith(
        'Rate Limited',
        expect.any(String)
      );
    });

    it('should categorize service errors correctly', async () => {
      const serviceError = new AxiosError('Service unavailable');
      serviceError.response = {
        status: 503,
        data: {
          error: {
            message: 'GitHub service unavailable',
            details: { service: 'github' }
          }
        }
      } as any;

      await errorHandler.handleError(serviceError);

      expect(mockToast.showWarning).toHaveBeenCalledWith(
        'GitHub Service Issue',
        expect.any(String)
      );
    });
  });

  describe('Recovery Strategies', () => {
    it('should attempt token refresh for authentication errors', async () => {
      // Mock successful token refresh
      mockAuthStore.refreshToken.mockResolvedValue({ success: true });

      // Mock dynamic import
      jest.doMock('../store/authStore', () => ({
        useAuthStore: {
          getState: () => mockAuthStore
        }
      }));

      const authError: APIErrorResponse = {
        error: {
          message: 'Token expired',
          code: 'EXPIRED_TOKEN',
          category: 'authentication',
          timestamp: new Date().toISOString(),
          recovery: {
            strategy: 'token_refresh',
            user_message: 'Session expired',
            actions: ['Refresh token'],
            retry_enabled: true
          }
        }
      };

      const result = await errorHandler.handleError(authError, undefined, {
        enableRecovery: true
      });

      expect(result.recovery).toBeDefined();
      expect(result.recovery.success).toBe(true);
      expect(result.recovery.action).toBe('token_refreshed');
    });

    it('should handle rate limit backoff', async () => {
      const rateLimitError: APIErrorResponse = {
        error: {
          message: 'Rate limited',
          code: 'RATE_LIMIT_EXCEEDED',
          category: 'rate_limit',
          timestamp: new Date().toISOString(),
          recovery: {
            strategy: 'rate_limit_backoff',
            user_message: 'Please wait',
            actions: ['Wait'],
            retry_enabled: true
          },
          details: {
            retry_after: 1 // Use 1 second for testing
          }
        }
      };

      const startTime = Date.now();
      const result = await errorHandler.handleError(rateLimitError, undefined, {
        enableRecovery: true
      });
      const endTime = Date.now();

      expect(result.recovery).toBeDefined();
      expect(result.recovery.success).toBe(true);
      expect(result.recovery.action).toBe('retry_after_delay');
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000); // Should wait at least 1 second
    });

    it('should handle network retry with exponential backoff', async () => {
      const networkError: APIErrorResponse = {
        error: {
          message: 'Network error',
          code: 'NETWORK_ERROR',
          category: 'network',
          timestamp: new Date().toISOString(),
          recovery: {
            strategy: 'network_retry',
            user_message: 'Network issue',
            actions: ['Retry'],
            retry_enabled: true
          }
        }
      };

      const context = { retry_count: 1, max_retries: 3 };
      const result = await errorHandler.handleError(networkError, context, {
        enableRecovery: true
      });

      expect(result.recovery).toBeDefined();
      expect(result.recovery.success).toBe(true);
      expect(result.recovery.action).toBe('retry');
      expect(result.recovery.attempt).toBe(2);
    });

    it('should stop retrying after max attempts', async () => {
      const networkError: APIErrorResponse = {
        error: {
          message: 'Network error',
          code: 'NETWORK_ERROR',
          category: 'network',
          timestamp: new Date().toISOString(),
          recovery: {
            strategy: 'network_retry',
            user_message: 'Network issue',
            actions: ['Retry'],
            retry_enabled: true
          }
        }
      };

      const context = { retry_count: 3, max_retries: 3 };
      const result = await errorHandler.handleError(networkError, context, {
        enableRecovery: true
      });

      expect(result.recovery).toBeDefined();
      expect(result.recovery.success).toBe(false);
      expect(result.recovery.action).toBe('max_retries_exceeded');
    });
  });

  describe('Error Statistics', () => {
    it('should track error patterns', async () => {
      const error1 = new AxiosError('Error 1');
      error1.response = { status: 500 } as any;

      const error2 = new AxiosError('Error 2');
      error2.response = { status: 500 } as any;

      await errorHandler.handleError(error1);
      await errorHandler.handleError(error2);

      const stats = errorHandler.getErrorStatistics();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });

    it('should clear error patterns', async () => {
      const error = new AxiosError('Test error');
      error.response = { status: 500 } as any;

      await errorHandler.handleError(error);
      
      let stats = errorHandler.getErrorStatistics();
      expect(Object.keys(stats).length).toBeGreaterThan(0);

      errorHandler.clearErrorPatterns();
      
      stats = errorHandler.getErrorStatistics();
      expect(Object.keys(stats).length).toBe(0);
    });
  });

  describe('Retry Execution', () => {
    it('should execute operation with retry on failure', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await errorHandler.executeWithRetry(operation, undefined, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        errorHandler.executeWithRetry(operation, undefined, 2)
      ).rejects.toThrow('Persistent failure');

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});

describe('NetworkMonitor', () => {
  let monitor: NetworkMonitor;
  let mockNavigator: any;

  beforeEach(() => {
    // Mock navigator.onLine
    mockNavigator = {
      onLine: true
    };
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    monitor = new NetworkMonitor();
    setToastInstance(mockToast);
    jest.clearAllMocks();
  });

  it('should detect online status', () => {
    expect(monitor.online).toBe(true);
  });

  it('should handle online/offline events', () => {
    const statusListener = jest.fn();
    const unsubscribe = monitor.onStatusChange(statusListener);

    // Simulate going offline
    mockNavigator.onLine = false;
    window.dispatchEvent(new Event('offline'));

    expect(statusListener).toHaveBeenCalledWith(false);
    expect(mockToast.showWarning).toHaveBeenCalledWith(
      'Connection Lost',
      expect.any(String)
    );

    // Simulate going online
    mockNavigator.onLine = true;
    window.dispatchEvent(new Event('online'));

    expect(statusListener).toHaveBeenCalledWith(true);
    expect(mockToast.showSuccess).toHaveBeenCalledWith(
      'Connection Restored',
      expect.any(String)
    );

    unsubscribe();
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    setToastInstance(mockToast);
    jest.clearAllMocks();
  });

  describe('handleAuthenticationError', () => {
    it('should handle authentication errors with recovery', async () => {
      const authError = new AxiosError('Unauthorized');
      authError.response = {
        status: 401,
        data: { message: 'Authentication required' }
      } as any;

      const result = await handleAuthenticationError(authError);

      expect(result.handled).toBe(true);
      expect(mockToast.showError).toHaveBeenCalled();
    });
  });

  describe('handleServiceError', () => {
    it('should handle service errors with context', async () => {
      const serviceError = new AxiosError('Service unavailable');
      serviceError.response = {
        status: 503,
        data: { message: 'GitHub service unavailable' }
      } as any;

      const result = await handleServiceError(serviceError, 'GitHub');

      expect(result.handled).toBe(true);
      expect(mockToast.showWarning).toHaveBeenCalled();
    });
  });

  describe('handleValidationError', () => {
    it('should handle validation errors without recovery', async () => {
      const validationError = new AxiosError('Validation failed');
      validationError.response = {
        status: 422,
        data: {
          error: {
            field_errors: {
              email: 'Invalid format'
            }
          }
        }
      } as any;

      const result = await handleValidationError(validationError);

      expect(result.handled).toBe(true);
      expect(result.shouldRetry).toBe(false);
      expect(mockToast.showError).toHaveBeenCalled();
    });
  });
});

describe('Error Handler Integration', () => {
  beforeEach(() => {
    setToastInstance(mockToast);
    jest.clearAllMocks();
  });

  it('should handle complex error scenarios', async () => {
    // Simulate a complex error with multiple recovery strategies
    const complexError: APIErrorResponse = {
      error: {
        message: 'Multiple service failures',
        code: 'COMPLEX_ERROR',
        category: 'service_unavailable',
        timestamp: new Date().toISOString(),
        recovery: {
          strategy: 'service_fallback',
          user_message: 'Services temporarily limited',
          actions: ['Use cached data', 'Retry later'],
          retry_enabled: true
        },
        details: {
          service: 'github',
          limitations: ['No real-time updates', 'Cached data only']
        }
      }
    };

    const result = await enhancedErrorHandler.handleError(complexError, undefined, {
      enableRecovery: true,
      showToast: true
    });

    expect(result.handled).toBe(true);
    expect(result.recovery).toBeDefined();
    expect(result.recovery.success).toBe(true);
    expect(result.recovery.action).toBe('fallback_mode');
    expect(mockToast.showWarning).toHaveBeenCalled();
  });

  it('should handle silent errors without toasts', async () => {
    const error = new Error('Silent error');

    const result = await enhancedErrorHandler.handleError(error, undefined, {
      silent: true,
      showToast: false
    });

    expect(result.handled).toBe(true);
    expect(mockToast.showError).not.toHaveBeenCalled();
  });

  it('should handle errors with custom context', async () => {
    const error = new AxiosError('Context error');
    error.response = { status: 500 } as any;

    const context = {
      endpoint: '/api/test',
      method: 'POST',
      user_id: 'test_user',
      retry_count: 1
    };

    const result = await enhancedErrorHandler.handleError(error, context);

    expect(result.handled).toBe(true);
    // Context should be used for error analysis and logging
  });
});