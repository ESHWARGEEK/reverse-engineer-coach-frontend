/**
 * ManualRepositoryEntry - Manual repository entry fallback component
 * 
 * Features:
 * - Repository URL input with real-time validation
 * - GitHub repository metadata fetching
 * - Repository quality assessment display
 * - Repository preview component
 * - Option to switch between AI discovery and manual entry
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/Button';

export interface RepositoryMetadata {
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  lastUpdated: string;
  topics: string[];
  license: string;
  size: number;
  openIssues: number;
  hasReadme: boolean;
  hasDocumentation: boolean;
  qualityScore: number;
  learningValue: number;
}

export interface ManualRepositoryEntryProps {
  value?: string;
  onChange: (repository: string, metadata?: RepositoryMetadata) => void;
  onModeSwitch: (mode: 'ai' | 'manual') => void;
  currentMode: 'ai' | 'manual';
  error?: string;
  className?: string;
}

// Repository URL validation
const validateRepositoryUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url.trim()) {
    return { isValid: false, error: 'Repository URL is required' };
  }

  const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
  if (!githubUrlPattern.test(url.trim())) {
    return { isValid: false, error: 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)' };
  }

  return { isValid: true };
};

// Extract owner and repo from GitHub URL
const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
};

// Mock GitHub API call (in real implementation, this would call the backend)
const fetchRepositoryMetadata = async (owner: string, repo: string): Promise<RepositoryMetadata> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - in real implementation, this would come from GitHub API
  const mockData: RepositoryMetadata = {
    name: repo,
    fullName: `${owner}/${repo}`,
    description: `A sample ${repo} repository for learning purposes`,
    language: 'TypeScript',
    stars: Math.floor(Math.random() * 1000) + 100,
    forks: Math.floor(Math.random() * 200) + 20,
    lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['javascript', 'typescript', 'react', 'learning'],
    license: 'MIT',
    size: Math.floor(Math.random() * 10000) + 1000,
    openIssues: Math.floor(Math.random() * 50),
    hasReadme: true,
    hasDocumentation: Math.random() > 0.3,
    qualityScore: Math.floor(Math.random() * 30) + 70, // 70-100
    learningValue: Math.floor(Math.random() * 20) + 80  // 80-100
  };

  return mockData;
};

// Repository Quality Assessment Component
const RepositoryQualityAssessment: React.FC<{ metadata: RepositoryMetadata }> = ({ metadata }) => {
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getLearningValueColor = (value: number) => {
    if (value >= 90) return 'text-green-600 bg-green-100';
    if (value >= 75) return 'text-blue-600 bg-blue-100';
    if (value >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3">Repository Assessment</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Quality Score</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(metadata.qualityScore)}`}>
              {metadata.qualityScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${metadata.qualityScore >= 75 ? 'bg-green-500' : metadata.qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${metadata.qualityScore}%` }}
            />
          </div>
        </div>

        {/* Learning Value */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Learning Value</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLearningValueColor(metadata.learningValue)}`}>
              {metadata.learningValue}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${metadata.learningValue >= 75 ? 'bg-green-500' : metadata.learningValue >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${metadata.learningValue}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quality Indicators */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${metadata.hasReadme ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600">README</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${metadata.hasDocumentation ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600">Docs</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${metadata.license ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600">License</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${metadata.openIssues < 20 ? 'bg-green-500' : metadata.openIssues < 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-600">Issues</span>
        </div>
      </div>
    </div>
  );
};

// Repository Preview Component
const RepositoryPreview: React.FC<{ metadata: RepositoryMetadata }> = ({ metadata }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{metadata.fullName}</h3>
          <p className="text-gray-600 mt-1">{metadata.description}</p>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{metadata.stars.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{metadata.forks.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Language</span>
          <p className="text-sm font-medium text-gray-900">{metadata.language}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Size</span>
          <p className="text-sm font-medium text-gray-900">{formatSize(metadata.size)}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">License</span>
          <p className="text-sm font-medium text-gray-900">{metadata.license || 'None'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Updated</span>
          <p className="text-sm font-medium text-gray-900">{formatDate(metadata.lastUpdated)}</p>
        </div>
      </div>

      {metadata.topics.length > 0 && (
        <div className="mb-4">
          <span className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Topics</span>
          <div className="flex flex-wrap gap-2">
            {metadata.topics.map(topic => (
              <span key={topic} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      <RepositoryQualityAssessment metadata={metadata} />
    </div>
  );
};

export const ManualRepositoryEntry: React.FC<ManualRepositoryEntryProps> = ({
  value = '',
  onChange,
  onModeSwitch,
  currentMode,
  error,
  className = ''
}) => {
  const [repositoryUrl, setRepositoryUrl] = useState(value);
  const [isValidating, setIsValidating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [metadata, setMetadata] = useState<RepositoryMetadata | null>(null);

  // Validate URL in real-time
  const validateUrl = useCallback((url: string) => {
    const validation = validateRepositoryUrl(url);
    setValidationError(validation.error || '');
    return validation.isValid;
  }, []);

  // Fetch repository metadata
  const fetchMetadata = useCallback(async (url: string) => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) return;

    setIsFetching(true);
    try {
      const repoMetadata = await fetchRepositoryMetadata(parsed.owner, parsed.repo);
      setMetadata(repoMetadata);
      onChange(url, repoMetadata);
    } catch (error) {
      setValidationError('Failed to fetch repository information. Please check the URL and try again.');
      setMetadata(null);
    } finally {
      setIsFetching(false);
    }
  }, [onChange]);

  // Handle URL input change
  const handleUrlChange = useCallback((newUrl: string) => {
    setRepositoryUrl(newUrl);
    setMetadata(null);
    
    if (newUrl.trim()) {
      setIsValidating(true);
      const isValid = validateUrl(newUrl);
      
      if (isValid) {
        // Debounce metadata fetching
        const timeoutId = setTimeout(() => {
          fetchMetadata(newUrl);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
      setIsValidating(false);
    } else {
      setValidationError('');
      onChange('');
    }
  }, [validateUrl, fetchMetadata, onChange]);

  // Handle paste event for better UX
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.includes('github.com')) {
      e.preventDefault();
      handleUrlChange(pastedText.trim());
    }
  }, [handleUrlChange]);

  return (
    <div className={`manual-repository-entry ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Repository Selection</h3>
            <p className="text-gray-600">Enter a GitHub repository URL or switch to AI discovery</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onModeSwitch('ai')}
              variant={currentMode === 'ai' ? 'primary' : 'secondary'}
              size="sm"
            >
              🤖 AI Discovery
            </Button>
            <Button
              onClick={() => onModeSwitch('manual')}
              variant={currentMode === 'manual' ? 'primary' : 'secondary'}
              size="sm"
            >
              ✏️ Manual Entry
            </Button>
          </div>
        </div>

        {currentMode === 'manual' && (
          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="https://github.com/owner/repository"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationError || error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isFetching}
                />
                
                {(isValidating || isFetching) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              
              {(validationError || error) && (
                <p className="mt-2 text-sm text-red-600">
                  {validationError || error}
                </p>
              )}
              
              {!validationError && !error && repositoryUrl && !isFetching && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Valid GitHub repository URL
                </p>
              )}
            </div>

            {/* Loading State */}
            {isFetching && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <div>
                    <p className="text-blue-900 font-medium">Fetching repository information...</p>
                    <p className="text-blue-700 text-sm">Analyzing repository quality and learning value</p>
                  </div>
                </div>
              </div>
            )}

            {/* Repository Preview */}
            {metadata && !isFetching && (
              <div className="space-y-4">
                <RepositoryPreview metadata={metadata} />
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Repository information fetched successfully
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => {
                        setRepositoryUrl('');
                        setMetadata(null);
                        onChange('');
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={() => fetchMetadata(repositoryUrl)}
                      variant="ghost"
                      size="sm"
                      disabled={isFetching}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">💡 Tips for Manual Entry:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Paste any GitHub repository URL (e.g., https://github.com/facebook/react)</li>
                <li>• We'll automatically fetch repository information and assess its learning value</li>
                <li>• Look for repositories with good documentation and active maintenance</li>
                <li>• Consider the repository size and complexity for your skill level</li>
                <li>• Switch to AI Discovery for personalized repository recommendations</li>
              </ul>
            </div>
          </div>
        )}

        {currentMode === 'ai' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">AI Repository Discovery</h3>
              <p className="text-blue-700">
                Let our AI find the perfect repositories based on your skills and preferences
              </p>
            </div>
            <Button
              onClick={() => onModeSwitch('manual')}
              variant="secondary"
            >
              Switch to Manual Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualRepositoryEntry;