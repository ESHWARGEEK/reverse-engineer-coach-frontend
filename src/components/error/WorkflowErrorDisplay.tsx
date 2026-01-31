/**
 * WorkflowErrorDisplay - User-friendly error display with recovery options
 * 
 * Features:
 * - Clear error messaging with helpful context
 * - Multiple recovery action buttons
 * - Fallback workflow options
 * - Error reporting functionality
 * - Progressive disclosure of technical details
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { WorkflowError } from '../../services/WorkflowErrorHandler';

export interface WorkflowErrorDisplayProps {
  error: WorkflowError;
  userMessage: string;
  actions: Array<{ label: string; action: () => Promise<void> }>;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
  className?: string;
}

export const WorkflowErrorDisplay: React.FC<WorkflowErrorDisplayProps> = ({
  error,
  userMessage,
  actions,
  onDismiss,
  showTechnicalDetails = false,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);

  const handleActionClick = async (action: { label: string; action: () => Promise<void> }) => {
    setIsExecutingAction(action.label);
    try {
      await action.action();
    } catch (actionError) {
      console.error('Error executing recovery action:', actionError);
    } finally {
      setIsExecutingAction(null);
    }
  };

  const getErrorIcon = () => {
    switch (error.severity) {
      case 'low':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'high':
      case 'critical':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getErrorBorderColor = () => {
    switch (error.severity) {
      case 'low': return 'border-yellow-300';
      case 'medium': return 'border-orange-300';
      case 'high': return 'border-red-300';
      case 'critical': return 'border-red-500';
      default: return 'border-gray-300';
    }
  };

  const getErrorBackgroundColor = () => {
    switch (error.severity) {
      case 'low': return 'bg-yellow-50';
      case 'medium': return 'bg-orange-50';
      case 'high': return 'bg-red-50';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${getErrorBorderColor()} ${getErrorBackgroundColor()} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          {getErrorIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {error.severity === 'critical' ? 'Critical Error' :
               error.severity === 'high' ? 'Error' :
               error.severity === 'medium' ? 'Issue Detected' :
               'Minor Issue'}
            </h3>
            <p className="text-gray-700 mt-1">{userMessage}</p>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error Context */}
      {error.step && (
        <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Step:</span> {error.step}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Time:</span> {error.timestamp.toLocaleString()}
          </p>
        </div>
      )}

      {/* Recovery Actions */}
      {actions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">What would you like to do?</h4>
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                onClick={() => handleActionClick(action)}
                variant={index === 0 ? 'primary' : 'secondary'}
                size="sm"
                disabled={isExecutingAction !== null}
                className={isExecutingAction === action.label ? 'opacity-50' : ''}
              >
                {isExecutingAction === action.label ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Working...</span>
                  </div>
                ) : (
                  action.label
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details Toggle */}
      {showTechnicalDetails && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>{showDetails ? 'Hide' : 'Show'} Technical Details</span>
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-gray-100 rounded-lg">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Error ID:</span>
                  <span className="ml-2 font-mono text-gray-600">{error.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600">{error.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Severity:</span>
                  <span className="ml-2 text-gray-600">{error.severity}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Recoverable:</span>
                  <span className="ml-2 text-gray-600">{error.recoverable ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Retryable:</span>
                  <span className="ml-2 text-gray-600">{error.retryable ? 'Yes' : 'No'}</span>
                </div>
                {error.details && (
                  <div>
                    <span className="font-medium text-gray-700">Details:</span>
                    <pre className="ml-2 mt-1 text-xs text-gray-600 bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(error.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Need more help?</p>
            <p>
              If this problem persists, you can{' '}
              <button className="underline hover:no-underline">
                contact support
              </button>{' '}
              or{' '}
              <button className="underline hover:no-underline">
                report this issue
              </button>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowErrorDisplay;