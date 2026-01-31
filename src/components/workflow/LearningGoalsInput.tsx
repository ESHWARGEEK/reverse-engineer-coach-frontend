/**
 * LearningGoalsInput - Learning goals input with intelligent suggestions
 * 
 * Features:
 * - Rich text input with suggestions
 * - Context-aware suggestions based on experience level and skills
 * - Goal templates and examples
 * - Character count and validation
 * - Smart formatting assistance
 */

import React, { useState, useEffect } from 'react';

export interface LearningGoalsInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  experienceLevel: string;
  currentSkills: string[];
  error?: string;
  className?: string;
}

export interface GoalTemplate {
  title: string;
  template: string;
  category: string;
  experienceLevel: string[];
}

const goalTemplates: GoalTemplate[] = [
  {
    title: 'Build a Portfolio Project',
    template: 'I want to build a {project_type} that demonstrates my skills in {technologies}. This project will help me showcase my abilities to potential employers and deepen my understanding of {concepts}.',
    category: 'Project-based',
    experienceLevel: ['beginner', 'intermediate']
  },
  {
    title: 'Master a Technology',
    template: 'I want to become proficient in {technology} by understanding its core concepts, best practices, and real-world applications. My goal is to be able to build production-ready applications using this technology.',
    category: 'Skill Development',
    experienceLevel: ['beginner', 'intermediate', 'advanced']
  },
  {
    title: 'Career Transition',
    template: 'I want to transition into {role} by developing the necessary technical skills and understanding industry best practices. I aim to be job-ready within {timeframe} and contribute effectively to development teams.',
    category: 'Career',
    experienceLevel: ['beginner', 'intermediate']
  },
  {
    title: 'System Design & Architecture',
    template: 'I want to learn how to design scalable, maintainable systems and understand architectural patterns. My goal is to make informed decisions about system design and lead technical discussions.',
    category: 'Architecture',
    experienceLevel: ['intermediate', 'advanced', 'expert']
  },
  {
    title: 'Performance Optimization',
    template: 'I want to learn how to identify performance bottlenecks and optimize applications for better speed and efficiency. This includes understanding profiling tools, optimization techniques, and best practices.',
    category: 'Performance',
    experienceLevel: ['intermediate', 'advanced', 'expert']
  },
  {
    title: 'Open Source Contribution',
    template: 'I want to contribute to open source projects to give back to the community and improve my coding skills. My goal is to make meaningful contributions and collaborate with other developers.',
    category: 'Community',
    experienceLevel: ['intermediate', 'advanced', 'expert']
  }
];

export const LearningGoalsInput: React.FC<LearningGoalsInputProps> = ({
  value,
  onChange,
  suggestions,
  experienceLevel,
  currentSkills,
  error,
  className = ''
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Filter templates based on experience level
  const relevantTemplates = goalTemplates.filter(template =>
    template.experienceLevel.includes(experienceLevel)
  );

  // Generate contextual suggestions
  const generateContextualSuggestions = (): string[] => {
    const contextualSuggestions: string[] = [...suggestions];
    
    // Add skill-specific suggestions
    if (currentSkills.includes('React')) {
      contextualSuggestions.push('Build a React application with modern hooks and state management');
    }
    if (currentSkills.includes('Node.js')) {
      contextualSuggestions.push('Create a RESTful API with Node.js and Express');
    }
    if (currentSkills.includes('Python')) {
      contextualSuggestions.push('Develop a Python application with data processing capabilities');
    }
    if (currentSkills.includes('Machine Learning')) {
      contextualSuggestions.push('Build and deploy a machine learning model');
    }

    // Add experience-level specific suggestions
    switch (experienceLevel) {
      case 'beginner':
        contextualSuggestions.push(
          'Learn programming fundamentals through hands-on projects',
          'Build confidence in problem-solving and debugging',
          'Understand version control and collaborative development'
        );
        break;
      case 'intermediate':
        contextualSuggestions.push(
          'Master advanced features and best practices',
          'Learn testing and code quality practices',
          'Understand deployment and DevOps basics'
        );
        break;
      case 'advanced':
        contextualSuggestions.push(
          'Design scalable and maintainable architectures',
          'Lead technical projects and mentor others',
          'Contribute to open source and technical communities'
        );
        break;
      case 'expert':
        contextualSuggestions.push(
          'Research and implement cutting-edge technologies',
          'Drive technical innovation and standards',
          'Share knowledge through teaching and writing'
        );
        break;
    }

    return Array.from(new Set(contextualSuggestions));
  };

  const contextualSuggestions = generateContextualSuggestions();

  // Handle template selection
  const handleTemplateSelect = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    onChange(template.template);
    setShowTemplates(false);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    const newValue = value ? `${value}\n\n${suggestion}` : suggestion;
    onChange(newValue);
    setShowSuggestions(false);
  };

  // Smart formatting helpers
  const formatGoals = (text: string): string => {
    // Add bullet points for multiple goals
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      return lines.map(line => line.trim().startsWith('•') ? line : `• ${line.trim()}`).join('\n');
    }
    return text;
  };

  return (
    <div className={`learning-goals-input ${className}`}>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        What are your learning goals? <span className="text-red-500">*</span>
      </label>

      {/* Template Suggestions */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Use a goal template
        </button>

        {showTemplates && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Choose a template to get started:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {relevantTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-3 bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">
                    {template.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {template.category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text Area */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Describe what you want to achieve through this learning experience..."
          rows={6}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical text-gray-900 placeholder-gray-500 ${
            error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
          }`}
          maxLength={500}
        />

        {/* Character Count */}
        <div className="flex justify-between items-center mt-1">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <p className={`text-sm ml-auto ${
            value.length > 450 ? 'text-red-500' : 'text-gray-500'
          }`}>
            {value.length}/500
          </p>
        </div>
      </div>

      {/* Contextual Suggestions */}
      {showSuggestions && contextualSuggestions.length > 0 && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-blue-900">
              Suggestions based on your experience and skills:
            </p>
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {contextualSuggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full text-left p-3 text-sm text-blue-800 bg-white border border-blue-200 rounded-md hover:border-blue-300 hover:bg-blue-100 hover:text-blue-900 transition-colors shadow-sm"
              >
                <span className="font-medium">{suggestion}</span>
              </button>
            ))}
          </div>
          {contextualSuggestions.length > 5 && (
            <p className="text-xs text-blue-700 mt-2">
              Showing 5 of {contextualSuggestions.length} suggestions
            </p>
          )}
        </div>
      )}

      {/* Formatting Helper */}
      {value && (
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onChange(formatGoals(value))}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Format as bullet points
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Tips:</strong> Be specific about what you want to learn and achieve. 
          Include both technical skills and practical outcomes. Consider your timeline and how success will be measured.
        </p>
      </div>
    </div>
  );
};

export default LearningGoalsInput;