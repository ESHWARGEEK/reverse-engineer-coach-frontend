import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/Button';
import { createErrorBoundaryHandler, systemHealthMonitor, ServiceDegradationInfo } from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  enableRecovery?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  degradationInfo: Record<string, ServiceDegradationInfo>;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorHandler: (error: Error, errorInfo: ErrorInfo) => void;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      systemHealth: 'unknown',
      degradationInfo: {},
    };

    // Create error handler with component context
    this.errorHandler = createErrorBoundaryHandler(
      props.componentName || 'ErrorBoundary',
      {
        enableRecovery: props.enableRecovery !== false,
        enableReporting: true,
      }
    );
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Call enhanced error handler
    this.errorHandler(error, errorInfo);

    // Check system health after error
    await this.checkSystemHealth();

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  async componentDidMount() {
    // Initial health check
    await this.checkSystemHealth();
    
    // Set up periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.checkSystemHealth();
    }, 30000); // Check every 30 seconds
  }

  componentWillUnmount() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  checkSystemHealth = async () => {
    try {
      const health = await systemHealthMonitor.checkSystemHealth();
      this.setState({
        systemHealth: health.status,
        degradationInfo: health.degradation_strategies || {},
      });
    } catch (error) {
      console.warn('Health check failed:', error);
      this.setState({
        systemHealth: 'unhealthy',
        degradationInfo: {},
      });
    }
  };

  handleRetry = async () => {
    this.setState({ isRecovering: true });
    
    try {
      // Check system health before retry
      await this.checkSystemHealth();
      
      // Wait a moment for any recovery processes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
      });
    } catch (error) {
      console.error('Recovery failed:', error);
      this.setState({ isRecovering: false });
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  renderSystemStatus = () => {
    const { systemHealth, degradationInfo } = this.state;
    
    if (systemHealth === 'healthy') {
      return (
        <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
          <span className="w-4 h-4 text-green-400">📶</span>
          All systems operational
        </div>
      );
    }
    
    if (systemHealth === 'degraded') {
      return (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-2">
            <span className="w-4 h-4 text-yellow-400">⚠️</span>
            Some services are experiencing issues
          </div>
          {Object.entries(degradationInfo).map(([service, info]) => (
            <div key={service} className="text-xs text-gray-400 mb-1">
              <strong>{service}:</strong> {info.message}
            </div>
          ))}
        </div>
      );
    }
    
    if (systemHealth === 'unhealthy') {
      return (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
          <span className="w-4 h-4 text-red-400">❌</span>
          Multiple services are unavailable
        </div>
      );
    }
    
    return null;
  };

  renderRecoveryOptions = () => {
    const { systemHealth } = this.state;
    
    // Show different recovery options based on system health
    const recoveryActions = [];
    
    if (systemHealth === 'healthy' || systemHealth === 'degraded') {
      recoveryActions.push(
        <Button
          key="retry"
          onClick={this.handleRetry}
          className="flex-1 flex items-center justify-center gap-2"
          variant="primary"
          disabled={this.state.isRecovering}
        >
          <span className={`w-4 h-4 ${this.state.isRecovering ? 'animate-spin' : ''}`}>🔄</span>
          {this.state.isRecovering ? 'Recovering...' : 'Try Again'}
        </Button>
      );
    }
    
    recoveryActions.push(
      <Button
        key="reload"
        onClick={this.handleReload}
        className="flex-1 flex items-center justify-center gap-2"
        variant="secondary"
      >
        <span className="w-4 h-4">🔄</span>
        Reload Page
      </Button>
    );
    
    recoveryActions.push(
      <Button
        key="home"
        onClick={this.handleGoHome}
        className="flex-1 flex items-center justify-center gap-2"
        variant="secondary"
      >
        <span className="w-4 h-4">🏠</span>
        Go Home
      </Button>
    );
    
    return recoveryActions;
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with enhanced recovery options
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            
            <h1 className="text-xl font-semibold text-white text-center mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-400 text-center mb-4">
              We encountered an unexpected error. The system status is shown below.
            </p>

            {/* System health status */}
            {this.renderSystemStatus()}

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-gray-900 rounded border border-gray-600">
                <summary className="text-sm text-gray-300 cursor-pointer mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-400 whitespace-pre-wrap overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Recovery suggestions based on system health */}
            {Object.keys(this.state.degradationInfo).length > 0 && (
              <div className="mb-4 p-3 bg-yellow-900/20 rounded border border-yellow-700/50">
                <h3 className="text-sm font-medium text-yellow-400 mb-2">Recovery Information</h3>
                {Object.entries(this.state.degradationInfo).map(([service, info]) => (
                  <div key={service} className="text-xs text-gray-300 mb-2">
                    <div className="font-medium">{service} service:</div>
                    <ul className="list-disc list-inside ml-2 text-gray-400">
                      {info.recovery_actions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Recovery action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {this.renderRecoveryOptions()}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This will be caught by the nearest error boundary
    throw error;
  };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};