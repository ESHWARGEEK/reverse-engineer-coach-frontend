import React, { useState, useEffect } from 'react';
import { SearchInput } from './SearchInput';

interface TechnologySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

// Programming languages and concepts that users can learn
const PROGRAMMING_CONCEPTS = [
  // Languages
  'Python', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'Java', 'C++', 'C#',
  
  // Frameworks
  'React', 'Next.js', 'FastAPI', 'Django', 'Flask', 'Express', 'NestJS',
  'Spring Boot', 'Gin', 'Echo', 'Actix', 'Warp', 'ASP.NET',
  
  // Architecture Patterns
  'Microservices Architecture', 'Event-Driven Architecture', 'CQRS Pattern',
  'Domain-Driven Design', 'Hexagonal Architecture', 'Clean Architecture',
  'MVC Pattern', 'MVP Pattern', 'MVVM Pattern', 'Repository Pattern',
  'Factory Pattern', 'Observer Pattern', 'Strategy Pattern', 'Decorator Pattern',
  
  // System Design Concepts
  'Database Design', 'API Design', 'REST API', 'GraphQL', 'gRPC',
  'Message Queues', 'Pub/Sub Pattern', 'Load Balancing', 'Caching Strategies',
  'Database Indexing', 'Database Sharding', 'Database Replication',
  'Distributed Systems', 'Consensus Algorithms', 'CAP Theorem',
  
  // DevOps & Infrastructure
  'Docker', 'Kubernetes', 'CI/CD Pipelines', 'Infrastructure as Code',
  'Monitoring and Logging', 'Service Mesh', 'API Gateway',
  
  // Data Structures & Algorithms
  'Binary Trees', 'Hash Tables', 'Graph Algorithms', 'Dynamic Programming',
  'Sorting Algorithms', 'Search Algorithms', 'Tree Traversal',
  
  // Concurrency & Performance
  'Multithreading', 'Async Programming', 'Coroutines', 'Thread Pools',
  'Lock-Free Programming', 'Memory Management', 'Garbage Collection',
  'Performance Optimization', 'Profiling and Debugging',
  
  // Security
  'Authentication', 'Authorization', 'JWT Tokens', 'OAuth 2.0',
  'Encryption', 'Hashing', 'SQL Injection Prevention', 'XSS Prevention',
  'CSRF Protection', 'Rate Limiting',
  
  // Testing
  'Unit Testing', 'Integration Testing', 'End-to-End Testing',
  'Test-Driven Development', 'Behavior-Driven Development',
  'Mocking and Stubbing', 'Property-Based Testing',
  
  // Specific Technologies
  'Redis', 'PostgreSQL', 'MongoDB', 'Elasticsearch', 'RabbitMQ',
  'Apache Kafka', 'Nginx', 'Apache HTTP Server', 'WebSockets',
  'Server-Sent Events', 'WebRTC',
];

// Popular technology combinations and learning paths
const LEARNING_PATHS = [
  'Full-Stack Web Development',
  'Backend API Development',
  'Frontend Development',
  'Mobile App Development',
  'DevOps Engineering',
  'Data Engineering',
  'Machine Learning Engineering',
  'Cloud Architecture',
  'Game Development',
  'Blockchain Development',
];

// Combine all suggestions
const ALL_SUGGESTIONS = [
  ...PROGRAMMING_CONCEPTS,
  ...LEARNING_PATHS,
].sort();

export const TechnologySelector: React.FC<TechnologySelectorProps> = ({
  value,
  onChange,
  placeholder = "What programming language or concept do you want to learn?",
  label = "Technology or Concept",
  error,
  className
}) => {
  const [suggestions, setSuggestions] = useState<string[]>(ALL_SUGGESTIONS);

  // Use default suggestions without user personalization
  useEffect(() => {
    setSuggestions(ALL_SUGGESTIONS);
  }, []);

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <SearchInput
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      suggestions={suggestions}
      error={error}
      helperText="Start typing to see suggestions based on your preferences"
      className={className}
    />
  );
};