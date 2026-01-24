import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer } from './layout';
import { Button, ConceptSearchInput } from './ui';
import { LoadingSpinner, ProgressBar } from './ui/LoadingSpinner';
import { RepositoryDiscovery } from './discovery';
import { useFocusManagement } from '../hooks/useFocusManagement';
import { useSimpleAppStore } from '../store/simpleStore';
import { repositoryAPI, projectAPI, discoveryAPI } from '../utils/api';
import { LearningProject } from '../store';

// Simple navigation function
const navigateTo = (path: string) => {
  window.location.hash = path;
};

// Workflow steps for progress indication
const WORKFLOW_STEPS = [
  { id: 'concept', label: 'Learning Concept', description: 'Define what to learn' },
  { id: 'discovery', label: 'Repository Discovery', description: 'Find relevant repositories' },
  { id: 'analysis', label: 'Repository Analysis', description: 'Analyze selected codebase' },
  { id: 'generation', label: 'Curriculum Generation', description: 'Create learning path' },
  { id: 'workspace', label: 'Interactive Learning', description: 'Start coding' },
];

// Repository suggestion interface
interface RepositorySuggestion {
  repository_url: string;
  repository_name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  quality: {
    overall_score: number;
    code_quality: number;
    documentation_quality: number;
    activity_score: number;
    educational_value: number;
    complexity_score: number;
  };
  last_updated: string;
  owner: string;
  size_kb: number;
  has_readme: boolean;
  has_license: boolean;
  open_issues: number;
  relevance_score: number;
}

