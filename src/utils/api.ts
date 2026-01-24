import axios from 'axios';
import { handleAPIError, withRetry, ServiceError } from './errorHandler';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get auth token from store
const getAuthToken = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
};

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = handleAPIError(error, { 
      logError: true,
      enableRetry: true,
      maxRetries: 3
    });
    
    // Handle specific error cases with enhanced recovery
    if (apiError.status === 401) {
      // Handle unauthorized access - clear auth and redirect
      localStorage.removeItem('auth-storage');
      console.error('Authentication Required', 'Please log in to continue.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (apiError.status === 429) {
      // Rate limit exceeded with retry suggestion
      console.warn('Rate Limit Exceeded', 'Please wait before making more requests. The system will automatically retry.');
    } else if (apiError.status === 503) {
      // Service unavailable with degradation info
      const serviceName = apiError.details?.service;
      
      let message = 'Some services are temporarily unavailable.';
      if (serviceName === 'github') {
        message = 'GitHub service is temporarily unavailable. Using cached data where possible.';
      } else if (serviceName === 'llm' || serviceName === 'ai') {
        message = 'AI services are temporarily limited. Some features may be simplified.';
      }
      
      console.warn('Service Degradation', message);
    } else if (apiError.status && apiError.status >= 500) {
      // Server errors with retry option
      console.error('Server Error', 'Something went wrong on our end. Please try again.');
    }
    
    return Promise.reject(new ServiceError(
      apiError.message,
      apiError.status || 500,
      apiError.code,
      apiError.details,
      Boolean(apiError.status === 429 || (apiError.status && apiError.status >= 500)) // retryable
    ));
  }
);

// Enhanced API wrapper with retry logic and error handling
const apiRequest = async <T>(requestFn: () => Promise<{ data: T }>): Promise<T> => {
  try {
    const response = await withRetry(requestFn, 3, 1000);
    return response.data;
  } catch (error) {
    const apiError = handleAPIError(error);
    throw new ServiceError(
      apiError.message,
      apiError.status || 500,
      apiError.code,
      apiError.details
    );
  }
};

// API endpoints with enhanced error handling
export const repositoryAPI = {
  validate: async (url: string) => {
    return apiRequest(() => 
      api.get(`/api/repositories/validate?url=${encodeURIComponent(url)}`)
    );
  },
  
  analyze: async (url: string, topic: string) => {
    return apiRequest(() => 
      api.post('/api/repositories/analyze', { url, topic })
    );
  },
};

export const discoveryAPI = {
  // Get concept suggestions for autocomplete
  getConceptSuggestions: async (query: string, limit: number = 10) => {
    return apiRequest(() => 
      api.get(`/discover/suggestions?query=${encodeURIComponent(query)}&limit=${limit}`)
    );
  },
  
  // Get popular concepts
  getPopularConcepts: async () => {
    return apiRequest(() => 
      api.get('/discover/popular-concepts')
    );
  },
  
  // Discover repositories based on concept
  discoverRepositories: async (data: {
    concept: string;
    max_results?: number;
    min_stars?: number;
    max_stars?: number;
    language?: string;
    topics?: string[];
    created_after?: string;
    updated_after?: string;
  }) => {
    return apiRequest(() => 
      api.post('/discover/repositories', data)
    );
  },
  
  // Analyze specific repository
  analyzeRepository: async (data: {
    repository_url: string;
    learning_concept?: string;
  }) => {
    return apiRequest(() => 
      api.post('/discover/analyze', data)
    );
  },
  
  // Get repositories by language
  getRepositoriesByLanguage: async (data: {
    language: string;
    concepts: string[];
    max_results?: number;
  }) => {
    return apiRequest(() => 
      api.post('/discover/by-language', data)
    );
  },
  
  // Refresh discovery cache
  refreshCache: async (concept: string) => {
    return apiRequest(() => 
      api.post(`/discover/refresh-cache?concept=${encodeURIComponent(concept)}`)
    );
  },
  
  // Get discovery statistics
  getStats: async () => {
    return apiRequest(() => 
      api.get('/discover/stats')
    );
  },
};

export const projectAPI = {
  create: async (data: { repositoryUrl: string; architectureTopic: string; implementation_language?: string; preferred_frameworks?: string[] }) => {
    return apiRequest(() => 
      api.post('/api/v1/projects/', {
        title: `${data.architectureTopic} Learning Project`,
        target_repository: data.repositoryUrl,
        architecture_topic: data.architectureTopic,
        implementation_language: data.implementation_language,
        preferred_frameworks: data.preferred_frameworks
      })
    );
  },
  
  list: async (params?: { 
    status_filter?: string; 
    page?: number; 
    page_size?: number; 
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const url = queryParams.toString() ? `/api/v1/projects/?${queryParams}` : '/api/v1/projects/';
    return apiRequest(() => api.get(url));
  },
  
  get: async (id: string) => {
    return apiRequest(() => api.get(`/api/v1/projects/${id}`));
  },
  
  update: async (id: string, data: any) => {
    return apiRequest(() => api.put(`/api/v1/projects/${id}`, data));
  },
  
  delete: async (id: string) => {
    return apiRequest(() => api.delete(`/api/v1/projects/${id}`));
  },
  
  getProgress: async (id: string) => {
    return apiRequest(() => api.get(`/api/v1/projects/${id}/progress`));
  },
  
  updateProgress: async (id: string, data: { completed_tasks: number; current_task_id?: string }) => {
    return apiRequest(() => api.post(`/api/v1/projects/${id}/progress`, data));
  },
};

export const dashboardAPI = {
  getDashboard: async (params?: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
    status?: string;
    language?: string;
    topic_search?: string;
    created_after?: string;
    created_before?: string;
    completion_min?: number;
    completion_max?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = queryParams.toString() ? `/api/v1/dashboard/?${queryParams}` : '/api/v1/dashboard/';
    return apiRequest(() => api.get(url));
  },

  getStats: async () => {
    return apiRequest(() => api.get('/api/v1/dashboard/stats'));
  },

  deleteProject: async (projectId: string) => {
    return apiRequest(() => api.delete(`/api/v1/dashboard/projects/${projectId}`));
  },

  getRecentActivity: async (params?: {
    days?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append('days', params.days.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = queryParams.toString() ? `/api/v1/dashboard/recent-activity?${queryParams}` : '/api/v1/dashboard/recent-activity';
    return apiRequest(() => api.get(url));
  },
};

export default api;