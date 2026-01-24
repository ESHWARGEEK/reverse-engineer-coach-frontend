import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../store';

/**
 * Hook for managing workspace state persistence and restoration
 */
export const useWorkspaceState = (projectId: string | null) => {
  const {
    workspace,
    saveWorkspaceState,
    restoreWorkspaceState,
    currentProject,
    setCurrentProject,
    projects,
  } = useAppStore();
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedStateRef = useRef<string>('');

  // Auto-save workspace state with debouncing
  const debouncedSave = useCallback(() => {
    if (!projectId) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      const currentStateString = JSON.stringify(workspace);
      if (currentStateString !== lastSavedStateRef.current) {
        saveWorkspaceState(projectId);
        lastSavedStateRef.current = currentStateString;
      }
    }, 1000); // Save after 1 second of inactivity
  }, [projectId, workspace, saveWorkspaceState]);

  // Save workspace state when it changes
  useEffect(() => {
    debouncedSave();
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedSave]);

  // Restore workspace state when project changes
  useEffect(() => {
    if (projectId && currentProject?.id !== projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
        restoreWorkspaceState(projectId);
      }
    }
  }, [projectId, currentProject, projects, setCurrentProject, restoreWorkspaceState]);

  // Save state before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (projectId) {
        saveWorkspaceState(projectId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (projectId) {
        saveWorkspaceState(projectId);
      }
    };
  }, [projectId, saveWorkspaceState]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (projectId) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveWorkspaceState(projectId);
      lastSavedStateRef.current = JSON.stringify(workspace);
    }
  }, [projectId, workspace, saveWorkspaceState]);

  // Check if workspace has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    const currentStateString = JSON.stringify(workspace);
    return currentStateString !== lastSavedStateRef.current;
  }, [workspace]);

  return {
    saveNow,
    hasUnsavedChanges,
    lastActiveTime: workspace.lastActiveTime,
  };
};

/**
 * Hook for managing progress tracking and completion detection
 */
export const useProgressTracking = (projectId: string | null) => {
  const { updateProgress, markTaskCompleted, currentProject } = useAppStore();

  const updateProjectProgress = useCallback((completedTasks: number, totalTasks: number) => {
    if (projectId) {
      updateProgress(projectId, completedTasks, totalTasks);
    }
  }, [projectId, updateProgress]);

  const completeTask = useCallback((taskId: string) => {
    markTaskCompleted(taskId);
    
    // Update project progress
    if (currentProject) {
      const newCompletedTasks = (currentProject.completedTasks || 0) + 1;
      const totalTasks = currentProject.totalTasks || 0;
      updateProjectProgress(newCompletedTasks, totalTasks);
    }
  }, [markTaskCompleted, currentProject, updateProjectProgress]);

  const getCompletionPercentage = useCallback(() => {
    if (!currentProject || !currentProject.totalTasks) return 0;
    return Math.round(((currentProject.completedTasks || 0) / currentProject.totalTasks) * 100);
  }, [currentProject]);

  const isProjectCompleted = useCallback(() => {
    if (!currentProject || !currentProject.totalTasks) return false;
    return (currentProject.completedTasks || 0) >= currentProject.totalTasks;
  }, [currentProject]);

  return {
    updateProjectProgress,
    completeTask,
    getCompletionPercentage,
    isProjectCompleted,
    completedTasks: currentProject?.completedTasks || 0,
    totalTasks: currentProject?.totalTasks || 0,
  };
};