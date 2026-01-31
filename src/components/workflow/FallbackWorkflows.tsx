/**
 * FallbackWorkflows - Simplified workflow components for error recovery
 * 
 * Features:
 * - Simple project creation form as fallback
 * - Template-based curriculum selection
 * - Basic repository information display
 * - Offline mode with cached data
 * - Manual repository entry fallback
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useToast } from '../../store/toastStore';

// Simple Project Creation Fallback
export const SimpleProjectCreationFallback: React.FC<{
  preservedData?: any;
  onComplete: (projectData: any) => void;
  onCancel: () => void;
}> = ({ preservedData, onComplete, onCancel }) => {
  const [projectData, setProjectData] = useState({
    name: preservedData?.projectName || '',
    description: preservedData?.description || '',
    repository: preservedData?.repository || '',
    technologies: preservedData?.technologies || [],
    difficulty: preservedData?.difficulty || 'intermediate'
  });

  const { showSuccess } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectData.name.trim()) {
      return;
    }

    showSuccess('Project created', 'Your simple project has been created successfully.');
    onComplete(projectData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800">
            We've switched to a simplified project creation process to get you started quickly.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            id="project-name"
            type="text"
            value={projectData.name}
            onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your project name"
            required
          />
        </div>

        <div>
          <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="project-description"
            value={projectData.description}
            onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe what you want to learn or build"
          />
        </div>

        <div>
          <label htmlFor="repository-url" className="block text-sm font-medium text-gray-700 mb-2">
            Repository URL (optional)
          </label>
          <input
            id="repository-url"
            type="url"
            value={projectData.repository}
            onChange={(e) => setProjectData(prev => ({ ...prev, repository: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://github.com/username/repository"
          />
        </div>

        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            id="difficulty"
            value={projectData.difficulty}
            onChange={(e) => setProjectData(prev => ({ ...prev, difficulty: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="flex justify-between">
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Simple Project
          </Button>
        </div>
      </form>
    </div>
  );
};

// Template-based Curriculum Fallback
export const TemplateCurriculumFallback: React.FC<{
  technologies?: string[];
  onComplete: (template: any) => void;
  onCancel: () => void;
}> = ({ technologies = [], onComplete, onCancel }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = [
    {
      id: 'web-fundamentals',
      name: 'Web Development Fundamentals',
      description: 'Learn HTML, CSS, and JavaScript basics',
      technologies: ['HTML', 'CSS', 'JavaScript'],
      duration: '4-6 weeks',
      difficulty: 'beginner',
      modules: [
        'HTML Structure and Semantics',
        'CSS Styling and Layout',
        'JavaScript Basics and DOM',
        'Responsive Design',
        'Final Project'
      ]
    },
    {
      id: 'react-basics',
      name: 'React Development',
      description: 'Build modern web applications with React',
      technologies: ['React', 'JavaScript', 'HTML', 'CSS'],
      duration: '6-8 weeks',
      difficulty: 'intermediate',
      modules: [
        'React Components and JSX',
        'State and Props Management',
        'Event Handling and Forms',
        'React Hooks',
        'Building a Complete App'
      ]
    },
    {
      id: 'fullstack-js',
      name: 'Full-Stack JavaScript',
      description: 'Complete web application development',
      technologies: ['Node.js', 'Express', 'React', 'MongoDB'],
      duration: '10-12 weeks',
      difficulty: 'advanced',
      modules: [
        'Backend API Development',
        'Database Design and Integration',
        'Frontend React Application',
        'Authentication and Security',
        'Deployment and DevOps'
      ]
    },
    {
      id: 'python-basics',
      name: 'Python Programming',
      description: 'Learn Python for web development and data science',
      technologies: ['Python', 'Flask', 'SQLite'],
      duration: '6-8 weeks',
      difficulty: 'beginner',
      modules: [
        'Python Syntax and Basics',
        'Object-Oriented Programming',
        'Web Development with Flask',
        'Database Integration',
        'Data Analysis Basics'
      ]
    }
  ];

  // Filter templates based on user's technologies
  const relevantTemplates = technologies.length > 0 
    ? templates.filter(template => 
        template.technologies.some(tech => 
          technologies.some(userTech => 
            userTech.toLowerCase().includes(tech.toLowerCase()) ||
            tech.toLowerCase().includes(userTech.toLowerCase())
          )
        )
      )
    : templates;

  const handleTemplateSelect = (template: any) => {
    onComplete({
      templateId: template.id,
      name: template.name,
      description: template.description,
      technologies: template.technologies,
      duration: template.duration,
      difficulty: template.difficulty,
      curriculum: template.modules.map((module: string, index: number) => ({
        phase: `Phase ${index + 1}`,
        title: module,
        description: `Learn ${module.toLowerCase()}`,
        tasks: [
          `Study ${module} concepts`,
          `Complete hands-on exercises`,
          `Build a practical example`,
          `Review and practice`
        ],
        estimatedHours: 8
      }))
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-800">
            Choose from our pre-built learning templates to get started quickly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {(relevantTemplates.length > 0 ? relevantTemplates : templates).map((template) => (
          <div
            key={template.id}
            className={`
              border-2 rounded-lg p-6 cursor-pointer transition-all duration-200
              ${selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
            `}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
                }
              `}>
                {selectedTemplate === template.id && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>

            <p className="text-gray-600 mb-4">{template.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Duration:</span>
                <span className="text-gray-700">{template.duration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Difficulty:</span>
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${template.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}
                `}>
                  {template.difficulty}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Technologies:</p>
              <div className="flex flex-wrap gap-1">
                {template.technologies.map((tech) => (
                  <span key={tech} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Learning Modules:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {template.modules.slice(0, 3).map((module, index) => (
                  <li key={index}>• {module}</li>
                ))}
                {template.modules.length > 3 && (
                  <li className="text-gray-500">+ {template.modules.length - 3} more modules</li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            const template = templates.find(t => t.id === selectedTemplate);
            if (template) {
              handleTemplateSelect(template);
            }
          }}
          variant="primary"
          disabled={!selectedTemplate}
        >
          Use Selected Template
        </Button>
      </div>
    </div>
  );
};

// Basic Repository Information Fallback
export const BasicRepositoryInfoFallback: React.FC<{
  repository: any;
  onComplete: (basicInfo: any) => void;
  onCancel: () => void;
}> = ({ repository, onComplete, onCancel }) => {
  const handleContinue = () => {
    const basicInfo = {
      repository,
      analysisMode: 'basic',
      curriculum: [
        {
          phase: 'Exploration',
          title: 'Repository Overview',
          description: 'Get familiar with the repository structure and purpose',
          tasks: [
            'Read the README and documentation',
            'Explore the project structure',
            'Understand the main functionality',
            'Identify key files and directories'
          ],
          estimatedHours: 4
        },
        {
          phase: 'Analysis',
          title: 'Code Review',
          description: 'Analyze the codebase and implementation patterns',
          tasks: [
            'Review the main application files',
            'Study the coding patterns used',
            'Understand the architecture',
            'Identify learning opportunities'
          ],
          estimatedHours: 6
        },
        {
          phase: 'Practice',
          title: 'Hands-on Learning',
          description: 'Practice with the codebase and build understanding',
          tasks: [
            'Set up the development environment',
            'Run the application locally',
            'Make small modifications',
            'Experiment with the code'
          ],
          estimatedHours: 8
        }
      ]
    };

    onComplete(basicInfo);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-yellow-800">
            We'll create a basic learning plan using the repository's general information.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Information</h3>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-500">Name:</span>
            <p className="text-gray-900">{repository.name || repository.fullName}</p>
          </div>
          
          {repository.description && (
            <div>
              <span className="text-sm font-medium text-gray-500">Description:</span>
              <p className="text-gray-900">{repository.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {repository.language && (
              <div>
                <span className="text-sm font-medium text-gray-500">Language:</span>
                <p className="text-gray-900">{repository.language}</p>
              </div>
            )}
            
            {repository.stars && (
              <div>
                <span className="text-sm font-medium text-gray-500">Stars:</span>
                <p className="text-gray-900">{repository.stars}</p>
              </div>
            )}
          </div>
          
          {repository.topics && repository.topics.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-500">Topics:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {repository.topics.map((topic: string) => (
                  <span key={topic} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">Basic Learning Plan</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Explore and understand the repository structure</li>
          <li>• Analyze the code and implementation patterns</li>
          <li>• Practice with hands-on exercises</li>
          <li>• Build your own understanding through experimentation</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={handleContinue} variant="primary">
          Continue with Basic Plan
        </Button>
      </div>
    </div>
  );
};

// Offline Mode Fallback
export const OfflineModeFallback: React.FC<{
  cachedData?: any;
  onComplete: (offlineData: any) => void;
  onRetry: () => void;
}> = ({ cachedData, onComplete, onRetry }) => {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z" />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Working Offline
        </h3>
        
        <p className="text-gray-600 mb-6">
          You're currently offline, but we can continue with previously saved data.
        </p>

        {cachedData ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">
              We found some cached data from your previous session that we can use to continue.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              No cached data available. Some features may be limited in offline mode.
            </p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <Button onClick={onRetry} variant="secondary">
            Try to Reconnect
          </Button>
          <Button 
            onClick={() => onComplete({ mode: 'offline', data: cachedData })} 
            variant="primary"
          >
            Continue Offline
          </Button>
        </div>
      </div>
    </div>
  );
};