/**
 * ExperienceLevelSelector - Experience level selection component with adaptive suggestions
 * 
 * Features:
 * - Visual experience level cards with descriptions
 * - Adaptive suggestions based on selected level
 * - Clear visual feedback for selection
 * - Accessibility support
 */

import React from 'react';

export interface ExperienceLevelOption {
  value: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  label: string;
  description: string;
  characteristics: string[];
  icon: string;
}

export interface ExperienceLevelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

const experienceLevels: ExperienceLevelOption[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'New to programming or this technology',
    characteristics: [
      'Learning basic concepts',
      'Following tutorials',
      'Building simple projects'
    ],
    icon: '🌱'
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Some experience with programming concepts',
    characteristics: [
      'Comfortable with basics',
      'Building real applications',
      'Learning best practices'
    ],
    icon: '🌿'
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced developer looking to deepen knowledge',
    characteristics: [
      'Strong foundation',
      'Complex problem solving',
      'Architecture decisions'
    ],
    icon: '🌳'
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Highly experienced, seeking cutting-edge knowledge',
    characteristics: [
      'Deep expertise',
      'Leading projects',
      'Innovation focus'
    ],
    icon: '🏆'
  }
];

export const ExperienceLevelSelector: React.FC<ExperienceLevelSelectorProps> = ({
  value,
  onChange,
  error,
  className = ''
}) => {
  return (
    <div className={`experience-level-selector ${className}`}>
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-900 mb-2">
          What's your experience level? <span className="text-rose-500">*</span>
        </label>
        <p className="text-gray-600 text-sm">
          This helps us create a personalized learning experience tailored to your needs.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experienceLevels.map((level) => (
          <button
            key={level.value}
            type="button"
            onClick={() => onChange(level.value)}
            className={`experience-card group relative p-8 text-left border-3 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2 transform ${
              value === level.value
                ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-2xl text-purple-900 ring-4 ring-purple-200'
                : 'border-gray-200 hover:border-purple-400 bg-white hover:bg-gradient-to-br hover:from-purple-25 hover:to-indigo-25 shadow-lg'
            }`}
            aria-pressed={value === level.value}
            aria-describedby={`${level.value}-description`}
          >
            {/* Icon and Label */}
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-xl mr-4 ${
                value === level.value 
                  ? 'bg-purple-200 text-purple-700' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600'
              }`}>
                <span className="text-3xl" role="img" aria-label={level.label}>
                  {level.icon}
                </span>
              </div>
              <div>
                <h3 className={`font-bold text-xl ${
                  value === level.value ? 'text-purple-900' : 'text-gray-800 group-hover:text-purple-800'
                }`}>
                  {level.label}
                </h3>
              </div>
            </div>
            
            {/* Description */}
            <p 
              id={`${level.value}-description`}
              className={`text-sm mb-5 font-medium leading-relaxed ${
                value === level.value ? 'text-purple-800' : 'text-gray-700 group-hover:text-purple-700'
              }`}
            >
              {level.description}
            </p>
            
            {/* Characteristics */}
            <div className="space-y-2">
              {level.characteristics.map((characteristic, index) => (
                <div 
                  key={index}
                  className={`flex items-center text-sm font-medium ${
                    value === level.value ? 'text-purple-700' : 'text-gray-600 group-hover:text-purple-600'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                    value === level.value ? 'bg-purple-500' : 'bg-gray-400 group-hover:bg-purple-400'
                  }`}></div>
                  {characteristic}
                </div>
              ))}
            </div>
            
            {/* Selection Indicator */}
            {value === level.value && (
              <div className="absolute top-4 right-4">
                <div className="bg-purple-600 text-white p-2 rounded-full shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
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
      <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
        <div className="flex items-start">
          <div className="bg-amber-100 p-2 rounded-lg mr-4">
            <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-amber-800 font-bold text-sm mb-1">Not sure?</h4>
            <p className="text-amber-700 text-sm leading-relaxed">
              Choose the level that best matches where you feel most comfortable. 
              You can always adjust your learning path as you progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceLevelSelector;