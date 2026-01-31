/**
 * AIAgentStatusDisplay - Real-time display of AI agent progress and operations
 * 
 * Features:
 * - Real-time progress updates via WebSocket or polling
 * - Agent operation log display
 * - Error state handling and recovery options
 * - Estimated completion time display
 * - Visual agent status indicators
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';

export interface AgentOperation {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  startTime: Date;
  endTime?: Date;
  estimatedDuration?: number; // seconds
  error?: string;
  logs: AgentLogEntry[];
  dependencies?: string[]; // IDs of operations this depends on
}

export interface AgentLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
}

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'initializing' | 'running' | 'completed' | 'failed';
  currentOperation?: string;
  operations: AgentOperation[];
  overallProgress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  error?: string;
  capabilities: string[];
}

export interface AIAgentStatusDisplayProps {
  agents: AIAgent[];
  onRetryOperation?: (agentId: string, operationId: string) => void;
  onCancelOperation?: (agentId: string, operationId: string) => void;
  onRestartAgent?: (agentId: string) => void;
  showLogs?: boolean;
  compact?: boolean;
  className?: string;
}

// Agent status colors and icons
const getAgentStatusColor = (status: AIAgent['status']) => {
  switch (status) {
    case 'idle': return 'text-gray-500 bg-gray-100';
    case 'initializing': return 'text-blue-600 bg-blue-100';
    case 'running': return 'text-green-600 bg-green-100';
    case 'completed': return 'text-green-700 bg-green-200';
    case 'failed': return 'text-red-600 bg-red-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};

const getAgentStatusIcon = (status: AIAgent['status']) => {
  switch (status) {
    case 'idle':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      );
    case 'initializing':
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'running':
      return (
        <div className="w-4 h-4 relative">
          <div className="absolute inset-0 rounded-full border-2 border-green-600 border-t-transparent animate-spin"></div>
        </div>
      );
    case 'completed':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'failed':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    default:
      return null;
  }
};

const getOperationStatusColor = (status: AgentOperation['status']) => {
  switch (status) {
    case 'pending': return 'text-gray-600 bg-gray-100';
    case 'running': return 'text-blue-600 bg-blue-100';
    case 'completed': return 'text-green-600 bg-green-100';
    case 'failed': return 'text-red-600 bg-red-100';
    case 'cancelled': return 'text-yellow-600 bg-yellow-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

const formatTimeRemaining = (seconds: number): string => {
  if (seconds < 60) return `~${Math.round(seconds)}s remaining`;
  if (seconds < 3600) return `~${Math.round(seconds / 60)}m remaining`;
  return `~${Math.round(seconds / 3600)}h remaining`;
};

// Individual Agent Display Component
const AgentDisplay: React.FC<{
  agent: AIAgent;
  onRetryOperation?: (operationId: string) => void;
  onCancelOperation?: (operationId: string) => void;
  onRestartAgent?: () => void;
  showLogs: boolean;
  compact: boolean;
}> = ({ agent, onRetryOperation, onCancelOperation, onRestartAgent, showLogs, compact }) => {
  const [expandedOperation, setExpandedOperation] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const statusColor = getAgentStatusColor(agent.status);
  const statusIcon = getAgentStatusIcon(agent.status);

  const runningOperations = agent.operations.filter(op => op.status === 'running');
  const completedOperations = agent.operations.filter(op => op.status === 'completed');
  const failedOperations = agent.operations.filter(op => op.status === 'failed');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${statusColor}`}>
            {statusIcon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-600">{agent.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {agent.estimatedTimeRemaining && agent.status === 'running' && (
            <span className="text-sm text-blue-600">
              {formatTimeRemaining(agent.estimatedTimeRemaining)}
            </span>
          )}
          
          {agent.status === 'failed' && onRestartAgent && (
            <Button
              onClick={onRestartAgent}
              variant="secondary"
              size="sm"
            >
              Restart
            </Button>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      {!compact && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(agent.overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                agent.status === 'failed' ? 'bg-red-500' : 
                agent.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${agent.overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Operation */}
      {agent.currentOperation && !compact && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-900">
              Currently: {agent.operations.find(op => op.id === agent.currentOperation)?.name || 'Processing...'}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {agent.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-900">Agent Error</p>
              <p className="text-sm text-red-700">{agent.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Operations List */}
      {!compact && agent.operations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Operations</h4>
          
          {agent.operations.map(operation => (
            <div key={operation.id} className="border border-gray-200 rounded-lg">
              <div 
                className="p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedOperation(
                  expandedOperation === operation.id ? null : operation.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOperationStatusColor(operation.status)}`}>
                      {operation.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{operation.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {operation.status === 'running' && (
                      <span className="text-xs text-gray-500">
                        {Math.round(operation.progress)}%
                      </span>
                    )}
                    
                    {operation.status === 'failed' && onRetryOperation && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryOperation(operation.id);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        Retry
                      </Button>
                    )}
                    
                    {operation.status === 'running' && onCancelOperation && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelOperation(operation.id);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    )}
                    
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedOperation === operation.id ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {operation.status === 'running' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${operation.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Expanded Operation Details */}
              {expandedOperation === operation.id && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <p className="text-sm text-gray-700 mb-3">{operation.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Started:</span> {operation.startTime.toLocaleTimeString()}
                    </div>
                    {operation.endTime && (
                      <div>
                        <span className="font-medium">Completed:</span> {operation.endTime.toLocaleTimeString()}
                      </div>
                    )}
                    {operation.estimatedDuration && (
                      <div>
                        <span className="font-medium">Est. Duration:</span> {formatDuration(operation.estimatedDuration)}
                      </div>
                    )}
                    {operation.error && (
                      <div className="col-span-2">
                        <span className="font-medium text-red-600">Error:</span> {operation.error}
                      </div>
                    )}
                  </div>
                  
                  {/* Operation Logs */}
                  {showLogs && operation.logs.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Logs</span>
                        <Button
                          onClick={() => setShowAllLogs(!showAllLogs)}
                          variant="ghost"
                          size="sm"
                        >
                          {showAllLogs ? 'Show Less' : 'Show All'}
                        </Button>
                      </div>
                      
                      <div className="bg-gray-900 rounded p-2 max-h-32 overflow-y-auto">
                        {(showAllLogs ? operation.logs : operation.logs.slice(-5)).map(log => (
                          <div key={log.id} className="text-xs font-mono mb-1">
                            <span className="text-gray-400">{log.timestamp.toLocaleTimeString()}</span>
                            <span className={`ml-2 ${
                              log.level === 'error' ? 'text-red-400' :
                              log.level === 'warning' ? 'text-yellow-400' :
                              log.level === 'info' ? 'text-blue-400' : 'text-gray-300'
                            }`}>
                              [{log.level.toUpperCase()}]
                            </span>
                            <span className="ml-2 text-white">{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Compact Summary */}
      {compact && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              {completedOperations.length}/{agent.operations.length} operations
            </span>
            {failedOperations.length > 0 && (
              <span className="text-red-600">
                {failedOperations.length} failed
              </span>
            )}
          </div>
          <span className="text-gray-600">{Math.round(agent.overallProgress)}%</span>
        </div>
      )}
    </div>
  );
};

export const AIAgentStatusDisplay: React.FC<AIAgentStatusDisplayProps> = ({
  agents,
  onRetryOperation,
  onCancelOperation,
  onRestartAgent,
  showLogs = true,
  compact = false,
  className = ''
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000); // 2 seconds

  // Auto-refresh logic (in real implementation, this would poll the backend)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // In real implementation, this would fetch updated agent status
      // For now, we'll just trigger a re-render
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const runningAgents = agents.filter(agent => agent.status === 'running');
  const completedAgents = agents.filter(agent => agent.status === 'completed');
  const failedAgents = agents.filter(agent => agent.status === 'failed');

  const handleRetryOperation = useCallback((agentId: string, operationId: string) => {
    onRetryOperation?.(agentId, operationId);
  }, [onRetryOperation]);

  const handleCancelOperation = useCallback((agentId: string, operationId: string) => {
    onCancelOperation?.(agentId, operationId);
  }, [onCancelOperation]);

  const handleRestartAgent = useCallback((agentId: string) => {
    onRestartAgent?.(agentId);
  }, [onRestartAgent]);

  return (
    <div className={`ai-agent-status-display ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Agent Status</h2>
          <p className="text-gray-600">Real-time progress of AI operations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="auto-refresh" className="text-sm text-gray-700">
              Auto-refresh
            </label>
          </div>
          
          {agents.some(agent => agent.status === 'running') && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">Running</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{runningAgents.length}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-900">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{completedAgents.length}</p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-900">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{failedAgents.length}</p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-600 mt-1">{agents.length}</p>
          </div>
        </div>
      )}

      {/* Agent List */}
      <div className="space-y-4">
        {agents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No AI agents are currently active</p>
          </div>
        ) : (
          agents.map(agent => (
            <AgentDisplay
              key={agent.id}
              agent={agent}
              onRetryOperation={(operationId) => handleRetryOperation(agent.id, operationId)}
              onCancelOperation={(operationId) => handleCancelOperation(agent.id, operationId)}
              onRestartAgent={() => handleRestartAgent(agent.id)}
              showLogs={showLogs}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AIAgentStatusDisplay;