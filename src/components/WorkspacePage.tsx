import React, { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useSimpleAppStore } from '../store/simpleStore';
import { useAuthStore } from '../store/authStore';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { TaskListPane } from './workspace/TaskListPane';
import { CodeEditorPane } from './workspace/CodeEditorPane';
import { ReferenceCodePane } from './workspace/ReferenceCodePane';
import { MenuIcon as Bars3Icon, XIcon as XMarkIcon, ChatIcon as ChatBubbleLeftRightIcon } from '@heroicons/react/outline';
import { projectAPI } from '../utils/api';
import { LearningProject } from '../store/index';
import { ProtectedRoute } from './auth/ProtectedRoute';

// Simple function to get project ID from hash
const getProjectIdFromHash = (): string | undefined => {
  const hash = window.location.hash.slice(1); // Remove #
  const match = hash.match(/^\/workspace\/(.+)$/);
  return match ? match[1] : undefined;
};

export const WorkspacePage: React.FC = () => {
  const projectId = getProjectIdFromHash();
  const { currentProject, setCurrentProject, setError } = useSimpleAppStore();
  const { user, isAuthenticated, token } = useAuthStore();
  const layout = useResponsiveLayout();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  
  // Simplified workspace state - no complex state management for now
  const [hasUnsavedChanges] = useState(false);
  
  // Show unsaved changes indicator
  const [showUnsavedIndicator, setShowUnsavedIndicator] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setShowUnsavedIndicator(hasUnsavedChanges);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [hasUnsavedChanges]);
  
  // Load user-specific project data
  useEffect(() => {
    if (!isAuthenticated || !projectId || !token) {
      return;
    }

    const loadProject = async () => {
      setIsLoadingProject(true);
      setProjectError(null);
      
      try {
        const project = await projectAPI.get(projectId) as LearningProject;
        
        // Verify user owns this project (additional client-side check)
        if (project.user_id !== user?.id) {
          setProjectError('Access denied: You can only access your own projects');
          return;
        }
        
        setCurrentProject(project);
        
        // Load enhanced workspace data if this is an enhanced project
        try {
          const { EnhancedWorkspaceIntegration } = await import('../services/EnhancedWorkspaceIntegration');
          
          if (EnhancedWorkspaceIntegration.isEnhancedProject(project)) {
            const workspaceData = await EnhancedWorkspaceIntegration.loadWorkspaceData(projectId);
            
            if (workspaceData) {
              // Initialize enhanced workspace features
              console.log('Enhanced project detected, workspace data loaded:', workspaceData);
              
              // Store enhanced data in a way that components can access it
              (window as any).enhancedWorkspaceData = workspaceData;
              
              // Initialize AI coach context if available
              if (workspaceData.aiCoachContext) {
                console.log('AI coach context available:', workspaceData.aiCoachContext);
              }
            }
          }
        } catch (enhancedError) {
          console.warn('Failed to load enhanced workspace data:', enhancedError);
          // Continue with standard workspace - enhanced features are optional
        }
        
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to load project';
        setProjectError(errorMessage);
        setError(errorMessage);
        
        // If project not found or access denied, redirect to dashboard
        if (error.status === 404 || error.status === 403) {
          setTimeout(() => {
            window.location.hash = '/dashboard';
          }, 2000);
        }
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadProject();
  }, [projectId, isAuthenticated, token, user?.id, setCurrentProject, setError]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <ProtectedRoute><div /></ProtectedRoute>;
  }

  // Show loading state while project is loading
  if (isLoadingProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your project...</p>
        </div>
      </div>
    );
  }

  // Show error state if project failed to load
  if (projectError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Project Access Error</h2>
          <p className="text-gray-400 mb-6">{projectError}</p>
          <button
            onClick={() => window.location.hash = '/dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show message if no project found
  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📁</div>
          <h2 className="text-xl font-semibold text-white mb-2">Project Not Found</h2>
          <p className="text-gray-400 mb-6">The requested project could not be found or you don't have access to it.</p>
          <button
            onClick={() => window.location.hash = '/dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // Default layout configuration
  const workspace = {
    layoutConfig: {
      leftPaneWidth: 25,
      rightPaneWidth: 33
    }
  };
  
  // Simplified chat state to avoid hook errors
  const chat = {
    messages: [],
    sendMessage: () => {},
    isLoading: false,
    isTyping: false,
    isConnected: false
  };
  
  // Handle layout persistence (simplified)
  const handleLayoutChange = (sizes: number[]) => {
    // Layout changes are handled locally for now
    console.log('Layout changed:', sizes);
  };

  // Calculate middle pane width
  const middlePaneWidth = 100 - workspace.layoutConfig.leftPaneWidth - workspace.layoutConfig.rightPaneWidth;
  
  // Get project title for display with user context
  const projectTitle = currentProject?.title || currentProject?.name || `Project ${projectId}`;
  const completionPercentage = currentProject?.completion_percentage || 0;
  const isCompleted = currentProject?.status === 'completed';
  const userEmail = user?.email || 'Unknown User';
  
  // Mobile layout with overlay panels
  if (layout.isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-white truncate">
                {projectTitle}
              </h1>
              <span className="text-xs text-gray-400">
                {userEmail}
              </span>
            </div>
            {completionPercentage > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {Math.round(completionPercentage)}%
                </span>
              </div>
            )}
            {showUnsavedIndicator && (
              <div className="flex items-center space-x-1 text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-xs">Unsaved</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 text-gray-400 hover:text-white relative"
              title="AI Coach Chat"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
              {chat.isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {showMobileMenu ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </header>
        
        <div className="flex-1 relative overflow-hidden">
          {/* Main editor area */}
          <div className="h-full bg-gray-900">
            <CodeEditorPane />
          </div>
          
          {/* Mobile overlay menu */}
          {showMobileMenu && (
            <div className="absolute inset-0 bg-black bg-opacity-50 z-10">
              <div className="bg-gray-800 h-full w-80 max-w-full overflow-y-auto">
                <TaskListPane />
              </div>
            </div>
          )}
          
          {/* Mobile chat overlay */}
          {showChat && (
            <div className="absolute inset-0 bg-black bg-opacity-50 z-20">
              <div className="bg-gray-900 h-full w-full max-w-md ml-auto border-l border-gray-700">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold text-white">AI Coach</h2>
                    <button
                      onClick={() => setShowChat(false)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 p-4 text-gray-400">
                    <p>Chat functionality will be available soon.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Desktop/Tablet layout with resizable panels
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-white">
              {projectTitle}
            </h1>
            <span className="text-sm text-gray-400">
              {userEmail} • {currentProject?.status || 'Unknown Status'}
            </span>
          </div>
          {completionPercentage > 0 && (
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-400">
                {Math.round(completionPercentage)}% Complete
              </span>
            </div>
          )}
          {showUnsavedIndicator && (
            <div className="flex items-center space-x-2 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm">Unsaved Changes</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowChat(!showChat)}
          className="p-2 text-gray-400 hover:text-white relative"
          title="AI Coach Chat"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          {chat.isConnected && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
          )}
        </button>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <PanelGroup 
          direction="horizontal" 
          onLayout={handleLayoutChange}
          className="h-full"
        >
          {/* Task List Pane - Hidden on tablet if needed */}
          {layout.showLeftPane && (
            <>
              <Panel 
                defaultSize={workspace.layoutConfig.leftPaneWidth}
                minSize={15}
                maxSize={40}
                className="bg-gray-800"
              >
                <TaskListPane />
              </Panel>
              
              <PanelResizeHandle className="w-1 bg-gray-600 hover:bg-gray-500 transition-colors cursor-col-resize" />
            </>
          )}
          
          {/* Code Editor Pane */}
          <Panel 
            defaultSize={layout.showLeftPane && layout.showRightPane ? middlePaneWidth : 
                         layout.showLeftPane ? 100 - workspace.layoutConfig.leftPaneWidth :
                         layout.showRightPane ? 100 - workspace.layoutConfig.rightPaneWidth : 100}
            minSize={30}
            className="bg-gray-900"
          >
            <CodeEditorPane />
          </Panel>
          
          {/* Reference Code Pane - Hidden on tablet */}
          {layout.showRightPane && (
            <>
              <PanelResizeHandle className="w-1 bg-gray-600 hover:bg-gray-500 transition-colors cursor-col-resize" />
              
              <Panel 
                defaultSize={workspace.layoutConfig.rightPaneWidth}
                minSize={20}
                maxSize={50}
                className="bg-gray-800"
              >
                <ReferenceCodePane />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
      
      {/* Desktop chat panel */}
      {showChat && (
        <div className="fixed bottom-4 right-4 w-96 h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              AI Coach
              {chat.isConnected && (
                <div className="ml-2 w-2 h-2 bg-green-400 rounded-full"></div>
              )}
            </h2>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 p-4 text-gray-400">
            <p>Chat functionality will be available soon.</p>
          </div>
        </div>
      )}
    </div>
  );
};