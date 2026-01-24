import React, { useEffect, useState } from 'react';
import { ResponsiveContainer } from './layout';
import { Button, Input } from './ui';
import { useAppStore, LearningProject } from '../store';
import { useAuthStore } from '../store/authStore';
import { projectAPI } from '../utils/api';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { 
  PlusIcon, 
  SearchIcon as MagnifyingGlassIcon, 
  TrashIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationIcon as ExclamationTriangleIcon
} from '@heroicons/react/outline';

// Simple navigation function
const navigateTo = (path: string) => {
  window.location.hash = path;
};

interface ProjectCardProps {
  project: LearningProject;
  onDelete: (id: string) => void;
  onContinue: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete, onContinue }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'in_progress':
      case 'ready':
        return <PlayIcon className="h-5 w-5 text-blue-400" />;
      case 'analyzing':
        return <ClockIcon className="h-5 w-5 text-yellow-400 animate-spin" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'ready':
        return 'Ready to Start';
      case 'analyzing':
        return 'Analyzing...';
      case 'failed':
        return 'Analysis Failed';
      default:
        return 'Created';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
      case 'ready':
        return 'text-blue-400';
      case 'analyzing':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRepositoryName = (url: string) => {
    try {
      const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
      return match ? match[1] : url;
    } catch {
      return url;
    }
  };

  const getProjectName = (project: LearningProject) => {
    return project.title || 'Untitled Project';
  };

  const getArchitectureTopic = (project: LearningProject) => {
    return project.architecture_topic || 'General';
  };

  const getRepositoryUrl = (project: LearningProject) => {
    return project.target_repository || '';
  };

  return (
    <div className="card hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{getProjectName(project)}</h3>
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon(project.status)}
            <span className={`text-sm font-medium ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(project.id)}
          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          title="Delete project"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <span className="text-sm text-gray-400">Repository:</span>
          <p className="text-sm text-blue-400 font-mono">
            {getRepositoryName(getRepositoryUrl(project))}
          </p>
        </div>
        
        <div>
          <span className="text-sm text-gray-400">Learning Topic:</span>
          <p className="text-sm text-white capitalize">
            {getArchitectureTopic(project).replace('-', ' ')}
          </p>
        </div>

        {(project.totalTasks || 0) > 0 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Progress:</span>
              <span className="text-sm text-white">
                {project.completedTasks || 0}/{project.totalTasks || 0} tasks
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {Math.round(project.progress || 0)}% complete
            </span>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Created: {formatDate(project.created_at)}
          {project.updated_at !== project.created_at && (
            <span className="ml-2">
              • Updated: {formatDate(project.updated_at)}
            </span>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onContinue(project.id)}
          disabled={project.status === 'analyzing' || project.status === 'failed'}
        >
          {project.status === 'ready' ? 'Start Learning' : 'Continue'}
        </Button>
        
        {project.status === 'failed' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {/* TODO: Retry analysis */}}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export const ProjectDashboard: React.FC = () => {
  const { projects, setProjects, isLoading, setLoading, setError } = useAppStore();
  const { user, isAuthenticated, token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredProjects, setFilteredProjects] = useState<LearningProject[]>([]);
  const [userError, setUserError] = useState<string | null>(null);

  // Load user's projects on component mount
  useEffect(() => {
    if (isAuthenticated && token) {
      loadUserProjects();
    }
  }, [isAuthenticated, token]);

  // Filter projects based on search and status
  useEffect(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        (project.title || '').toLowerCase().includes(query) ||
        (project.architecture_topic || '').toLowerCase().includes(query) ||
        (project.target_repository || '').toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, statusFilter]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <ProtectedRoute><div /></ProtectedRoute>;
  }

  const loadUserProjects = async () => {
    setLoading(true);
    setError(null);
    setUserError(null);
    
    try {
      const response = await projectAPI.list() as any;
      const projectList = response.projects || response || [];
      
      // Ensure we only show projects belonging to the current user
      const userProjects = projectList.filter((project: any) => 
        project.user_id === user?.id
      );
      
      setProjects(userProjects);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.message || 
                         'Failed to load your projects';
      setError(errorMessage);
      setUserError(errorMessage);
      
      // Handle authentication errors
      if (error.status === 401 || error.status === 403) {
        setUserError('Authentication required. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await projectAPI.delete(projectId);
      // Remove from local state
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.message || 
                         'Failed to delete project';
      setError(errorMessage);
      
      // Handle authorization errors
      if (error.status === 403) {
        setError('Access denied: You can only delete your own projects');
      }
    }
  };

  const handleContinueProject = (projectId: string) => {
    navigateTo(`/workspace/${projectId}`);
  };

  const handleCreateNew = () => {
    navigateTo('/');
  };

  const statusOptions = [
    { value: 'all', label: 'All Projects' },
    { value: 'ready', label: 'Ready to Start' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'analyzing', label: 'Analyzing' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="min-h-screen py-8">
      <ResponsiveContainer size="xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                My Learning Projects
              </h1>
              <p className="text-gray-400">
                Manage your reverse engineering learning projects
                {user?.email && (
                  <span className="ml-2 text-gray-500">• {user.email}</span>
                )}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleCreateNew}
              className="flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Project</span>
            </Button>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search your projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User-specific error handling */}
        {userError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <p className="text-red-400">{userError}</p>
            </div>
            <button
              onClick={loadUserProjects}
              className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your projects...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && projects.length === 0 && !searchQuery && !userError && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Projects Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Create your first learning project to get started with reverse engineering
            </p>
            <Button variant="primary" onClick={handleCreateNew}>
              Create Your First Project
            </Button>
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && projects.length > 0 && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Projects Found
            </h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Button 
              variant="secondary" 
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
                onContinue={handleContinueProject}
              />
            ))}
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
};