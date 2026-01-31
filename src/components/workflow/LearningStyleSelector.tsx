/**
 * LearningStyleSelector - Learning style preference selection
 * 
 * Features:
 * - Visual learning style options with descriptions
 * - Adaptive content recommendations based on style
 * - Multiple style selection support
 * - Clear explanations of each learning approach
 */

import React from 'react';

export interface LearningStyleOption {
  value: 'visual' | 'hands-on' | 'reading' | 'mixed';
  label: string;
  description: string;
  characteristics: string[];
  contentTypes: string[];
  icon: string;
}

export interface LearningStyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

const learningStyleOptions: LearningStyleOption[] = [
  {
    value: 'visual',
    label: 'Visual Learner',
    description: 'Learn best through diagrams, videos, and visual demonstrations',
    characteristics: [
      'Prefer diagrams and flowcharts',
      'Learn from video tutorials',
      'Like visual examples',
      'Remember through images'
    ],
    contentTypes: [
      'Video tutorials',
      'Interactive diagrams',
      'Code visualizations',
      'Infographics'
    ],
    icon: '👁️'
  },
  {
    value: 'hands-on',
    label: 'Hands-on Learner',
    description: 'Learn best by doing, building, and experimenting',
    characteristics: [
      'Learn by building projects',
      'Prefer interactive exercises',
      'Like trial and error',
      'Remember through practice'
    ],
    contentTypes: [
      'Coding exercises',
      'Interactive labs',
      'Project tutorials',
      'Sandbox environments'
    ],
    icon: '🛠️'
  },
  {
    value: 'reading',
    label: 'Reading/Text Learner',
    description: 'Learn best through written content and documentation',
    characteristics: [
      'Prefer detailed explanations',
      'Learn from documentation',
      'Like step-by-step guides',
      'Remember through notes'
    ],
    contentTypes: [
      'Written tutorials',
      'Documentation',
      'Code comments',
      'Text-based guides'
    ],
    icon: '📖'
  },
  {
    value: 'mixed',
    label: 'Mixed Approach',
    description: 'Learn best with a combination of different methods',
    characteristics: [
      'Adapt to different content',
      'Use multiple approaches',
      'Flexible learning style',
      'Comprehensive understanding'
    ],
    contentTypes: [
      'Varied content types',
      'Multi-modal tutorials',
      'Comprehensive courses',
      'Flexible formats'
    ],
    icon: '🎯'
  }
];

export const LearningStyleSelector: React.FC<LearningStyleSelectorProps> = ({
  value,
  onChange,
  error,
  className = ''
}) => {
  return (
    <div className={`learning-style-selector ${className}`}>
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-900 mb-2">
          How do you prefer to learn? <span className="text-rose-500">*</span>
        </label>
        <p className="text-gray-600 text-sm">
          This helps us curate the most effective content and exercises for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {learningStyleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`learning-style-card group relative p-8 text-left border-3 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 transform ${
              value === option.value
                ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-2xl ring-4 ring-indigo-200'
                : 'border-gray-200 hover:border-indigo-400 bg-white hover:bg-gradient-to-br hover:from-indigo-25 hover:to-blue-25 shadow-lg'
            }`}
            aria-pressed={value === option.value}
          >
            {/* Icon and Label */}
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-xl mr-4 ${
                value === option.value 
                  ? 'bg-indigo-200 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
              }`}>
                <span className="text-3xl" role="img" aria-label={option.label}>
                  {option.icon}
                </span>
              </div>
              <h3 className={`font-bold text-xl ${
                value === option.value ? 'text-indigo-900' : 'text-gray-800 group-hover:text-indigo-800'
              }`}>
                {option.label}
              </h3>
            </div>

            {/* Description */}
            <p className={`text-sm mb-5 font-medium leading-relaxed ${
              value === option.value ? 'text-indigo-800' : 'text-gray-700 group-hover:text-indigo-700'
            }`}>
              {option.description}
            </p>

            {/* Characteristics */}
            <div className="mb-5">
              <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${
                value === option.value ? 'text-indigo-900' : 'text-gray-800 group-hover:text-indigo-800'
              }`}>
                You might:
              </p>
              <div className="space-y-2">
                {option.characteristics.map((characteristic, index) => (
                  <div 
                    key={index}
                    className={`flex items-center text-sm font-medium ${
                      value === option.value ? 'text-indigo-700' : 'text-gray-600 group-hover:text-indigo-600'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                      value === option.value ? 'bg-indigo-500' : 'bg-gray-400 group-hover:bg-indigo-400'
                    }`}></div>
                    {characteristic}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Types */}
            <div className="mb-4">
              <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${
                value === option.value ? 'text-indigo-900' : 'text-gray-800 group-hover:text-indigo-800'
              }`}>
                We'll provide:
              </p>
              <div className="flex flex-wrap gap-2">
                {option.contentTypes.map((contentType, index) => (
                  <span
                    key={index}
                    className={`text-xs px-3 py-2 rounded-full font-bold border-2 transition-colors ${
                      value === option.value
                        ? 'bg-indigo-200 text-indigo-800 border-indigo-300'
                        : 'bg-gray-100 text-gray-700 border-gray-200 group-hover:bg-indigo-100 group-hover:text-indigo-700 group-hover:border-indigo-200'
                    }`}
                  >
                    {contentType}
                  </span>
                ))}
              </div>
            </div>

            {/* Selection Indicator */}
            {value === option.value && (
              <div className="absolute top-4 right-4">
                <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg">
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

      {/* Learning Style Information */}
      <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl">
        <div className="flex items-start">
          <div className="bg-indigo-100 p-2 rounded-lg mr-4">
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-indigo-800 font-bold text-sm mb-1">
              Personalized Learning Experience
            </h4>
            <p className="text-indigo-700 text-sm leading-relaxed">
              Your learning style preference helps us curate the most effective content and 
              exercises for you. Don't worry if you're not sure - you can always change this later 
              as you discover what works best.
            </p>
          </div>
        </div>
      </div>

      {/* Learning Tips */}
      <div className="mt-4 p-6 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-2xl">
        <div className="flex items-start">
          <div className="bg-slate-100 p-2 rounded-lg mr-4">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h4 className="text-slate-800 font-bold text-sm mb-3">
              Learning Tips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                Most people benefit from mixed styles
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                Try different approaches
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                Style may vary by topic
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                Active engagement improves retention
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStyleSelector;