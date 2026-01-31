import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ConceptSearchInput } from './ui/ConceptSearchInput';

// Simple navigation helper
const navigate = (path: string) => {
  window.location.hash = path;
};

interface RepositoryDiscoveryPageProps {
  initialConcept?: string;
  className?: string;
}

export const RepositoryDiscoveryPage: React.FC<RepositoryDiscoveryPageProps> = ({
  initialConcept,
  className = ''
}) => {
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [currentConcept, setCurrentConcept] = useState(initialConcept || '');

  const handleRepositorySelect = (repository: any) => {
    setSelectedRepository(repository?.repository_name || null);
    
    // Store selection in session storage for persistence
    if (repository) {
      sessionStorage.setItem('selected_repository', JSON.stringify(repository));
    }
  };

  const handleCreateProject = () => {
    if (selectedRepository) {
      // Navigate to enhanced workflow with repository pre-selected
      const params = new URLSearchParams({
        repository: selectedRepository,
        source: 'discovery'
      });
      navigate(`/create-project?${params.toString()}`);
    } else {
      // Navigate to enhanced project creation workflow
      navigate('/create-project');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleConceptSearch = (concept: string) => {
    setCurrentConcept(concept);
    // The ConceptSearchInput component will handle the actual search
  };

  return (
    <div className={`min-h-screen bg-gray-900 py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Explore Repositories</h1>
            <div className="flex items-center space-x-4">
              {selectedRepository && (
                <Button
                  onClick={handleCreateProject}
                  className="text-sm"
                >
                  Create Project with {selectedRepository}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleBackToDashboard}
                className="text-sm"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </div>
          <p className="text-gray-400">
            Discover and analyze popular open-source projects to learn from real-world code.
          </p>
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <button
                onClick={handleBackToDashboard}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Dashboard
              </button>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-300">Repository Discovery</li>
            {selectedRepository && (
              <>
                <li className="text-gray-500">/</li>
                <li className="text-white font-medium">{selectedRepository}</li>
              </>
            )}
          </ol>
        </nav>

        {/* Selection Status */}
        {selectedRepository && (
          <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-300 font-medium">Repository Selected</h3>
                <p className="text-blue-200 text-sm">
                  {selectedRepository} is ready for project creation
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleCreateProject}
                >
                  Create Project
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRepository(null);
                    sessionStorage.removeItem('selected_repository');
                  }}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Repository Search Component */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Search for Repositories</h3>
            <ConceptSearchInput
              onConceptSelect={handleConceptSearch}
              value={currentConcept}
              placeholder="Search for repositories by concept (e.g., 'React authentication', 'Python web scraper')"
              label="What would you like to learn about?"
            />
          </div>
          
          {currentConcept && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <p className="text-gray-300 text-sm">
                Searching for repositories related to: <span className="font-medium text-white">"{currentConcept}"</span>
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Use the main application to perform detailed repository searches and create learning projects.
              </p>
              <Button
                className="mt-3"
                onClick={() => navigate(`/create-project?concept=${encodeURIComponent(currentConcept)}`)}
              >
                Start Project with "{currentConcept}"
              </Button>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">How to Use Repository Discovery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">🔍 Search Tips</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Use specific technology names (e.g., "React", "Python", "Docker")</li>
                <li>• Try architecture patterns (e.g., "microservices", "MVC")</li>
                <li>• Search by problem domain (e.g., "e-commerce", "chat app")</li>
                <li>• Combine terms for better results (e.g., "React Redux")</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">📚 Learning Process</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Browse repositories to understand different approaches</li>
                <li>• Select a repository that matches your learning goals</li>
                <li>• Create a project to start guided analysis</li>
                <li>• Follow the generated learning tasks and exercises</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};