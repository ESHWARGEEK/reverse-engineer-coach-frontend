/**
 * SkillAssessmentForm - Comprehensive skill assessment form with intelligent suggestions
 * 
 * Features:
 * - Experience level selector with adaptive suggestions
 * - Current skills multi-select with autocomplete
 * - Learning goals input with intelligent suggestions
 * - Time commitment and learning style selectors
 * - Form validation and error handling
 * - AI-ready data structure
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ExperienceLevelSelector } from './ExperienceLevelSelector';
import { SkillsMultiSelect } from './SkillsMultiSelect';
import { LearningGoalsInput } from './LearningGoalsInput';
import { TimeCommitmentSelector } from './TimeCommitmentSelector';
import { LearningStyleSelector } from './LearningStyleSelector';

export interface SkillAssessmentData {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | '';
  currentSkills: string[];
  learningGoals: string;
  timeCommitment: 'casual' | 'part-time' | 'intensive' | 'full-time' | '';
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed' | '';
  preferredPace: 'slow' | 'moderate' | 'fast' | '';
  motivation: string;
  previousExperience: string;
}

export interface SkillAssessmentFormProps {
  initialData?: Partial<SkillAssessmentData>;
  onDataChange: (data: SkillAssessmentData) => void;
  onValidationChange: (isValid: boolean, errors: Record<string, string>) => void;
  className?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const SkillAssessmentForm: React.FC<SkillAssessmentFormProps> = ({
  initialData = {},
  onDataChange,
  onValidationChange,
  className = ''
}) => {
  const [formData, setFormData] = useState<SkillAssessmentData>({
    experienceLevel: '',
    currentSkills: [],
    learningGoals: '',
    timeCommitment: '',
    learningStyle: '',
    preferredPace: '',
    motivation: '',
    previousExperience: '',
    ...initialData
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation rules
  const validateField = useCallback((field: keyof SkillAssessmentData, value: any): string => {
    switch (field) {
      case 'experienceLevel':
        return !value ? 'Please select your experience level' : '';
      
      case 'currentSkills':
        if (!Array.isArray(value) || value.length === 0) {
          return 'Please select at least one current skill or area of interest';
        }
        return '';
      
      case 'learningGoals':
        if (!value || value.trim().length < 10) {
          return 'Please provide learning goals (at least 10 characters)';
        }
        if (value.trim().length > 500) {
          return 'Learning goals should be under 500 characters';
        }
        return '';
      
      case 'timeCommitment':
        return !value ? 'Please select your time commitment' : '';
      
      case 'learningStyle':
        return !value ? 'Please select your preferred learning style' : '';
      
      case 'motivation':
        if (!value || value.trim().length < 5) {
          return 'Please share your motivation (at least 5 characters)';
        }
        if (value.trim().length > 300) {
          return 'Motivation should be under 300 characters';
        }
        return '';
      
      default:
        return '';
    }
  }, []);

  // Validate all fields
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    (Object.keys(formData) as Array<keyof SkillAssessmentData>).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field as keyof ValidationErrors] = error;
      }
    });

    return newErrors;
  }, [formData, validateField]);

  // Update field value
  const updateField = useCallback((field: keyof SkillAssessmentData, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field
    const fieldError = validateField(field, value);
    const newErrors = { ...errors };
    
    if (fieldError) {
      newErrors[field as keyof ValidationErrors] = fieldError;
    } else {
      delete newErrors[field as keyof ValidationErrors];
    }
    
    setErrors(newErrors);
    
    // Notify parent of data change
    onDataChange(newFormData);
  }, [formData, errors, validateField, onDataChange]);

  // Effect to notify parent of validation changes
  useEffect(() => {
    const currentErrors = validateForm();
    const isValid = Object.keys(currentErrors).length === 0;
    onValidationChange(isValid, currentErrors);
  }, [formData, validateForm, onValidationChange]);

  // Get suggestions based on experience level
  const getSuggestionsForLevel = useCallback((level: string): {
    skills: string[];
    goals: string[];
    timeCommitment: string[];
  } => {
    switch (level) {
      case 'beginner':
        return {
          skills: [
            'HTML/CSS', 'JavaScript Basics', 'Git Basics', 'Command Line',
            'Problem Solving', 'Basic Algorithms', 'Web Development Fundamentals'
          ],
          goals: [
            'Learn programming fundamentals',
            'Build my first web application',
            'Understand basic software concepts',
            'Get comfortable with development tools'
          ],
          timeCommitment: ['casual', 'part-time']
        };
      
      case 'intermediate':
        return {
          skills: [
            'React/Vue/Angular', 'Node.js', 'Databases', 'API Development',
            'Testing', 'DevOps Basics', 'Data Structures', 'Design Patterns'
          ],
          goals: [
            'Master a specific framework',
            'Build full-stack applications',
            'Improve code quality and architecture',
            'Learn advanced development practices'
          ],
          timeCommitment: ['part-time', 'intensive']
        };
      
      case 'advanced':
        return {
          skills: [
            'System Design', 'Microservices', 'Cloud Platforms', 'Performance Optimization',
            'Security', 'Machine Learning', 'DevOps/CI/CD', 'Architecture Patterns'
          ],
          goals: [
            'Design scalable systems',
            'Lead technical projects',
            'Optimize application performance',
            'Implement advanced architectural patterns'
          ],
          timeCommitment: ['intensive', 'full-time']
        };
      
      case 'expert':
        return {
          skills: [
            'Distributed Systems', 'Advanced Algorithms', 'Research & Development',
            'Technical Leadership', 'Innovation', 'Emerging Technologies'
          ],
          goals: [
            'Research cutting-edge technologies',
            'Mentor and lead development teams',
            'Contribute to open source projects',
            'Drive technical innovation'
          ],
          timeCommitment: ['intensive', 'full-time']
        };
      
      default:
        return { skills: [], goals: [], timeCommitment: [] };
    }
  }, []);

  const suggestions = getSuggestionsForLevel(formData.experienceLevel);

  return (
    <div className={`skill-assessment-form space-y-8 ${className}`}>
      <div className="form-header">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about your skills and goals
        </h2>
        <p className="text-gray-600">
          This helps us create a personalized learning experience tailored to your needs.
        </p>
      </div>

      {/* Experience Level */}
      <div className="form-section">
        <ExperienceLevelSelector
          value={formData.experienceLevel}
          onChange={(value) => updateField('experienceLevel', value)}
          error={touched.experienceLevel ? errors.experienceLevel : undefined}
          className="mb-6"
        />
      </div>

      {/* Current Skills */}
      <div className="form-section">
        <SkillsMultiSelect
          value={formData.currentSkills}
          onChange={(value) => updateField('currentSkills', value)}
          suggestions={suggestions.skills}
          experienceLevel={formData.experienceLevel}
          error={touched.currentSkills ? errors.currentSkills : undefined}
          className="mb-6"
        />
      </div>

      {/* Learning Goals */}
      <div className="form-section">
        <LearningGoalsInput
          value={formData.learningGoals}
          onChange={(value) => updateField('learningGoals', value)}
          suggestions={suggestions.goals}
          experienceLevel={formData.experienceLevel}
          currentSkills={formData.currentSkills}
          error={touched.learningGoals ? errors.learningGoals : undefined}
          className="mb-6"
        />
      </div>

      {/* Time Commitment */}
      <div className="form-section">
        <TimeCommitmentSelector
          value={formData.timeCommitment}
          onChange={(value) => updateField('timeCommitment', value)}
          suggestions={suggestions.timeCommitment}
          error={touched.timeCommitment ? errors.timeCommitment : undefined}
          className="mb-6"
        />
      </div>

      {/* Learning Style */}
      <div className="form-section">
        <LearningStyleSelector
          value={formData.learningStyle}
          onChange={(value) => updateField('learningStyle', value)}
          error={touched.learningStyle ? errors.learningStyle : undefined}
          className="mb-6"
        />
      </div>

      {/* Preferred Pace */}
      <div className="form-section">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Preferred Learning Pace
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'slow', label: 'Take my time', description: 'Thorough understanding' },
            { value: 'moderate', label: 'Steady progress', description: 'Balanced approach' },
            { value: 'fast', label: 'Quick learner', description: 'Rapid advancement' }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateField('preferredPace', option.value)}
              className={`p-4 text-left border-2 rounded-lg transition-colors font-medium ${
                formData.preferredPace === option.value
                  ? 'border-blue-600 bg-blue-100 text-blue-900'
                  : 'border-gray-300 hover:border-blue-400 bg-white hover:bg-blue-50 text-gray-900'
              }`}
            >
              <div className="font-semibold text-lg text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-700 font-medium">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Motivation */}
      <div className="form-section">
        <label htmlFor="motivation" className="block text-sm font-medium text-gray-900 mb-2">
          What motivates you to learn? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="motivation"
          value={formData.motivation}
          onChange={(e) => updateField('motivation', e.target.value)}
          onBlur={() => setTouched(prev => ({ ...prev, motivation: true }))}
          placeholder="Share what drives your learning journey..."
          rows={3}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
            touched.motivation && errors.motivation
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300'
          }`}
          maxLength={300}
        />
        <div className="flex justify-between items-center mt-1">
          {touched.motivation && errors.motivation && (
            <p className="text-sm text-red-600">{errors.motivation}</p>
          )}
          <p className="text-sm text-gray-500 ml-auto">
            {formData.motivation.length}/300
          </p>
        </div>
      </div>

      {/* Previous Experience */}
      <div className="form-section">
        <label htmlFor="previousExperience" className="block text-sm font-medium text-gray-900 mb-2">
          Previous Learning Experience (Optional)
        </label>
        <textarea
          id="previousExperience"
          value={formData.previousExperience}
          onChange={(e) => updateField('previousExperience', e.target.value)}
          placeholder="Tell us about your previous learning experiences, challenges, or successes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          maxLength={400}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.previousExperience.length}/400
        </p>
      </div>

      {/* Form Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="form-errors bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Please fix the following errors:
          </h4>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.values(errors).map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SkillAssessmentForm;