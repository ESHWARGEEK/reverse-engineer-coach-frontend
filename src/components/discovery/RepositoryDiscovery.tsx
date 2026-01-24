import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface RepositoryQuality {
  overall_score: number;
  code_quality: number;
  documentation_quality: number;
  activity_score: number;
  educational_value: number;
  complexity_score: number;
}

interface RepositorySuggestion {
  repository_url: string;
  repository_name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  quality: RepositoryQuality;
  last_updated: string;
  owner: string;
  size_kb: number;
  has_readme: boolean;
  has_license: boolean;
  open_issues: number;
  relevance_score: number;
}

interface RepositoryDiscoveryProps {
  concept: string;
  suggestions: RepositorySuggestion[];
  loading: boolean;
  error?: string;
  onRepositorySelect: (repository: RepositorySuggestion) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

interface RepositoryCardProps {
  repository: RepositorySuggestion;
  onSelect: (repository: RepositorySuggestion) => void;
  isSelected?: boolean;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({ 
  repository, 
  onSelect, 
  isSelected = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return 'Unknown';
    }
  };
  
  // Get quality color based on score
  const getQualityColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  // Get quality label based on score
  const getQualityLabel = (score: number): string => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Very Good';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    return 'Poor';
  };

  return (
    <div 
      className={clsx(
        'bg-gray-800 border rounded-lg p-4 transition-all duration-200 hover:shadow-lg cursor-pointer',
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' 
          : 'border-gray-600 hover:border-gray-500'
      )}
      onClick={() => onSelect(repository)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(repository);
        }
      }}
      aria-label={`Select repository ${repository.repository_name}`}
    >
      {/* Repository header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">
            {repository.repository_name}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            by {repository.owner}
          </p>
        </div>
        
        {/* Overall quality score */}
        <div className="flex-shrink-0 ml-4">
          <div className="text-center">
            <div className={clsx(
              'text-2xl font-bold',
              getQualityColor(repository.quality.overall_score)
            )}>
              {Math.round(repository.quality.overall_score * 100)}
            </div>
            <div className="text-xs text-gray-500">
              {getQualityLabel(repository.quality.overall_score)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Repository description */}
      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
        {repository.description || 'No description available'}
      </p>
      
      {/* Repository stats */}
      <div className="flex items-center space-x-4 mb-3 text-sm text-gray-400">
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span>{formatNumber(repository.stars)}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>{formatNumber(repository.forks)}</span>
        </div>
        
        {repository.language && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>{repository.language}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>{formatDate(repository.last_updated)}</span>
        </div>
      </div>
      
      {/* Topics */}
      {repository.topics && repository.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {repository.topics.slice(0, 5).map((topic, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300"
            >
              {topic}
            </span>
          ))}
          {repository.topics.length > 5 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
              +{repository.topics.length - 5} more
            </span>
          )}
        </div>
      )}
      
      {/* Quality metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-gray-700 rounded">
          <div className={clsx('text-sm font-semibold', getQualityColor(repository.quality.educational_value))}>
            {Math.round(repository.quality.educational_value * 100)}%
          </div>
          <div className="text-xs text-gray-400">Educational</div>
        </div>
        
        <div className="text-center p-2 bg-gray-700 rounded">
          <div className={clsx('text-sm font-semibold', getQualityColor(repository.quality.documentation_quality))}>
            {Math.round(repository.quality.documentation_quality * 100)}%
          </div>
          <div className="text-xs text-gray-400">Documentation</div>
        </div>
      </div>
      
      {/* Toggle details button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(!showDetails);
        }}
        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>
      
      {/* Detailed metrics */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Code Quality</div>
              <div className={clsx('font-semibold', getQualityColor(repository.quality.code_quality))}>
                {Math.round(repository.quality.code_quality * 100)}%
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 mb-1">Activity</div>
              <div className={clsx('font-semibold', getQualityColor(repository.quality.activity_score))}>
                {Math.round(repository.quality.activity_score * 100)}%
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 mb-1">Complexity</div>
              <div className={clsx('font-semibold', getQualityColor(repository.quality.complexity_score))}>
                {Math.round(repository.quality.complexity_score * 100)}%
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 mb-1">Relevance</div>
              <div className={clsx('font-semibold', getQualityColor(repository.relevance_score))}>
                {Math.round(repository.relevance_score * 100)}%
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Size: {formatNumber(repository.size_kb)} KB</span>
              <span>Issues: {repository.open_issues}</span>
              <span>{repository.has_readme ? '✓ README' : '✗ No README'}</span>
              <span>{repository.has_license ? '✓ License' : '✗ No License'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const RepositoryDiscovery: React.FC<RepositoryDiscoveryProps> = ({
  concept,
  suggestions,
  loading,
  error,
  onRepositorySelect,
  onRefresh,
  onLoadMore,
  hasMore = false,
  className
}) => {
  const [selectedRepository, setSelectedRepository] = useState<RepositorySuggestion | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'stars' | 'updated' | 'quality'>('relevance');
  
  // Sort suggestions based on selected criteria
  const sortedSuggestions = React.useMemo(() => {
    const sorted = [...suggestions];
    
    switch (sortBy) {
      case 'stars':
        return sorted.sort((a, b) => b.stars - a.stars);
      case 'updated':
        return sorted.sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
      case 'quality':
        return sorted.sort((a, b) => b.quality.overall_score - a.quality.overall_score);
      case 'relevance':
      default:
        return sorted.sort((a, b) => b.relevance_score - a.relevance_score);
    }
  }, [suggestions, sortBy]);
  
  const handleRepositorySelect = (repository: RepositorySuggestion) => {
    setSelectedRepository(repository);
    onRepositorySelect(repository);
  };

  if (loading) {
    return (
      <div className={clsx("text-center py-12", className)}>
        <LoadingSpinner size="xl" color="primary" className="mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Discovering Repositories
        </h3>
        <p className="text-gray-400">
          Searching for the best repositories to learn "{concept}"...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx("text-center py-12", className)}>
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Discovery Failed
        </h3>
        <p className="text-gray-400 mb-4">
          {error}
        </p>
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="primary"
            size="sm"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={clsx("text-center py-12", className)}>
        <div className="text-gray-500 text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No Repositories Found
        </h3>
        <p className="text-gray-400 mb-4">
          We couldn't find any repositories matching "{concept}". Try refining your search or using different keywords.
        </p>
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="secondary"
            size="sm"
          >
            Search Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Repository Suggestions
          </h2>
          <p className="text-gray-400 mt-1">
            Found {suggestions.length} repositories for "{concept}"
          </p>
        </div>
        
        {/* Sort controls */}
        <div className="flex items-center space-x-3">
          <label htmlFor="sort-select" className="text-sm text-gray-400">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-800 border border-gray-600 text-gray-100 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Relevance</option>
            <option value="quality">Quality Score</option>
            <option value="stars">Stars</option>
            <option value="updated">Recently Updated</option>
          </select>
          
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="secondary"
              size="sm"
              className="ml-2"
            >
              Refresh
            </Button>
          )}
        </div>
      </div>
      
      {/* Repository cards */}
      <div className="grid gap-4">
        {sortedSuggestions.map((repository, index) => (
          <RepositoryCard
            key={`${repository.repository_url}-${index}`}
            repository={repository}
            onSelect={handleRepositorySelect}
            isSelected={selectedRepository?.repository_url === repository.repository_url}
          />
        ))}
      </div>
      
      {/* Load more button */}
      {hasMore && onLoadMore && (
        <div className="text-center">
          <Button
            onClick={onLoadMore}
            variant="secondary"
            size="lg"
          >
            Load More Repositories
          </Button>
        </div>
      )}
      
      {/* Selection confirmation */}
      {selectedRepository && (
        <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white truncate">
                {selectedRepository.repository_name}
              </h4>
              <p className="text-sm text-gray-400 mt-1">
                Selected for learning
              </p>
            </div>
            <button
              onClick={() => setSelectedRepository(null)}
              className="ml-2 text-gray-400 hover:text-white"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};