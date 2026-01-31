import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  language: string;
  languages: Record<string, number>;
  topics: string[];
  stars: number;
  forks: number;
  relevanceScore: number;
  finalScore: number;
  selectionReasoning: string;
  learningPathSuggestions: string[];
  lastUpdated?: string;
  license?: string;
  hasDocumentation?: boolean;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
}

interface RepositorySelectionInterfaceProps {
  repositories: Repository[];
  selectedRepositories: Repository[];
  onSelectionChange: (repositories: Repository[]) => void;
  maxSelections?: number;
  className?: string;
}

export const RepositorySelectionInterface: React.FC<RepositorySelectionInterfaceProps> = ({
  repositories,
  selectedRepositories,
  onSelectionChange,
  maxSelections = 3,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'relevance' | 'stars' | 'updated'>('relevance');
  const [filterBy, setFilterBy] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState<string | null>(null);

  // Filter and sort repositories
  const filteredRepositories = repositories
    .filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           repo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           repo.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterBy === 'all' || repo.complexity === filterBy;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.finalScore - a.finalScore;
        case 'stars':
          return b.stars - a.stars;
        case 'updated':
          return new Date(b.lastUpdated || '').getTime() - new Date(a.lastUpdated || '').getTime();
        default:
          return 0;
      }
    });

  const handleRepositoryToggle = (repository: Repository) => {
    const isSelected = selectedRepositories.some(r => r.id === repository.id);
    
    if (isSelected) {
      onSelectionChange(selectedRepositories.filter(r => r.id !== repository.id));
    } else if (selectedRepositories.length < maxSelections) {
      onSelectionChange([...selectedRepositories, repository]);
    }
  };

  const isRepositorySelected = (repository: Repository) => {
    return selectedRepositories.some(r => r.id === repository.id);
  };

  const canSelectMore = selectedRepositories.length < maxSelections;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Select Repositories for Your Learning Journey
        </h3>
        <p className="text-gray-300">
          Choose up to {maxSelections} repositories that match your learning goals
        </p>
        <div className="mt-2 text-sm text-gray-400">
          {selectedRepositories.length} of {maxSelections} selected
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="stars">Sort by Stars</option>
            <option value="updated">Sort by Updated</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Repository Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepositories.map((repository) => {
          const isSelected = isRepositorySelected(repository);
          const canSelect = canSelectMore || isSelected;

          return (
            <div
              key={repository.id}
              className={`
                relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-blue-500 bg-blue-900/20' 
                  : canSelect 
                    ? 'border-gray-600 bg-gray-700 hover:border-blue-400 hover:bg-gray-600' 
                    : 'border-gray-700 bg-gray-800 opacity-50 cursor-not-allowed'
                }
              `}
              onClick={() => canSelect && handleRepositoryToggle(repository)}
            >
              {/* Selection Indicator */}
              <div className="absolute top-3 right-3">
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-400'
                  }
                `}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Repository Info */}
              <div className="pr-8">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white text-sm">{repository.name}</h4>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{repository.stars}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 mb-3 line-clamp-2">
                  {repository.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-2 py-1 bg-blue-800 text-blue-200 text-xs rounded-full">
                    {repository.language}
                  </span>
                  {repository.topics.slice(0, 2).map((topic) => (
                    <span key={topic} className="px-2 py-1 bg-gray-600 text-gray-200 text-xs rounded-full">
                      {topic}
                    </span>
                  ))}
                </div>

                {/* Match Score */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-green-400 font-medium">
                    {repository.finalScore}% Match
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPreview(showPreview === repository.id ? null : repository.id);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showPreview === repository.id ? 'Hide' : 'Preview'}
                  </button>
                </div>

                {/* Complexity Badge */}
                {repository.complexity && (
                  <div className="absolute top-3 left-3">
                    <span className={`
                      px-2 py-1 text-xs rounded-full font-medium
                      ${repository.complexity === 'beginner' ? 'bg-green-800 text-green-200' :
                        repository.complexity === 'intermediate' ? 'bg-yellow-800 text-yellow-200' :
                        'bg-red-800 text-red-200'}
                    `}>
                      {repository.complexity}
                    </span>
                  </div>
                )}
              </div>

              {/* Preview Panel */}
              {showPreview === repository.id && (
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="space-y-2">
                    <div>
                      <h5 className="text-xs font-medium text-white mb-1">Why This Repository?</h5>
                      <p className="text-xs text-gray-300">{repository.selectionReasoning}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-white mb-1">Learning Suggestions</h5>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {repository.learningPathSuggestions.slice(0, 3).map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={repository.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on GitHub →
                      </a>
                      {repository.hasDocumentation && (
                        <span className="text-xs text-green-400">📚 Well Documented</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredRepositories.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No repositories found</div>
          <p className="text-sm text-gray-500">
            Try adjusting your search terms or filters
          </p>
        </div>
      )}

      {/* Selection Summary */}
      {selectedRepositories.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-white mb-2">Selected Repositories</h4>
          <div className="space-y-2">
            {selectedRepositories.map((repo) => (
              <div key={repo.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{repo.name}</span>
                <button
                  onClick={() => handleRepositoryToggle(repo)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositorySelectionInterface;