/**
 * TimeCommitmentSelector - Time commitment selection with recommendations
 * 
 * Features:
 * - Visual time commitment options
 * - Realistic time estimates and expectations
 * - Adaptive suggestions based on experience level
 * - Clear descriptions of what each commitment means
 */

import React from 'react';

export interface TimeCommitmentOption {
  value: 'casual' | 'part-time' | 'intensive' | 'full-time';
  label: string;
  description: string;
  hoursPerWeek: string;
  expectations: string[];
  icon: string;
  recommended?: boolean;
}

export interface TimeCommitmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  error?: string;
  className?: string;
}

const timeCommitmentOptions: TimeCommitmentOption[] = [
  {
    value: 'casual',
    label: 'Casual Learning',
    description: 'Learning at a relaxed pace alongside other commitments',
    hoursPerWeek: '2-5 hours/week',
    expectations: [
      'Flexible schedule',
      'Focus on fundamentals',
      'Gradual progress',
      'Low pressure environment'
    ],
    icon: '🌱'
  },
  {
    value: 'part-time',
    label: 'Part-time Study',
    description: 'Dedicated learning time with consistent progress',
    hoursPerWeek: '6-15 hours/week',
    expectations: [
      'Regular study schedule',
      'Structured learning path',
      'Steady skill development',
      'Balance with other activities'
    ],
    icon: '📚'
  },
  {
    value: 'intensive',
    label: 'Intensive Learning',
    description: 'Focused learning with significant time investment',
    hoursPerWeek: '16-30 hours/week',
    expectations: [
      'Rapid skill acquisition',
      'Deep dive into topics',
      'Project-based learning',
      'Accelerated progress'
    ],
    icon: '🚀'
  },
  {
    value: 'full-time',
    label: 'Full-time Commitment',
    description: 'Immersive learning experience as primary focus',
    hoursPerWeek: '30+ hours/week',
    expectations: [
      'Complete immersion',
      'Professional-level training',
      'Comprehensive skill building',
      'Career transition focus'
    ],
    icon: '💼'
  }
];

export const TimeCommitmentSelector: React.FC<TimeCommitmentSelectorProps> = ({
  value,
  onChange,
  suggestions,
  error,
  className = ''
}) => {
  // Mark suggested options
  const optionsWithRecommendations = timeCommitmentOptions.map(option => ({
    ...option,
    recommended: suggestions.includes(option.value)
  }));

  return (
    <div className={`time-commitment-selector ${className}`}>
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-900 mb-2">
          How much time can you commit to learning? <span className="text-rose-500">*</span>
        </label>
        <p className="text-gray-600 text-sm">
          Be realistic about your available time for consistent progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {optionsWithRecommendations.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`commitment-card group relative p-8 text-left border-3 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-500 focus:ring-offset-2 transform ${
              value === option.value
                ? 'border-emerald-600 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-2xl ring-4 ring-emerald-200'
                : 'border-gray-200 hover:border-emerald-400 bg-white hover:bg-gradient-to-br hover:from-emerald-25 hover:to-teal-25 shadow-lg'
            }`}
            aria-pressed={value === option.value}
          >
            {/* Recommendation Badge */}
            {option.recommended && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-3 py-2 rounded-full shadow-lg border-2 border-white">
                ⭐ Recommended
              </div>
            )}

            {/* Icon and Label */}
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-xl mr-4 ${
                value === option.value 
                  ? 'bg-emerald-200 text-emerald-700' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-600'
              }`}>
                <span className="text-3xl" role="img" aria-label={option.label}>
                  {option.icon}
                </span>
              </div>
              <div>
                <h3 className={`font-bold text-xl ${
                  value === option.value ? 'text-emerald-900' : 'text-gray-800 group-hover:text-emerald-800'
                }`}>
                  {option.label}
                </h3>
                <p className={`text-sm font-bold ${
                  value === option.value ? 'text-emerald-700' : 'text-gray-600 group-hover:text-emerald-600'
                }`}>
                  {option.hoursPerWeek}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className={`text-sm mb-5 font-medium leading-relaxed ${
              value === option.value ? 'text-emerald-800' : 'text-gray-700 group-hover:text-emerald-700'
            }`}>
              {option.description}
            </p>

            {/* Expectations */}
            <div className="space-y-2">
              <p className={`text-xs font-bold uppercase tracking-wide ${
                value === option.value ? 'text-emerald-900' : 'text-gray-800 group-hover:text-emerald-800'
              }`}>
                What to expect:
              </p>
              <div className="space-y-2">
                {option.expectations.map((expectation, index) => (
                  <div 
                    key={index}
                    className={`flex items-center text-sm font-medium ${
                      value === option.value ? 'text-emerald-700' : 'text-gray-600 group-hover:text-emerald-600'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                      value === option.value ? 'bg-emerald-500' : 'bg-gray-400 group-hover:bg-emerald-400'
                    }`}></div>
                    {expectation}
                  </div>
                ))}
              </div>
            </div>

            {/* Selection Indicator */}
            {value === option.value && (
              <div className="absolute top-4 right-4">
                <div className="bg-emerald-600 text-white p-2 rounded-full shadow-lg">
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

      {/* Additional Information */}
      <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl">
        <div className="flex items-start">
          <div className="bg-yellow-100 p-2 rounded-lg mr-4">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-yellow-800 font-bold text-sm mb-1">
              Choose Realistically
            </h4>
            <p className="text-yellow-700 text-sm leading-relaxed">
              Be honest about your available time. It's better to commit to less time consistently 
              than to overcommit and struggle to keep up. You can always increase your commitment later.
            </p>
          </div>
        </div>
      </div>

      {/* Time Management Tips */}
      <div className="mt-4 p-6 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-2xl">
        <div className="flex items-start">
          <div className="bg-slate-100 p-2 rounded-lg mr-4">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h4 className="text-slate-800 font-bold text-sm mb-3">
              Time Management Tips
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                Break learning into smaller sessions
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                Set specific times in your schedule
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                Use focused study techniques
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                Track progress to stay motivated
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeCommitmentSelector;