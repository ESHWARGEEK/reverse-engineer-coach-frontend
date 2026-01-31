/**
 * useAIAgentStatus - Hook for managing AI agent status and real-time updates
 * 
 * Features:
 * - Real-time status polling
 * - WebSocket connection management
 * - Agent operation tracking
 * - Error handling and recovery
 * - Progress calculation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIAgent, AgentOperation, AgentLogEntry } from '../components/workflow/AIAgentStatusDisplay';

export interface AIAgentStatusConfig {
  workflowId: string;
  pollingInterval?: number;
  enableWebSocket?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
}

export interface AIAgentStatusHook {
  agents: AIAgent[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  retryOperation: (agentId: string, operationId: string) => Promise<void>;
  cancelOperation: (agentId: string, operationId: string) => Promise<void>;
  restartAgent: (agentId: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

// Mock data for development - in production, this would come from the backend
const createMockAgents = (workflowId: string): AIAgent[] => [
  {
    id: 'repository-discovery',
    name: 'Repository Discovery Agent',
    description: 'Finding relevant repositories based on your preferences',
    status: 'running',
    currentOperation: 'search-repositories',
    operations: [
      {
        id: 'generate-queries',
        name: 'Generate Search Queries',
        description: 'Using AI to generate intelligent search queries',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 30000),
        endTime: new Date(Date.now() - 25000),
        estimatedDuration: 10,
        logs: [
          {
            id: 'log-1',
            timestamp: new Date(Date.now() - 29000),
            level: 'info',
            message: 'Analyzing user preferences and technologies'
          },
          {
            id: 'log-2',
            timestamp: new Date(Date.now() - 27000),
            level: 'info',
            message: 'Generated 5 search queries using LLM'
          },
          {
            id: 'log-3',
            timestamp: new Date(Date.now() - 25000),
            level: 'info',
            message: 'Query generation completed successfully'
          }
        ]
      },
      {
        id: 'search-repositories',
        name: 'Search Repositories',
        description: 'Searching GitHub for repositories matching your criteria',
        status: 'running',
        progress: 65,
        startTime: new Date(Date.now() - 25000),
        estimatedDuration: 30,
        logs: [
          {
            id: 'log-4',
            timestamp: new Date(Date.now() - 24000),
            level: 'info',
            message: 'Starting repository search with 5 queries'
          },
          {
            id: 'log-5',
            timestamp: new Date(Date.now() - 20000),
            level: 'info',
            message: 'Found 127 repositories from initial search'
          },
          {
            id: 'log-6',
            timestamp: new Date(Date.now() - 15000),
            level: 'info',
            message: 'Applying quality filters and deduplication'
          },
          {
            id: 'log-7',
            timestamp: new Date(Date.now() - 10000),
            level: 'info',
            message: 'Analyzing repository metadata and quality metrics'
          }
        ]
      },
      {
        id: 'rank-repositories',
        name: 'Rank Repositories',
        description: 'Scoring and ranking repositories by learning value',
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        estimatedDuration: 20,
        logs: []
      }
    ],
    overallProgress: 55,
    estimatedTimeRemaining: 45,
    capabilities: ['GitHub API', 'LLM Integration', 'Quality Assessment']
  },
  {
    id: 'repository-analysis',
    name: 'Repository Analysis Agent',
    description: 'Analyzing repository structure and learning opportunities',
    status: 'idle',
    operations: [
      {
        id: 'analyze-structure',
        name: 'Analyze Structure',
        description: 'Examining repository architecture and organization',
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        estimatedDuration: 45,
        logs: []
      },
      {
        id: 'detect-patterns',
        name: 'Detect Patterns',
        description: 'Identifying architectural patterns and design principles',
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        estimatedDuration: 60,
        logs: []
      },
      {
        id: 'assess-complexity',
        name: 'Assess Complexity',
        description: 'Evaluating code complexity for skill level matching',
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        estimatedDuration: 30,
        logs: []
      }
    ],
    overallProgress: 0,
    capabilities: ['Code Analysis', 'Pattern Detection', 'Complexity Assessment']
  },
  {
    id: 'curriculum-generation',
    name: 'Curriculum Generation Agent',
    description: 'Creating personalized learning curriculum',
    status: 'idle',
    operations: [
      {
        id: 'generate-objectives',
        name: 'Generate Learning Objectives',
        description: 'Creating personalized learning objectives',
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        estimatedDuration: 20,
        logs: []
      },
      {
        id: 'create-modules',
        name: 'Create Learning Modules',
        description: 'Structuring content into learning modules',
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        estimatedDuration: 90,
        logs: []
      },
      {
        id: 'generate-tasks',
        name: 'Generate Tasks',
        description: 'Creating specific learning tasks and exercises',
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        estimatedDuration: 60,
        logs: []
      }
    ],
    overallProgress: 0,
    capabilities: ['LLM Integration', 'Curriculum Design', 'Task Generation']
  }
];

export const useAIAgentStatus = (config: AIAgentStatusConfig): AIAgentStatusHook => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  
  const {
    workflowId,
    pollingInterval = 2000,
    enableWebSocket = false,
    autoRetry = true,
    maxRetries = 3
  } = config;

  // Fetch agent status from backend
  const fetchAgentStatus = useCallback(async (): Promise<AIAgent[]> => {
    try {
      // In production, this would be an actual API call
      // const response = await fetch(`/api/workflows/${workflowId}/agents`);
      // const data = await response.json();
      // return data.agents;
      
      // For now, return mock data with simulated progress
      return createMockAgents(workflowId);
    } catch (err) {
      throw new Error(`Failed to fetch agent status: ${err}`);
    }
  }, [workflowId]);

  // Update agent status
  const refreshStatus = useCallback(async () => {
    try {
      setError(null);
      const updatedAgents = await fetchAgentStatus();
      setAgents(updatedAgents);
      setIsConnected(true);
      retryCountRef.current = 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsConnected(false);
      
      // Auto-retry logic
      if (autoRetry && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(refreshStatus, 5000 * retryCountRef.current); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchAgentStatus, autoRetry, maxRetries]);

  // Start polling for status updates
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(refreshStatus, pollingInterval);
  }, [refreshStatus, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket) return;

    try {
      // In production, this would connect to the actual WebSocket endpoint
      // wsRef.current = new WebSocket(`ws://localhost:8000/ws/workflows/${workflowId}/agents`);
      
      // Mock WebSocket behavior
      const mockWs = {
        onopen: () => {
          setIsConnected(true);
          setError(null);
        },
        onmessage: (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'agent_update') {
              setAgents(prevAgents => 
                prevAgents.map(agent => 
                  agent.id === data.agentId ? { ...agent, ...data.updates } : agent
                )
              );
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        },
        onerror: () => {
          setError('WebSocket connection failed');
          setIsConnected(false);
        },
        onclose: () => {
          setIsConnected(false);
          // Auto-reconnect
          if (autoRetry) {
            setTimeout(connectWebSocket, 5000);
          }
        },
        close: () => {},
        send: () => {},
        readyState: 1,
        url: '',
        protocol: '',
        extensions: '',
        bufferedAmount: 0,
        binaryType: 'blob' as BinaryType,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
      } as WebSocket;

      wsRef.current = mockWs;
      
      // Simulate connection
      setTimeout(() => {
        if (mockWs.onopen) {
          mockWs.onopen({} as Event);
        }
      }, 100);
      
    } catch (err) {
      setError('Failed to establish WebSocket connection');
      setIsConnected(false);
    }
  }, [workflowId, enableWebSocket, autoRetry]);

  // Retry a failed operation
  const retryOperation = useCallback(async (agentId: string, operationId: string) => {
    try {
      // In production, this would make an API call
      // await fetch(`/api/workflows/${workflowId}/agents/${agentId}/operations/${operationId}/retry`, {
      //   method: 'POST'
      // });
      
      // Mock retry behavior
      setAgents(prevAgents =>
        prevAgents.map(agent =>
          agent.id === agentId
            ? {
                ...agent,
                operations: agent.operations.map(op =>
                  op.id === operationId
                    ? { ...op, status: 'pending' as const, error: undefined }
                    : op
                )
              }
            : agent
        )
      );
      
      // Simulate operation restart
      setTimeout(() => {
        setAgents(prevAgents =>
          prevAgents.map(agent =>
            agent.id === agentId
              ? {
                  ...agent,
                  operations: agent.operations.map(op =>
                    op.id === operationId
                      ? { ...op, status: 'running' as const, progress: 0 }
                      : op
                  )
                }
              : agent
          )
        );
      }, 1000);
      
    } catch (err) {
      setError(`Failed to retry operation: ${err}`);
    }
  }, [workflowId]);

  // Cancel a running operation
  const cancelOperation = useCallback(async (agentId: string, operationId: string) => {
    try {
      // In production, this would make an API call
      // await fetch(`/api/workflows/${workflowId}/agents/${agentId}/operations/${operationId}/cancel`, {
      //   method: 'POST'
      // });
      
      // Mock cancel behavior
      setAgents(prevAgents =>
        prevAgents.map(agent =>
          agent.id === agentId
            ? {
                ...agent,
                operations: agent.operations.map(op =>
                  op.id === operationId
                    ? { ...op, status: 'cancelled' as const, endTime: new Date() }
                    : op
                )
              }
            : agent
        )
      );
      
    } catch (err) {
      setError(`Failed to cancel operation: ${err}`);
    }
  }, [workflowId]);

  // Restart an agent
  const restartAgent = useCallback(async (agentId: string) => {
    try {
      // In production, this would make an API call
      // await fetch(`/api/workflows/${workflowId}/agents/${agentId}/restart`, {
      //   method: 'POST'
      // });
      
      // Mock restart behavior
      setAgents(prevAgents =>
        prevAgents.map(agent =>
          agent.id === agentId
            ? {
                ...agent,
                status: 'initializing' as const,
                error: undefined,
                overallProgress: 0,
                operations: agent.operations.map(op => ({
                  ...op,
                  status: 'pending' as const,
                  progress: 0,
                  error: undefined,
                  logs: []
                }))
              }
            : agent
        )
      );
      
      // Simulate agent restart
      setTimeout(() => {
        setAgents(prevAgents =>
          prevAgents.map(agent =>
            agent.id === agentId
              ? { ...agent, status: 'running' as const }
              : agent
          )
        );
      }, 2000);
      
    } catch (err) {
      setError(`Failed to restart agent: ${err}`);
    }
  }, [workflowId]);

  // Initialize and cleanup
  useEffect(() => {
    // Initial load
    refreshStatus();
    
    // Start polling or WebSocket connection
    if (enableWebSocket) {
      connectWebSocket();
    } else {
      startPolling();
    }
    
    return () => {
      stopPolling();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [refreshStatus, enableWebSocket, connectWebSocket, startPolling, stopPolling]);

  // Simulate progress updates for demo
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setAgents(prevAgents =>
        prevAgents.map(agent => {
          if (agent.status !== 'running') return agent;
          
          const updatedOperations = agent.operations.map(op => {
            if (op.status === 'running' && op.progress < 100) {
              const increment = Math.random() * 10;
              const newProgress = Math.min(100, op.progress + increment);
              
              // Add a log entry occasionally
              const shouldAddLog = Math.random() < 0.3;
              const newLogs = shouldAddLog ? [
                ...op.logs,
                {
                  id: `log-${Date.now()}`,
                  timestamp: new Date(),
                  level: 'info' as const,
                  message: `Progress: ${Math.round(newProgress)}% complete`
                }
              ] : op.logs;
              
              return {
                ...op,
                progress: newProgress,
                logs: newLogs,
                ...(newProgress >= 100 && {
                  status: 'completed' as const,
                  endTime: new Date()
                })
              };
            }
            return op;
          });
          
          // Calculate overall progress
          const totalProgress = updatedOperations.reduce((sum, op) => sum + op.progress, 0);
          const overallProgress = totalProgress / updatedOperations.length;
          
          // Update agent status based on operations
          let newStatus: AIAgent['status'] = agent.status;
          if (updatedOperations.every(op => op.status === 'completed')) {
            newStatus = 'completed';
          } else if (updatedOperations.some(op => op.status === 'failed')) {
            newStatus = 'failed';
          } else if (updatedOperations.some(op => op.status === 'running')) {
            newStatus = 'running';
          }
          
          return {
            ...agent,
            operations: updatedOperations,
            overallProgress,
            status: newStatus,
            estimatedTimeRemaining: newStatus === 'running' ? Math.max(0, agent.estimatedTimeRemaining! - 1) : undefined
          };
        })
      );
    }, 3000);
    
    return () => clearInterval(progressInterval);
  }, []);

  return {
    agents,
    isConnected,
    isLoading,
    error,
    retryOperation,
    cancelOperation,
    restartAgent,
    refreshStatus,
    startPolling,
    stopPolling
  };
};