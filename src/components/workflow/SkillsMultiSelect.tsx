/**
 * SkillsMultiSelect - Multi-select component for current skills with autocomplete
 * 
 * Features:
 * - Autocomplete with intelligent suggestions
 * - Multi-select with visual tags
 * - Categorized skill suggestions
 * - Custom skill addition
 * - Experience level adaptive suggestions
 */

import React, { useState, useRef, useEffect } from 'react';

export interface SkillCategory {
  name: string;
  skills: string[];
  icon: string;
}

export interface SkillsMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
  experienceLevel: string;
  error?: string;
  className?: string;
}

const skillCategories: SkillCategory[] = [
  {
    name: 'Programming Languages',
    icon: '💻',
    skills: [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust',
      'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB'
    ]
  },
  {
    name: 'Web Development',
    icon: '🌐',
    skills: [
      'HTML/CSS', 'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js',
      'Next.js', 'Nuxt.js', 'Svelte', 'jQuery', 'Bootstrap', 'Tailwind CSS'
    ]
  },
  {
    name: 'Mobile Development',
    icon: '📱',
    skills: [
      'React Native', 'Flutter', 'iOS Development', 'Android Development',
      'Xamarin', 'Ionic', 'Cordova', 'Progressive Web Apps'
    ]
  },
  {
    name: 'Backend & Databases',
    icon: '🗄️',
    skills: [
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL',
      'REST APIs', 'Microservices', 'Docker', 'Kubernetes'
    ]
  },
  {
    name: 'Cloud & DevOps',
    icon: '☁️',
    skills: [
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD',
      'Jenkins', 'GitHub Actions', 'Terraform', 'Ansible'
    ]
  },
  {
    name: 'Data & AI',
    icon: '🤖',
    skills: [
      'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch',
      'Pandas', 'NumPy', 'Data Visualization', 'Big Data', 'Analytics'
    ]
  },
  {
    name: 'Tools & Methodologies',
    icon: '🛠️',
    skills: [
      'Git', 'Agile', 'Scrum', 'Testing', 'Unit Testing', 'Integration Testing',
      'Code Review', 'Documentation', 'Project Management'
    ]
  }
];

