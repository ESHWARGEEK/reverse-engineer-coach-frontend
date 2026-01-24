import React, { useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';

interface ConceptSuggestion {
  value: string;
  label: string;
  category?: string;
  description?: string;
}

interface ConceptSearchInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onConceptSelect?: (concept: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: string;
  helperText?: string;
  suggestions?: ConceptSuggestion[];
  loading?: boolean;
  required?: boolean;
  id?: string;
}

// Popular programming concepts for autocomplete
const DEFAULT_SUGGESTIONS: ConceptSuggestion[] = [
  // Architectural patterns
  { value: 'microservices architecture', label: 'Microservices Architecture', category: 'Architecture', description: 'Distributed system design with independent services' },
  { value: 'clean architecture', label: 'Clean Architecture', category: 'Architecture', description: 'Layered architecture with dependency inversion' },
  { value: 'hexagonal architecture', label: 'Hexagonal Architecture', category: 'Architecture', description: 'Ports and adapters architectural pattern' },
  { value: 'mvc pattern', label: 'MVC Pattern', category: 'Architecture', description: 'Model-View-Controller design pattern' },
  { value: 'domain driven design', label: 'Domain Driven Design', category: 'Architecture', description: 'Software design approach focused on domain modeling' },
  
  // Design patterns
  { value: 'factory pattern', label: 'Factory Pattern', category: 'Design Patterns', description: 'Creational pattern for object instantiation' },
  { value: 'observer pattern', label: 'Observer Pattern', category: 'Design Patterns', description: 'Behavioral pattern for event notification' },
  { value: 'strategy pattern', label: 'Strategy Pattern', category: 'Design Patterns', description: 'Behavioral pattern for algorithm selection' },
  { value: 'repository pattern', label: 'Repository Pattern', category: 'Design Patterns', description: 'Data access abstraction pattern' },
  { value: 'singleton pattern', label: 'Singleton Pattern', category: 'Design Patterns', description: 'Creational pattern ensuring single instance' },
  
  // Web development
  { value: 'rest api', label: 'REST API', category: 'Web Development', description: 'RESTful web service architecture' },
  { value: 'graphql api', label: 'GraphQL API', category: 'Web Development', description: 'Query language for APIs' },
  { value: 'websocket implementation', label: 'WebSocket Implementation', category: 'Web Development', description: 'Real-time bidirectional communication' },
  { value: 'authentication system', label: 'Authentication System', category: 'Web Development', description: 'User identity verification system' },
  { value: 'oauth implementation', label: 'OAuth Implementation', category: 'Web Development', description: 'Authorization framework implementation' },
  
  // Framework-specific
  { value: 'spring boot application', label: 'Spring Boot Application', category: 'Frameworks', description: 'Java-based enterprise application framework' },
  { value: 'react application', label: 'React Application', category: 'Frameworks', description: 'Component-based UI library' },
  { value: 'express.js server', label: 'Express.js Server', category: 'Frameworks', description: 'Node.js web application framework' },
  { value: 'django web application', label: 'Django Web Application', category: 'Frameworks', description: 'Python web framework' },
  
  // DevOps and deployment
  { value: 'docker containerization', label: 'Docker Containerization', category: 'DevOps', description: 'Application containerization technology' },
  { value: 'kubernetes deployment', label: 'Kubernetes Deployment', category: 'DevOps', description: 'Container orchestration platform' },
  { value: 'ci/cd pipeline', label: 'CI/CD Pipeline', category: 'DevOps', description: 'Continuous integration and deployment' },
  { value: 'monitoring system', label: 'Monitoring System', category: 'DevOps', description: 'Application and infrastructure monitoring' },
  
  // Data and persistence
  { value: 'database design', label: 'Database Design', category: 'Data', description: 'Database schema and architecture design' },
  { value: 'caching strategies', label: 'Caching Strategies', category: 'Data', description: 'Data caching and performance optimization' },
  { value: 'message queues', label: 'Message Queues', category: 'Data', description: 'Asynchronous message processing' },
  { value: 'event streaming', label: 'Event Streaming', category: 'Data', description: 'Real-time event processing systems' },
];

export const ConceptSearchInput: React.FC<ConceptSearchInputProps> = ({
  label,
  placeholder = "Enter a concept to learn (e.g., microservices, clean architecture)...",
  value = "",
  onChange,
  onConceptSelect,
  onFocus,
  onBlur,
  className,
  disabled = false,
  autoFocus = false,
  error,
  helperText,
  suggestions = DEFAULT_SUGGESTIONS,
  loading = false,
  required = false,
  id,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<ConceptSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isComposing, setIsComposing] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputId = id || `concept-search-${Math.random().toString(36).substr(2, 9)}`;

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Filter suggestions based on input
  const filterSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      return suggestions.slice(0, 10); // Show top 10 when empty
    }

    const queryLower = query.toLowerCase();
    const filtered = suggestions.filter(suggestion => 
      suggestion.label.toLowerCase().includes(queryLower) ||
      suggestion.value.toLowerCase().includes(queryLower) ||
      suggestion.description?.toLowerCase().includes(queryLower) ||
      suggestion.category?.toLowerCase().includes(queryLower)
    );

    // Sort by relevance (exact matches first, then starts with, then contains)
    return filtered.sort((a, b) => {
      const aLabel = a.label.toLowerCase();
      const bLabel = b.label.toLowerCase();
      const aValue = a.value.toLowerCase();
      const bValue = b.value.toLowerCase();

      // Exact matches first
      if (aLabel === queryLower || aValue === queryLower) return -1;
      if (bLabel === queryLower || bValue === queryLower) return 1;

      // Starts with matches
      if (aLabel.startsWith(queryLower) || aValue.startsWith(queryLower)) return -1;
      if (bLabel.startsWith(queryLower) || bValue.startsWith(queryLower)) return 1;

      // Alphabetical for remaining
      return aLabel.localeCompare(bLabel);
    }).slice(0, 8); // Limit to 8 suggestions
  }, [suggestions]);

  // Update filtered suggestions when input changes
  useEffect(() => {
    const filtered = filterSuggestions(inputValue);
    setFilteredSuggestions(filtered);
    setSelectedIndex(-1);
  }, [inputValue, filterSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposing) return; // Don't update during IME composition
    
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    setShowSuggestions(true);
  };

  // Handle input focus
  const handleFocus = () => {
    setShowSuggestions(true);
    onFocus?.();
  };

  // Handle input blur (with delay to allow suggestion clicks)
  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      onBlur?.();
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(filteredSuggestions[selectedIndex]);
        } else if (inputValue.trim()) {
          // Allow custom concepts
          selectSuggestion({ value: inputValue.trim(), label: inputValue.trim() });
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: ConceptSuggestion) => {
    setInputValue(suggestion.value);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onChange?.(suggestion.value);
    onConceptSelect?.(suggestion.value);
    inputRef.current?.focus();
  };

  // Handle IME composition
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const newValue = e.currentTarget.value;
    setInputValue(newValue);
    onChange?.(newValue);
    setShowSuggestions(true);
  };

  // Validate concept input
  const validateConcept = (concept: string): string | null => {
    if (!concept.trim()) {
      return required ? 'Learning concept is required' : null;
    }
    
    if (concept.trim().length < 3) {
      return 'Please enter at least 3 characters';
    }
    
    if (concept.trim().length > 200) {
      return 'Concept description is too long (max 200 characters)';
    }
    
    // Check for meaningful content (not just spaces or special characters)
    const meaningfulContent = /[a-zA-Z0-9]/.test(concept);
    if (!meaningfulContent) {
      return 'Please enter a meaningful learning concept';
    }
    
    return null;
  };

  const validationError = error || validateConcept(inputValue);

  return (
    <div className={clsx("relative", className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={placeholder}
          disabled={disabled || loading}
          required={required}
          className={clsx(
            'w-full bg-gray-800 border text-gray-100 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            validationError ? 'border-red-500' : 'border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed',
            loading && 'opacity-75'
          )}
          aria-describedby={`${inputId}-help`}
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
        
        {/* Search icon */}
        {!loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          role="listbox"
          aria-labelledby={inputId}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.value}-${index}`}
              className={clsx(
                'px-3 py-2 cursor-pointer transition-colors',
                index === selectedIndex 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-100 hover:bg-gray-700'
              )}
              onClick={() => selectSuggestion(suggestion)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {suggestion.label}
                  </div>
                  {suggestion.description && (
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {suggestion.description}
                    </div>
                  )}
                </div>
                {suggestion.category && (
                  <div className="ml-2 flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                      {suggestion.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text and errors */}
      <div id={`${inputId}-help`} className="mt-1">
        {validationError && (
          <p className="text-sm text-red-400">
            {validationError}
          </p>
        )}
        {helperText && !validationError && (
          <p className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
};