interface WorkflowStepperProps {
  currentStep: string;
  progress?: number;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStep, progress = 0 }) => {
  const currentIndex = WORKFLOW_STEPS.findIndex(step => step.id === currentStep);
  
  return (
    <div className="mb-8" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={WORKFLOW_STEPS.length}>
      <div className="flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-300
                    ${isCompleted ? 'bg-green-600 text-white' : 
                      isActive ? 'bg-blue-600 text-white' : 
                      'bg-gray-700 text-gray-400'}
                  `}
                  aria-label={`Step ${index + 1}: ${step.label} - ${
                    isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'
                  }`}
                >
                  {isCompleted ? (
                    <span aria-hidden="true">✓</span>
                  ) : isActive && progress > 0 ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 
                    isCompleted ? 'text-green-400' : 
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress bar for current step */}
      {progress > 0 && currentIndex >= 0 && (
        <div className="mt-4">
          <ProgressBar 
            progress={progress} 
            showPercentage 
            color="primary"
            size="sm"
          />
        </div>
      )}
    </div>
  );
};

export const HomePage: React.FC = () => {
  const {
    learningIntent,
    setArchitectureTopic,
    setRepositoryUrl,
    setValidating,
    setValidationError,
    resetLearningIntent,
    isLoading,
    setLoading,
    addProject,
  } = useSimpleAppStore();

  const [currentStep, setCurrentStep] = useState('concept');
  const [stepProgress, setStepProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // New state for concept search and discovery
  const [learningConcept, setLearningConcept] = useState('');
  const [conceptError, setConceptError] = useState<string | null>(null);
  const [repositorySuggestions, setRepositorySuggestions] = useState<RepositorySuggestion[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [selectedRepository, setSelectedRepository] = useState<RepositorySuggestion | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualRepositoryUrl, setManualRepositoryUrl] = useState('');

  // Focus management for form
  const formRef = useFocusManagement(currentStep === 'concept', {
    autoFocus: true,
    restoreFocus: true
  });

  // Reset form when component mounts
  useEffect(() => {
    resetLearningIntent();
    setCurrentStep('concept');
    setLearningConcept('');
    setRepositorySuggestions([]);
    setSelectedRepository(null);
    setShowManualEntry(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  // Simulate progress for loading steps
  useEffect(() => {
    if (currentStep === 'analysis' || currentStep === 'generation') {
      setStepProgress(0);
      const interval = setInterval(() => {
        setStepProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Don't complete until actual completion
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // Discover repositories based on concept
  const discoverRepositories = useCallback(async (concept: string) => {
    if (!concept.trim()) return;
    
    setDiscoveryLoading(true);
    setDiscoveryError(null);
    
    try {
      const response = await discoveryAPI.discoverRepositories({
        concept: concept.trim(),
        max_results: 10,
        min_stars: 50, // Ensure quality repositories
      }) as any;
      
      setRepositorySuggestions(response.repositories || []);
      setCurrentStep('discovery');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.message || 
                         'Failed to discover repositories. Please try again.';
      setDiscoveryError(errorMessage);
    } finally {
      setDiscoveryLoading(false);
    }
  }, []);

  // Handle concept submission
  const handleConceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!learningConcept.trim()) {
      setConceptError('Please enter a learning concept');
      return;
    }
    
    if (learningConcept.trim().length < 3) {
      setConceptError('Please enter at least 3 characters');
      return;
    }
    
    setConceptError(null);
    await discoverRepositories(learningConcept);
  };

  // Handle repository selection from discovery
  const handleRepositorySelect = (repository: RepositorySuggestion) => {
    setSelectedRepository(repository);
    setArchitectureTopic(learningConcept); // Use concept as architecture topic
    setRepositoryUrl(repository.repository_url);
  };

  // Validate repository URL format
  const validateRepositoryUrl = (url: string): string | null => {
    if (!url.trim()) {
      return 'Repository URL is required';
    }
    
    const githubUrlPattern = /^https:\/\/github\.com\/[\w\-.]+\/[\w\-.]+\/?$/;
    if (!githubUrlPattern.test(url.trim())) {
      return 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)';
    }
    
    return null;
  };

  // Real-time repository URL validation with debouncing
  const handleRepositoryUrlChange = async (url: string) => {
    setManualRepositoryUrl(url);
    setRepositoryUrl(url);
    
    if (!url.trim()) {
      setValidationError(null);
      return;
    }
    
    const formatError = validateRepositoryUrl(url);
    if (formatError) {
      setValidationError(formatError);
      return;
    }
    
    // Validate with backend API
    setValidating(true);
    setValidationError(null);
    
    // Debounce validation
    setTimeout(async () => {
      try {
        await repositoryAPI.validate(url);
        setValidationError(null);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Repository validation failed';
        setValidationError(errorMessage);
      } finally {
        setValidating(false);
      }
    }, 500);
  };

  // Handle final project creation
  const handleCreateProject = async () => {
    const repositoryUrl = selectedRepository?.repository_url || manualRepositoryUrl;
    const architectureTopic = learningConcept || 'Custom Learning Project';
    
    if (!repositoryUrl) {
      setValidationError('Please select a repository or enter a URL');
      return;
    }
    
    const validationError = validateRepositoryUrl(repositoryUrl);
    if (validationError) {
      setValidationError(validationError);
      return;
    }
    
    setLoading(true);
    setCurrentStep('analysis');
    setLoadingMessage('Analyzing repository structure...');
    
    try {
      // Create project using API
      const projectData = await projectAPI.create({
        repositoryUrl,
        architectureTopic,
      }) as any;
      
      setStepProgress(100);
      setCurrentStep('generation');
      setLoadingMessage('Generating personalized curriculum...');
      
      // Add project to store
      const newProject: LearningProject = {
        id: projectData.id,
        user_id: projectData.user_id || 'anonymous',
        title: projectData.title || `${architectureTopic} Learning Project`,
        target_repository: projectData.target_repository,
        architecture_topic: projectData.architecture_topic,
        concept_description: projectData.concept_description,
        discovery_metadata: projectData.discovery_metadata,
        status: projectData.status || 'not_started' as const,
        created_at: projectData.created_at || new Date().toISOString(),
        updated_at: projectData.updated_at || new Date().toISOString(),
        implementation_language: projectData.implementation_language,
        preferred_frameworks: projectData.preferred_frameworks,
        language_specific_config: projectData.language_specific_config,
        total_tasks: projectData.total_tasks,
        completed_tasks: projectData.completed_tasks,
      };
      
      addProject(newProject);
      setStepProgress(100);
      setCurrentStep('workspace');
      setLoadingMessage('Preparing workspace...');
      
      // Announce completion to screen readers
      const announcement = document.getElementById('live-announcements');
      if (announcement) {
        announcement.textContent = 'Learning project created successfully. Redirecting to workspace.';
      }
      
      // Navigate to workspace
      setTimeout(() => {
        navigateTo(`/workspace/${newProject.id}`);
      }, 1000);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to create learning project. Please try again.';
      setValidationError(errorMessage);
      setCurrentStep('discovery');
      setStepProgress(0);
      
      // Announce error to screen readers
      const announcement = document.getElementById('live-announcements');
      if (announcement) {
        announcement.textContent = `Error: ${errorMessage}`;
      }
    } finally {
      setLoading(false);
    }
  };

  // Go back to concept step
  const handleBackToConcept = () => {
    setCurrentStep('concept');
    setRepositorySuggestions([]);
    setSelectedRepository(null);
    setDiscoveryError(null);
    setShowManualEntry(false);
  };

  // Refresh repository discovery
  const handleRefreshDiscovery = () => {
    discoverRepositories(learningConcept);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <ResponsiveContainer size="md">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gradient mb-4">
              Reverse Engineer Coach
            </h1>
            <p className="text-xl text-gray-400 mb-2">
              Master software architecture by rebuilding production systems
            </p>
            <p className="text-gray-500 mb-6">
              Learn from the best codebases in the industry through hands-on reverse engineering
            </p>
            
            {/* Quick navigation */}
            <nav className="flex justify-center space-x-4 mb-8" aria-label="Quick navigation">
              <button
                onClick={() => navigateTo('/projects')}
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-2 py-1"
              >
                View Existing Projects →
              </button>
            </nav>
          </header>

          {/* Workflow Stepper */}
          <WorkflowStepper currentStep={currentStep} progress={stepProgress} />

          {/* Learning Concept Input */}
          {currentStep === 'concept' && (
            <section 
              ref={formRef}
              className="card animate-fade-in"
              aria-labelledby="concept-heading"
            >
              <form onSubmit={handleConceptSubmit} className="space-y-6" noValidate>
                <div>
                  <h2 id="concept-heading" className="text-2xl font-semibold text-white mb-6">
                    What Do You Want to Learn?
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Describe the concept, pattern, or technology you want to master. We'll find the best repositories to learn from.
                  </p>
                </div>

                <ConceptSearchInput
                  label="Learning Concept"
                  placeholder="e.g., microservices architecture, clean architecture, docker containerization..."
                  value={learningConcept}
                  onChange={setLearningConcept}
                  onConceptSelect={setLearningConcept}
                  error={conceptError || undefined}
                  helperText="Enter a programming concept, architectural pattern, or technology you want to learn"
                  required
                  autoFocus
                  loading={discoveryLoading}
                />

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    disabled={!learningConcept.trim() || discoveryLoading}
                    isLoading={discoveryLoading}
                    loadingText="Discovering Repositories..."
                  >
                    Discover Repositories
                  </Button>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => setShowManualEntry(true)}
                    disabled={discoveryLoading}
                  >
                    Manual Entry
                  </Button>
                </div>
              </form>
              
              {/* Manual repository entry fallback */}
              {showManualEntry && (
                <div className="mt-8 pt-8 border-t border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Or Enter Repository URL Manually
                  </h3>
                  <div className="space-y-4">
                    <ConceptSearchInput
                      label="Learning Concept"
                      placeholder="Describe what you want to learn from this repository"
                      value={learningConcept}
                      onChange={setLearningConcept}
                      helperText="This helps us create a better learning experience"
                    />
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-300">
                        Repository URL <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="url"
                        value={manualRepositoryUrl}
                        onChange={(e) => handleRepositoryUrlChange(e.target.value)}
                        placeholder="https://github.com/owner/repository"
                        className="w-full bg-gray-800 border text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-600"
                        required
                      />
                      {learningIntent.validationError && (
                        <p className="text-sm text-red-400">
                          {learningIntent.validationError}
                        </p>
                      )}
                      {learningIntent.isValidating && (
                        <p className="text-sm text-gray-500">
                          Validating repository...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleCreateProject}
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        disabled={!manualRepositoryUrl.trim() || !learningConcept.trim() || learningIntent.isValidating || !!learningIntent.validationError}
                        isLoading={isLoading}
                        loadingText="Creating Project..."
                      >
                        Create Learning Project
                      </Button>
                      
                      <Button
                        onClick={() => setShowManualEntry(false)}
                        variant="secondary"
                        size="lg"
                      >
                        Back to Discovery
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Repository Discovery */}
          {currentStep === 'discovery' && (
            <section className="animate-fade-in">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Repository Discovery
                  </h2>
                  <p className="text-gray-400 mt-1">
                    Learning concept: "{learningConcept}"
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleBackToConcept}
                    variant="secondary"
                    size="sm"
                  >
                    ← Change Concept
                  </Button>
                  
                  <Button
                    onClick={() => setShowManualEntry(true)}
                    variant="secondary"
                    size="sm"
                  >
                    Manual Entry
                  </Button>
                </div>
              </div>
              
              <RepositoryDiscovery
                concept={learningConcept}
                suggestions={repositorySuggestions}
                loading={discoveryLoading}
                error={discoveryError || undefined}
                onRepositorySelect={handleRepositorySelect}
                onRefresh={handleRefreshDiscovery}
              />
              
              {/* Continue button when repository is selected */}
              {selectedRepository && (
                <div className="mt-8 text-center">
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Selected Repository
                    </h3>
                    <p className="text-gray-300 mb-1">
                      {selectedRepository.repository_name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {selectedRepository.description}
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleCreateProject}
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Creating Learning Project..."
                  >
                    Create Learning Project
                  </Button>
                </div>
              )}
              
              {/* Manual entry fallback in discovery step */}
              {showManualEntry && (
                <div className="mt-8 pt-8 border-t border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Enter Repository URL Manually
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-300">
                        Repository URL <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="url"
                        value={manualRepositoryUrl}
                        onChange={(e) => handleRepositoryUrlChange(e.target.value)}
                        placeholder="https://github.com/owner/repository"
                        className="w-full bg-gray-800 border text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-600"
                        required
                      />
                      {learningIntent.validationError && (
                        <p className="text-sm text-red-400">
                          {learningIntent.validationError}
                        </p>
                      )}
                      {learningIntent.isValidating && (
                        <p className="text-sm text-gray-500">
                          Validating repository...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleCreateProject}
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        disabled={!manualRepositoryUrl.trim() || learningIntent.isValidating || !!learningIntent.validationError}
                        isLoading={isLoading}
                        loadingText="Creating Project..."
                      >
                        Create Learning Project
                      </Button>
                      
                      <Button
                        onClick={() => setShowManualEntry(false)}
                        variant="secondary"
                        size="lg"
                      >
                        Back to Discovery
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Analysis Progress */}
          {currentStep === 'analysis' && (
            <section className="card animate-fade-in text-center" aria-live="polite">
              <LoadingSpinner size="xl" color="primary" className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Analyzing Repository
              </h3>
              <p className="text-gray-400 mb-4">
                {loadingMessage || 'Examining codebase structure and identifying key architectural patterns...'}
              </p>
              <ProgressBar progress={stepProgress} showPercentage color="primary" />
            </section>
          )}

          {/* Generation Progress */}
          {currentStep === 'generation' && (
            <section className="card animate-fade-in text-center" aria-live="polite">
              <LoadingSpinner size="xl" color="primary" className="mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Generating Curriculum
              </h3>
              <p className="text-gray-400 mb-4">
                {loadingMessage || 'Creating personalized learning path and hands-on exercises...'}
              </p>
              <ProgressBar progress={stepProgress} showPercentage color="success" />
            </section>
          )}

          {/* Workspace Ready */}
          {currentStep === 'workspace' && (
            <section className="card animate-fade-in text-center" aria-live="polite">
              <div className="text-green-500 text-6xl mb-4" aria-hidden="true">✓</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Workspace Ready!
              </h3>
              <p className="text-gray-400 mb-4">
                Your personalized learning environment is ready. Redirecting...
              </p>
              <ProgressBar progress={100} color="success" />
            </section>
          )}
        </div>
      </ResponsiveContainer>
    </div>
  );
};