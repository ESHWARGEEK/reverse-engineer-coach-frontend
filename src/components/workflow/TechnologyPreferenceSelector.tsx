/**
 * TechnologyPreferenceSelector - Comprehensive technology selection interface with smart recommendations
 * 
 * Features:
 * - Categorized technology selector (languages, frameworks, tools)
 * - Proficiency level indicators for each selected technology
 * - Technology compatibility validation
 * - Recommendation engine for complementary technologies
 * - Popular technology stack suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';

export interface TechnologyPreference {
  id: string;
  name: string;
  category: 'language' | 'frontend' | 'backend' | 'database' | 'tool' | 'cloud';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isRecommended?: boolean;
  compatibleWith?: string[];
  popularWith?: string[];
}

export interface TechnologyStack {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
}

export interface TechnologyPreferenceSelectorProps {
  value: TechnologyPreference[];
  onChange: (technologies: TechnologyPreference[]) => void;
  experienceLevel?: string;
  currentSkills?: string[];
  error?: string;
  className?: string;
}

// Technology database with compatibility and popularity data
const TECHNOLOGIES = {
  languages: [
    { id: 'javascript', name: 'JavaScript', compatibleWith: ['react', 'vue', 'angular', 'nodejs', 'express'], popularWith: ['react', 'nodejs'] },
    { id: 'typescript', name: 'TypeScript', compatibleWith: ['react', 'vue', 'angular', 'nodejs', 'express'], popularWith: ['react', 'nodejs'] },
    { id: 'python', name: 'Python', compatibleWith: ['django', 'flask', 'fastapi', 'postgresql', 'mongodb'], popularWith: ['django', 'fastapi'] },
    { id: 'java', name: 'Java', compatibleWith: ['spring', 'springboot', 'postgresql', 'mysql'], popularWith: ['spring', 'springboot'] },
    { id: 'csharp', name: 'C#', compatibleWith: ['dotnet', 'aspnet', 'sqlserver', 'azure'], popularWith: ['dotnet', 'azure'] },
    { id: 'go', name: 'Go', compatibleWith: ['gin', 'echo', 'postgresql', 'redis'], popularWith: ['gin', 'docker'] },
    { id: 'rust', name: 'Rust', compatibleWith: ['actix', 'warp', 'postgresql'], popularWith: ['actix'] },
    { id: 'php', name: 'PHP', compatibleWith: ['laravel', 'symfony', 'mysql', 'postgresql'], popularWith: ['laravel'] }
  ],
  frontend: [
    { id: 'react', name: 'React', compatibleWith: ['javascript', 'typescript', 'nodejs'], popularWith: ['typescript', 'nodejs'] },
    { id: 'vue', name: 'Vue.js', compatibleWith: ['javascript', 'typescript', 'nodejs'], popularWith: ['javascript'] },
    { id: 'angular', name: 'Angular', compatibleWith: ['typescript', 'nodejs'], popularWith: ['typescript'] },
    { id: 'svelte', name: 'Svelte', compatibleWith: ['javascript', 'typescript'], popularWith: ['javascript'] },
    { id: 'nextjs', name: 'Next.js', compatibleWith: ['react', 'typescript', 'nodejs'], popularWith: ['react', 'typescript'] },
    { id: 'nuxtjs', name: 'Nuxt.js', compatibleWith: ['vue', 'javascript', 'typescript'], popularWith: ['vue'] }
  ],
  backend: [
    { id: 'nodejs', name: 'Node.js', compatibleWith: ['javascript', 'typescript', 'express', 'mongodb'], popularWith: ['express', 'mongodb'] },
    { id: 'express', name: 'Express.js', compatibleWith: ['nodejs', 'javascript', 'typescript'], popularWith: ['nodejs'] },
    { id: 'django', name: 'Django', compatibleWith: ['python', 'postgresql', 'redis'], popularWith: ['python', 'postgresql'] },
    { id: 'flask', name: 'Flask', compatibleWith: ['python', 'postgresql', 'sqlite'], popularWith: ['python'] },
    { id: 'fastapi', name: 'FastAPI', compatibleWith: ['python', 'postgresql', 'redis'], popularWith: ['python'] },
    { id: 'spring', name: 'Spring', compatibleWith: ['java', 'postgresql', 'mysql'], popularWith: ['java'] },
    { id: 'springboot', name: 'Spring Boot', compatibleWith: ['java', 'postgresql', 'mysql'], popularWith: ['java'] },
    { id: 'dotnet', name: '.NET', compatibleWith: ['csharp', 'sqlserver', 'azure'], popularWith: ['csharp'] },
    { id: 'gin', name: 'Gin', compatibleWith: ['go', 'postgresql', 'redis'], popularWith: ['go'] },
    { id: 'laravel', name: 'Laravel', compatibleWith: ['php', 'mysql', 'postgresql'], popularWith: ['php'] }
  ],
  database: [
    { id: 'postgresql', name: 'PostgreSQL', compatibleWith: ['python', 'nodejs', 'java', 'go'], popularWith: ['django', 'fastapi'] },
    { id: 'mysql', name: 'MySQL', compatibleWith: ['php', 'java', 'nodejs', 'python'], popularWith: ['laravel', 'spring'] },
    { id: 'mongodb', name: 'MongoDB', compatibleWith: ['nodejs', 'python', 'java'], popularWith: ['nodejs', 'express'] },
    { id: 'redis', name: 'Redis', compatibleWith: ['nodejs', 'python', 'go', 'java'], popularWith: ['django', 'fastapi'] },
    { id: 'sqlite', name: 'SQLite', compatibleWith: ['python', 'nodejs', 'php'], popularWith: ['flask'] },
    { id: 'sqlserver', name: 'SQL Server', compatibleWith: ['csharp', 'dotnet'], popularWith: ['dotnet'] }
  ],
  tools: [
    { id: 'git', name: 'Git', compatibleWith: [], popularWith: [] },
    { id: 'docker', name: 'Docker', compatibleWith: [], popularWith: ['go', 'python', 'nodejs'] },
    { id: 'kubernetes', name: 'Kubernetes', compatibleWith: ['docker'], popularWith: ['docker'] },
    { id: 'webpack', name: 'Webpack', compatibleWith: ['javascript', 'typescript', 'react'], popularWith: ['react'] },
    { id: 'vite', name: 'Vite', compatibleWith: ['javascript', 'typescript', 'react', 'vue'], popularWith: ['react', 'vue'] },
    { id: 'jest', name: 'Jest', compatibleWith: ['javascript', 'typescript', 'react'], popularWith: ['react'] },
    { id: 'cypress', name: 'Cypress', compatibleWith: ['javascript', 'typescript'], popularWith: ['react'] }
  ],
  cloud: [
    { id: 'aws', name: 'AWS', compatibleWith: [], popularWith: ['nodejs', 'python', 'java'] },
    { id: 'azure', name: 'Azure', compatibleWith: ['csharp', 'dotnet'], popularWith: ['dotnet'] },
    { id: 'gcp', name: 'Google Cloud', compatibleWith: [], popularWith: ['python', 'go'] },
    { id: 'vercel', name: 'Vercel', compatibleWith: ['nextjs', 'react'], popularWith: ['nextjs'] },
    { id: 'netlify', name: 'Netlify', compatibleWith: ['react', 'vue', 'svelte'], popularWith: ['react'] },
    { id: 'heroku', name: 'Heroku', compatibleWith: ['nodejs', 'python', 'java'], popularWith: ['nodejs', 'python'] }
  ]
};

// Popular technology stacks
const POPULAR_STACKS: TechnologyStack[] = [
  {
    id: 'mern',
    name: 'MERN Stack',
    description: 'MongoDB, Express.js, React, Node.js - Full-stack JavaScript',
    technologies: ['mongodb', 'express', 'react', 'nodejs'],
    difficulty: 'intermediate',
    popularity: 95
  },
  {
    id: 'mean',
    name: 'MEAN Stack',
    description: 'MongoDB, Express.js, Angular, Node.js - Enterprise JavaScript',
    technologies: ['mongodb', 'express', 'angular', 'nodejs'],
    difficulty: 'intermediate',
    popularity: 80
  },
  {
    id: 'django-react',
    name: 'Django + React',
    description: 'Python Django backend with React frontend',
    technologies: ['python', 'django', 'react', 'postgresql'],
    difficulty: 'intermediate',
    popularity: 85
  },
  {
    id: 'nextjs-full',
    name: 'Next.js Full-Stack',
    description: 'Next.js with TypeScript and PostgreSQL',
    technologies: ['typescript', 'nextjs', 'postgresql', 'vercel'],
    difficulty: 'intermediate',
    popularity: 90
  },
  {
    id: 'spring-react',
    name: 'Spring Boot + React',
    description: 'Java Spring Boot backend with React frontend',
    technologies: ['java', 'springboot', 'react', 'postgresql'],
    difficulty: 'advanced',
    popularity: 75
  },
  {
    id: 'go-htmx',
    name: 'Go + HTMX',
    description: 'Go backend with HTMX for dynamic frontend',
    technologies: ['go', 'gin', 'postgresql', 'docker'],
    difficulty: 'intermediate',
    popularity: 70
  }
];

export const TechnologyPreferenceSelector: React.FC<TechnologyPreferenceSelectorProps> = ({
  value = [],
  onChange,
  experienceLevel = '',
  currentSkills = [],
  error,
  className = ''
}) => {
  const [selectedTechnologies, setSelectedTechnologies] = useState<TechnologyPreference[]>(value);
  const [activeCategory, setActiveCategory] = useState<string>('languages');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showStacks, setShowStacks] = useState(false);

  // Get recommendations based on selected technologies
  const getRecommendations = useCallback((): string[] => {
    const recommendations = new Set<string>();
    
    selectedTechnologies.forEach(tech => {
      const techData = Object.values(TECHNOLOGIES).flat().find(t => t.id === tech.id);
      if (techData) {
        techData.compatibleWith?.forEach(compatible => recommendations.add(compatible));
        techData.popularWith?.forEach(popular => recommendations.add(popular));
      }
    });

    // Remove already selected technologies
    selectedTechnologies.forEach(tech => recommendations.delete(tech.id));
    
    return Array.from(recommendations);
  }, [selectedTechnologies]);

  // Get compatible stacks based on selected technologies
  const getCompatibleStacks = useCallback((): TechnologyStack[] => {
    if (selectedTechnologies.length === 0) return POPULAR_STACKS;
    
    return POPULAR_STACKS.filter(stack => {
      const selectedIds = selectedTechnologies.map(t => t.id);
      return stack.technologies.some(techId => selectedIds.includes(techId));
    }).sort((a, b) => b.popularity - a.popularity);
  }, [selectedTechnologies]);

  // Handle technology selection
  const handleTechnologySelect = useCallback((techId: string, categoryTab: string) => {
    const isSelected = selectedTechnologies.some(t => t.id === techId);
    
    if (isSelected) {
      // Remove technology
      const newSelection = selectedTechnologies.filter(t => t.id !== techId);
      setSelectedTechnologies(newSelection);
      onChange(newSelection);
    } else {
      // Add technology with default proficiency based on experience level
      const defaultProficiency = experienceLevel === 'beginner' ? 'beginner' :
                                experienceLevel === 'expert' ? 'advanced' : 'intermediate';
      
      const techData = TECHNOLOGIES[categoryTab as keyof typeof TECHNOLOGIES]?.find(t => t.id === techId);
      if (techData) {
        // Map tab names to category values
        const categoryMapping: Record<string, TechnologyPreference['category']> = {
          'languages': 'language',
          'frontend': 'frontend',
          'backend': 'backend',
          'database': 'database',
          'tools': 'tool',
          'cloud': 'cloud'
        };
        
        const newTech: TechnologyPreference = {
          id: techId,
          name: techData.name,
          category: categoryMapping[categoryTab] || categoryTab as TechnologyPreference['category'],
          proficiency: defaultProficiency as TechnologyPreference['proficiency'],
          isRecommended: getRecommendations().includes(techId)
        };
        
        const newSelection = [...selectedTechnologies, newTech];
        setSelectedTechnologies(newSelection);
        onChange(newSelection);
      }
    }
  }, [selectedTechnologies, onChange, experienceLevel, getRecommendations]);

  // Handle proficiency change
  const handleProficiencyChange = useCallback((techId: string, proficiency: TechnologyPreference['proficiency']) => {
    const newSelection = selectedTechnologies.map(tech =>
      tech.id === techId ? { ...tech, proficiency } : tech
    );
    setSelectedTechnologies(newSelection);
    onChange(newSelection);
  }, [selectedTechnologies, onChange]);

  // Handle stack selection
  const handleStackSelect = useCallback((stack: TechnologyStack) => {
    const newTechnologies: TechnologyPreference[] = [];
    
    // Category mapping for consistency
    const categoryMapping: Record<string, TechnologyPreference['category']> = {
      'languages': 'language',
      'frontend': 'frontend',
      'backend': 'backend',
      'database': 'database',
      'tools': 'tool',
      'cloud': 'cloud'
    };
    
    stack.technologies.forEach(techId => {
      // Skip if already selected
      if (selectedTechnologies.some(t => t.id === techId)) return;
      
      // Find technology data
      const techData = Object.entries(TECHNOLOGIES).find(([category, techs]) =>
        techs.some(t => t.id === techId)
      );
      
      if (techData) {
        const [categoryTab, techs] = techData;
        const tech = techs.find(t => t.id === techId);
        if (tech) {
          const defaultProficiency = stack.difficulty === 'beginner' ? 'beginner' :
                                    stack.difficulty === 'advanced' ? 'intermediate' : 'intermediate';
          
          newTechnologies.push({
            id: techId,
            name: tech.name,
            category: categoryMapping[categoryTab] || categoryTab as TechnologyPreference['category'],
            proficiency: defaultProficiency as TechnologyPreference['proficiency'],
            isRecommended: true
          });
        }
      }
    });
    
    const newSelection = [...selectedTechnologies, ...newTechnologies];
    setSelectedTechnologies(newSelection);
    onChange(newSelection);
    setShowStacks(false);
  }, [selectedTechnologies, onChange]);

  // Update state when value prop changes
  useEffect(() => {
    setSelectedTechnologies(value);
  }, [value]);

  const recommendations = getRecommendations();
  const compatibleStacks = getCompatibleStacks();

  const categories = [
    { id: 'languages', name: 'Languages', icon: '💻' },
    { id: 'frontend', name: 'Frontend', icon: '🎨' },
    { id: 'backend', name: 'Backend', icon: '⚙️' },
    { id: 'database', name: 'Database', icon: '🗄️' },
    { id: 'tools', name: 'Tools', icon: '🔧' },
    { id: 'cloud', name: 'Cloud', icon: '☁️' }
  ];

  return (
    <div className={`technology-preference-selector ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Technology Preferences
        </h3>
        <p className="text-gray-300">
          Select the technologies you want to work with. We'll suggest compatible options and popular stacks.
        </p>
      </div>

      {/* Selected Technologies Summary */}
      {selectedTechnologies.length > 0 && (
        <div className="mb-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
          <h4 className="font-semibold text-white mb-3">Selected Technologies ({selectedTechnologies.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedTechnologies.map(tech => (
              <div key={tech.id} className="flex items-center space-x-2 bg-gray-700 border border-gray-500 rounded-lg px-3 py-2">
                <span className="font-medium text-white">{tech.name}</span>
                <select
                  value={tech.proficiency}
                  onChange={(e) => handleProficiencyChange(tech.id, e.target.value as TechnologyPreference['proficiency'])}
                  className="text-xs border border-gray-500 rounded px-2 py-1 bg-gray-600 text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                <button
                  onClick={() => handleTechnologySelect(tech.id, tech.category)}
                  className="text-red-400 hover:text-red-300 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowRecommendations(!showRecommendations)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showRecommendations
              ? 'bg-green-600 text-white'
              : 'bg-green-800 text-green-200 hover:bg-green-700'
          }`}
          disabled={recommendations.length === 0}
        >
          💡 Recommendations ({recommendations.length})
        </button>
        
        <button
          onClick={() => setShowStacks(!showStacks)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showStacks
              ? 'bg-purple-600 text-white'
              : 'bg-purple-800 text-purple-200 hover:bg-purple-700'
          }`}
        >
          📦 Popular Stacks ({compatibleStacks.length})
        </button>
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-gray-800 border border-green-600 rounded-lg">
          <h4 className="font-semibold text-green-400 mb-3">Recommended Technologies</h4>
          <p className="text-sm text-green-300 mb-3">Based on your current selections:</p>
          <div className="flex flex-wrap gap-2">
            {recommendations.map(techId => {
              const techData = Object.values(TECHNOLOGIES).flat().find(t => t.id === techId);
              if (!techData) return null;
              
              const category = Object.keys(TECHNOLOGIES).find(cat =>
                TECHNOLOGIES[cat as keyof typeof TECHNOLOGIES].some(t => t.id === techId)
              );
              
              // Category mapping for consistency
              const categoryMapping: Record<string, TechnologyPreference['category']> = {
                'languages': 'language',
                'frontend': 'frontend',
                'backend': 'backend',
                'database': 'database',
                'tools': 'tool',
                'cloud': 'cloud'
              };
              
              return (
                <button
                  key={techId}
                  onClick={() => handleTechnologySelect(techId, category!)}
                  className="px-3 py-2 bg-gray-700 border border-green-500 rounded-lg text-green-200 hover:bg-green-800 font-medium transition-colors"
                >
                  + {techData.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Stacks */}
      {showStacks && (
        <div className="mb-6 p-4 bg-gray-800 border border-purple-600 rounded-lg">
          <h4 className="font-semibold text-purple-400 mb-3">Popular Technology Stacks</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {compatibleStacks.slice(0, 6).map(stack => (
              <div key={stack.id} className="bg-gray-700 border border-purple-500 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-purple-300">{stack.name}</h5>
                  <span className="text-xs bg-purple-800 text-purple-200 px-2 py-1 rounded">
                    {stack.difficulty}
                  </span>
                </div>
                <p className="text-sm text-purple-200 mb-3">{stack.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {stack.technologies.map(techId => {
                    const techData = Object.values(TECHNOLOGIES).flat().find(t => t.id === techId);
                    const isSelected = selectedTechnologies.some(t => t.id === techId);
                    return (
                      <span
                        key={techId}
                        className={`text-xs px-2 py-1 rounded ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-800 text-purple-200'
                        }`}
                      >
                        {techData?.name || techId}
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => handleStackSelect(stack)}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                >
                  Add Stack
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Technology Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {TECHNOLOGIES[activeCategory as keyof typeof TECHNOLOGIES]?.map(tech => {
          const isSelected = selectedTechnologies.some(t => t.id === tech.id);
          const isRecommended = recommendations.includes(tech.id);
          
          return (
            <button
              key={tech.id}
              onClick={() => handleTechnologySelect(tech.id, activeCategory)}
              className={`p-3 text-left border-2 rounded-lg transition-colors font-medium relative ${
                isSelected
                  ? 'border-blue-600 bg-blue-900 text-blue-100'
                  : isRecommended
                  ? 'border-green-400 bg-green-900 text-green-100 hover:bg-green-800'
                  : 'border-gray-600 hover:border-blue-400 bg-gray-700 hover:bg-gray-600 text-gray-200'
              }`}
            >
              {isRecommended && !isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
              )}
              <div className="font-semibold">{tech.name}</div>
              {isSelected && (
                <div className="text-xs text-blue-300 mt-1">
                  {selectedTechnologies.find(t => t.id === tech.id)?.proficiency}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Validation Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-900 border border-red-600 rounded-lg">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-800 border border-gray-600 rounded-lg">
        <h4 className="font-semibold text-white mb-2">💡 Tips:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Green dots indicate recommended technologies based on your selections</li>
          <li>• Set proficiency levels to get more personalized learning paths</li>
          <li>• Popular stacks show well-tested technology combinations</li>
          <li>• You can always modify your selections later</li>
        </ul>
      </div>
    </div>
  );
};

export default TechnologyPreferenceSelector;