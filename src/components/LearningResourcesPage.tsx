import React, { useState } from 'react';
import { Button } from './ui/Button';

// Simple navigation helper
const navigate = (path: string) => {
  window.location.hash = path;
};

interface LearningResource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'tutorial' | 'documentation' | 'article' | 'video' | 'example';
  url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  estimatedTime?: string;
  isExternal: boolean;
}

const learningResources: LearningResource[] = [
  {
    id: '1',
    title: 'Software Architecture Patterns',
    description: 'Learn about common architectural patterns like MVC, MVP, MVVM, and microservices.',
    category: 'Architecture Patterns',
    type: 'tutorial',
    url: 'https://martinfowler.com/architecture/',
    difficulty: 'intermediate',
    tags: ['architecture', 'patterns', 'design'],
    estimatedTime: '45 min',
    isExternal: true
  },
  {
    id: '2',
    title: 'Clean Code Principles',
    description: 'Best practices for writing maintainable, readable, and testable code.',
    category: 'Best Practices',
    type: 'article',
    url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html',
    difficulty: 'beginner',
    tags: ['clean-code', 'best-practices', 'maintainability'],
    estimatedTime: '30 min',
    isExternal: true
  },
  {
    id: '3',
    title: 'Design Patterns in Software Engineering',
    description: 'Comprehensive guide to Gang of Four design patterns with practical examples.',
    category: 'Design Patterns',
    type: 'documentation',
    url: 'https://refactoring.guru/design-patterns',
    difficulty: 'intermediate',
    tags: ['design-patterns', 'oop', 'software-engineering'],
    estimatedTime: '2 hours',
    isExternal: true
  },
  {
    id: '4',
    title: 'System Design Interview Guide',
    description: 'Learn how to approach system design problems and scalability challenges.',
    category: 'System Design',
    type: 'tutorial',
    url: 'https://github.com/donnemartin/system-design-primer',
    difficulty: 'advanced',
    tags: ['system-design', 'scalability', 'interviews'],
    estimatedTime: '3 hours',
    isExternal: true
  },
  {
    id: '5',
    title: 'API Design Best Practices',
    description: 'Guidelines for designing RESTful APIs and GraphQL schemas.',
    category: 'API Design',
    type: 'article',
    url: 'https://docs.microsoft.com/en-us/azure/architecture/best-practices/api-design',
    difficulty: 'intermediate',
    tags: ['api', 'rest', 'graphql', 'design'],
    estimatedTime: '40 min',
    isExternal: true
  },
  {
    id: '6',
    title: 'Database Design Fundamentals',
    description: 'Learn about normalization, indexing, and database optimization techniques.',
    category: 'Database Design',
    type: 'tutorial',
    url: 'https://www.postgresql.org/docs/current/tutorial.html',
    difficulty: 'beginner',
    tags: ['database', 'sql', 'normalization', 'optimization'],
    estimatedTime: '1 hour',
    isExternal: true
  }
];

const categories = [
  'All Categories',
  'Architecture Patterns',
  'Best Practices',
  'Design Patterns',
  'System Design',
  'API Design',
  'Database Design'
];

const difficulties = ['All Levels', 'beginner', 'intermediate', 'advanced'];

const ResourceCard: React.FC<{ resource: LearningResource }> = ({ resource }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400 bg-green-900/50';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-900/50';
      case 'advanced':
        return 'text-red-400 bg-red-900/50';
      default:
        return 'text-gray-400 bg-gray-900/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tutorial':
        return '📚';
      case 'documentation':
        return '📖';
      case 'article':
        return '📄';
      case 'video':
        return '🎥';
      case 'example':
        return '💻';
      default:
        return '📋';
    }
  };

  const handleResourceClick = () => {
    if (resource.isExternal) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(resource.url);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getTypeIcon(resource.type)}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
            <p className="text-sm text-gray-400 capitalize">{resource.category}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty)}`}>
            {resource.difficulty}
          </span>
          {resource.isExternal && (
            <span className="text-gray-400 text-xs">External</span>
          )}
        </div>
      </div>

      <p className="text-gray-300 mb-4 text-sm">{resource.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {resource.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        {resource.estimatedTime && (
          <span className="text-sm text-gray-400">
            ⏱️ {resource.estimatedTime}
          </span>
        )}
        <Button
          size="sm"
          onClick={handleResourceClick}
          className="ml-auto"
        >
          {resource.isExternal ? 'Open Resource' : 'View'}
        </Button>
      </div>
    </div>
  );
};

export const LearningResourcesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');

  const filteredResources = learningResources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All Categories' || resource.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All Levels' || resource.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Learning Resources</h1>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="text-sm"
            >
              ← Back to Dashboard
            </Button>
          </div>
          <p className="text-gray-400">
            Explore tutorials, guides, and documentation to enhance your software engineering knowledge.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Resources
              </label>
              <input
                type="text"
                placeholder="Search by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty Level
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'All Levels' ? difficulty : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredResources.length} of {learningResources.length} resources
            {searchQuery && ` for "${searchQuery}"`}
            {selectedCategory !== 'All Categories' && ` in ${selectedCategory}`}
            {selectedDifficulty !== 'All Levels' && ` at ${selectedDifficulty} level`}
          </p>
        </div>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <div className="text-gray-600 mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <p className="text-gray-400 mb-4">No resources found</p>
            <p className="text-gray-500 text-sm mb-6">
              Try adjusting your search criteria or browse all categories
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
                setSelectedDifficulty('All Levels');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};