export const SkillsMultiSelect: React.FC<SkillsMultiSelectProps> = ({
  value,
  onChange,
  suggestions,
  experienceLevel,
  error,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all available skills
  const allSkills = skillCategories.reduce((acc, category) => {
    return [...acc, ...category.skills];
  }, [] as string[]);

  // Filter skills based on input and category
  useEffect(() => {
    let skills = allSkills;
    
    if (activeCategory !== 'all') {
      const category = skillCategories.find(cat => cat.name === activeCategory);
      skills = category ? category.skills : [];
    }

    // Add experience-level suggestions
    if (suggestions.length > 0) {
      skills = Array.from(new Set([...suggestions, ...skills]));
    }

    // Filter by input value
    if (inputValue) {
      skills = skills.filter(skill =>
        skill.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(skill)
      );
    } else {
      skills = skills.filter(skill => !value.includes(skill));
    }

    setFilteredSkills(skills.slice(0, 20)); // Limit to 20 results
  }, [inputValue, activeCategory, allSkills, suggestions, value]);

  // Handle skill selection
  const handleSkillSelect = (skill: string) => {
    if (!value.includes(skill)) {
      onChange([...value, skill]);
    }
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle skill removal
  const handleSkillRemove = (skillToRemove: string) => {
    onChange(value.filter(skill => skill !== skillToRemove));
  };

  // Handle custom skill addition
  const handleCustomSkillAdd = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue('');
      setIsOpen(false);
    }
  };

  // Handle input key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSkills.length > 0) {
        handleSkillSelect(filteredSkills[0]);
      } else if (inputValue.trim()) {
        handleCustomSkillAdd();
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleSkillRemove(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`skills-multi-select ${className}`} ref={dropdownRef}>
      <div className="mb-4">
        <label className="block text-lg font-bold text-gray-900 mb-2">
          What skills do you currently have or want to learn? <span className="text-rose-500">*</span>
        </label>
        <p className="text-gray-600 text-sm">
          Select existing skills or add your own. Choose from multiple categories or search directly.
        </p>
      </div>
      
      {/* Selected Skills */}
      {value.length > 0 && (
        <div className="selected-skills mb-6">
          <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">
            Selected Skills ({value.length})
          </h4>
          <div className="flex flex-wrap gap-3">
            {value.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border-2 border-cyan-200 font-bold shadow-sm hover:shadow-md transition-shadow"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleSkillRemove(skill)}
                  className="ml-3 inline-flex items-center justify-center w-5 h-5 rounded-full text-cyan-700 hover:bg-cyan-200 hover:text-cyan-900 focus:outline-none focus:bg-cyan-200 font-bold transition-colors"
                  aria-label={`Remove ${skill}`}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search skills or add your own..."
            className={`w-full px-4 py-3 border-3 rounded-xl shadow-sm focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:border-cyan-500 text-lg font-medium text-gray-900 placeholder-gray-500 transition-all ${
              error ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-gray-300 hover:border-cyan-400'
            }`}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white border-3 border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-hidden">
            {/* Category Tabs */}
            <div className="border-b-2 border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-slate-50">
              <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">Categories</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-2 text-sm rounded-lg font-bold transition-all ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-cyan-200 to-blue-200 text-cyan-800 border-2 border-cyan-300 shadow-md'
                      : 'text-gray-700 hover:bg-gray-200 border-2 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  All Skills
                </button>
                {skillCategories.map((category) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setActiveCategory(category.name)}
                    className={`px-3 py-2 text-sm rounded-lg flex items-center font-bold transition-all ${
                      activeCategory === category.name
                        ? 'bg-gradient-to-r from-cyan-200 to-blue-200 text-cyan-800 border-2 border-cyan-300 shadow-md'
                        : 'text-gray-700 hover:bg-gray-200 border-2 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="mr-2 text-base">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills List */}
            <div className="max-h-64 overflow-y-auto">
              {/* Experience Level Suggestions */}
              {suggestions.length > 0 && activeCategory === 'all' && (
                <div className="p-4 border-b-2 border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <div className="flex items-center mb-3">
                    <div className="bg-emerald-100 p-1 rounded-lg mr-2">
                      <span className="text-lg">⭐</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide">
                      Suggested for {experienceLevel}s
                    </p>
                  </div>
                  <div className="space-y-2">
                    {suggestions
                      .filter(skill => !value.includes(skill) && 
                        skill.toLowerCase().includes(inputValue.toLowerCase()))
                      .slice(0, 5)
                      .map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillSelect(skill)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-100 rounded-lg flex items-center font-bold text-emerald-700 transition-colors"
                        >
                          <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                          {skill}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Filtered Skills */}
              {filteredSkills.length > 0 ? (
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-1">
                    {filteredSkills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillSelect(skill)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 rounded-lg font-medium text-gray-700 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ) : inputValue ? (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <button
                    type="button"
                    onClick={handleCustomSkillAdd}
                    className="w-full text-left px-3 py-3 text-sm hover:bg-blue-100 rounded-lg text-blue-700 font-bold border-2 border-dashed border-blue-300 hover:border-blue-400 transition-all"
                  >
                    <span className="text-lg mr-2">+</span>
                    Add "{inputValue}" as a custom skill
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  <div className="bg-gray-100 p-3 rounded-lg mb-2 inline-block">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-medium">Start typing to search for skills</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-rose-50 border-l-4 border-rose-400 rounded-r-lg">
          <p className="text-sm text-rose-700 font-medium" role="alert">
            {error}
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-2xl">
        <div className="flex items-start">
          <div className="bg-slate-100 p-2 rounded-lg mr-3">
            <span className="text-lg">💡</span>
          </div>
          <div>
            <h4 className="text-slate-800 font-bold text-sm mb-1">
              Tips for Skill Selection
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Select existing skills from categories or add custom ones by typing. 
              Include both skills you have and ones you want to learn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsMultiSelect;