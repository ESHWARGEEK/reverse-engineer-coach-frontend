import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';
import { 
  User, 
  Settings, 
  LogOut, 
  Plus, 
  BookOpen, 
  TrendingUp, 
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Target,
  Award,
  Activity,
  ChevronRight,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { navigate } from '../utils/navigation';

// Dashboard API types
interface DashboardProject {
  id: string;
  title: string;
  target_repository: string;
  architecture_topic: string;
  concept_description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  current_task_id?: string;
  implementation_language?: string;
  preferred_frameworks?: string[];
  days_since_created: number;
  days_since_updated: number;
  is_recently_active: boolean;
}

interface DashboardStats {
  total_projects: number;
  projects_by_status: Record<string, number>;
  completed_projects: number;
  in_progress_projects: number;
  average_completion_percentage: number;
  total_tasks_completed: number;
  most_used_languages: Array<{ language: string; count: number }>;
  most_used_topics: Array<{ topic: string; count: number }>;
  recent_activity_count: number;
}

interface DashboardData {
  projects: DashboardProject[];
  stats: DashboardStats;
  total_count: number;
  page: number;
  page_size: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

// Dashboard API functions
const dashboardAPI = {
  getDashboard: async (params: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
    status?: string;
    language?: string;
    topic_search?: string;
  } = {}): Promise<DashboardData> => {
    const token = localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    
    if (!token) throw new Error('Not authenticated');

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/v1/dashboard/?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return response.json();
  },

  deleteProject: async (projectId: string): Promise<void> => {
    const token = localStorage.getItem('auth-storage') ? 
      JSON.parse(localStorage.getItem('auth-storage')!).state?.token : null;
    
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/v1/dashboard/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },
};

// Project status helpers
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    case 'in_progress':
    case 'ready':
      return <Play className="h-5 w-5 text-blue-400" />;
    case 'analyzing':
      return <Clock className="h-5 w-5 text-yellow-400 animate-spin" />;
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Pause className="h-5 w-5 text-gray-400" />;
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

// Project Card Component
const ProjectCard: React.FC<{
  project: DashboardProject;
  onDelete: (id: string) => void;
  onContinue: (id: string) => void;
}> = ({ project, onDelete, onContinue }) => {
  const getRepositoryName = (url: string) => {
    try {
      const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
      return match ? match[1] : url;
    } catch {
      return url;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{project.title}</h3>
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon(project.status)}
            <span className={`text-sm font-medium ${getStatusColor(project.status)}`}>
              {getStatusText(project.status)}
            </span>
            {project.is_recently_active && (
              <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(project.id)}
          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          title="Delete project"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <span className="text-sm text-gray-400">Repository:</span>
          <p className="text-sm text-blue-400 font-mono">
            {getRepositoryName(project.target_repository)}
          </p>
        </div>
        
        <div>
          <span className="text-sm text-gray-400">Topic:</span>
          <p className="text-sm text-white capitalize">
            {project.architecture_topic.replace('-', ' ')}
          </p>
        </div>

        {project.implementation_language && (
          <div>
            <span className="text-sm text-gray-400">Language:</span>
            <p className="text-sm text-white capitalize">
              {project.implementation_language}
            </p>
          </div>
        )}

        {project.total_tasks > 0 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Progress:</span>
              <span className="text-sm text-white">
                {project.completed_tasks}/{project.total_tasks} tasks
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.completion_percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {Math.round(project.completion_percentage)}% complete
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
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 ${color} rounded-lg`}>
        {icon}
      </div>
    </div>
    <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
    <p className="text-gray-400 text-sm">{title}</p>
    {subtitle && (
      <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
    )}
  </div>
);

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Load dashboard data
  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await dashboardAPI.getDashboard({
        page: currentPage,
        page_size: 12,
        sort_by: sortBy,
        sort_order: sortOrder,
        status: statusFilter || undefined,
        language: languageFilter || undefined,
        topic_search: searchQuery || undefined,
      });
      
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentPage, sortBy, sortOrder, statusFilter, languageFilter, searchQuery]);

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await dashboardAPI.deleteProject(projectId);
      await loadDashboard(); // Reload dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleContinueProject = (projectId: string) => {
    navigate(`/workspace/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate('/create-project');
  };

  const handleViewAllProjects = () => {
    navigate('/projects');
  };

  const handleOpenProfile = () => {
    // Open profile modal - this will be handled by the Layout component
    const event = new CustomEvent('openProfile');
    window.dispatchEvent(event);
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadDashboard}>Try Again</Button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Reverse Engineer Coach</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenProfile}
                className="text-gray-300 hover:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-300 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-gray-400">
            Manage your learning projects and track your progress
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Projects"
              value={stats.total_projects}
              icon={<BookOpen className="h-6 w-6 text-white" />}
              color="bg-blue-600"
              subtitle={`${stats.recent_activity_count} active this week`}
            />
            <StatsCard
              title="Completed Projects"
              value={stats.completed_projects}
              icon={<CheckCircle className="h-6 w-6 text-white" />}
              color="bg-green-600"
              subtitle={`${Math.round(stats.average_completion_percentage)}% avg completion`}
            />
            <StatsCard
              title="In Progress"
              value={stats.in_progress_projects}
              icon={<Activity className="h-6 w-6 text-white" />}
              color="bg-purple-600"
            />
            <StatsCard
              title="Tasks Completed"
              value={stats.total_tasks_completed}
              icon={<Target className="h-6 w-6 text-white" />}
              color="bg-orange-600"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">New Project</h3>
            <p className="text-gray-400 text-sm mb-4">
              Start learning from a new repository
            </p>
            <Button className="w-full" onClick={handleCreateProject}>
              Create Project
            </Button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-600 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">All Projects</h3>
            <p className="text-gray-400 text-sm mb-4">
              View and manage all your projects
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewAllProjects}>
              View All Projects
            </Button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Learning Stats</h3>
            <p className="text-gray-400 text-sm mb-4">
              View detailed learning analytics
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ready">Ready to Start</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="analyzing">Analyzing</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Languages</option>
              {stats?.most_used_languages.map(lang => (
                <option key={lang.language} value={lang.language}>
                  {lang.language} ({lang.count})
                </option>
              ))}
            </select>

            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated_at_desc">Recently Updated</option>
              <option value="created_at_desc">Recently Created</option>
              <option value="title_asc">Name A-Z</option>
              <option value="completion_percentage_desc">Most Complete</option>
              <option value="completion_percentage_asc">Least Complete</option>
            </select>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Projects</h3>
            {dashboardData && dashboardData.projects.length > 0 && (
              <Button variant="ghost" onClick={handleViewAllProjects}>
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          {dashboardData && dashboardData.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.projects.slice(0, 6).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteProject}
                  onContinue={handleContinueProject}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No projects yet</p>
              <p className="text-gray-500 text-sm mb-6">
                Create your first learning project to get started
              </p>
              <Button onClick={handleCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>

        {/* Most Used Technologies */}
        {stats && (stats.most_used_languages.length > 0 || stats.most_used_topics.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.most_used_languages.length > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Most Used Languages</h3>
                <div className="space-y-3">
                  {stats.most_used_languages.slice(0, 5).map((lang, index) => (
                    <div key={lang.language} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{lang.language}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${(lang.count / Math.max(...stats.most_used_languages.map(l => l.count))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-8 text-right">{lang.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.most_used_topics.length > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Most Used Topics</h3>
                <div className="space-y-3">
                  {stats.most_used_topics.slice(0, 5).map((topic, index) => (
                    <div key={topic.topic} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize">{topic.topic.replace('-', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${(topic.count / Math.max(...stats.most_used_topics.map(t => t.count))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-8 text-right">{topic.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};