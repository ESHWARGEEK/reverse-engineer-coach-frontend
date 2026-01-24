import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/outline';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  instructions?: string;
  estimatedTime?: string;
  dependencies?: string[];
}

interface TaskListPaneProps {
  tasks?: Task[];
}

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Set up project structure',
    description: 'Create the basic project structure and initialize dependencies',
    status: 'completed',
    instructions: `1. Create a new directory for your project
2. Initialize a package.json file
3. Install required dependencies:
   - Express.js for the server
   - TypeScript for type safety
   - Jest for testing
4. Set up basic folder structure:
   - src/ for source code
   - tests/ for test files
   - dist/ for compiled output`,
    estimatedTime: '30 minutes',
  },
  {
    id: 'task-2',
    title: 'Implement basic HTTP server',
    description: 'Create a simple HTTP server using Express.js',
    status: 'in_progress',
    instructions: `1. Create src/server.ts file
2. Import Express and create an app instance
3. Set up basic middleware:
   - Body parser for JSON
   - CORS for cross-origin requests
   - Error handling middleware
4. Define a simple health check endpoint
5. Start the server on port 3000`,
    estimatedTime: '45 minutes',
    dependencies: ['task-1'],
  },
  {
    id: 'task-3',
    title: 'Add request routing',
    description: 'Implement routing for different API endpoints',
    status: 'not_started',
    instructions: `1. Create src/routes/ directory
2. Implement user routes (GET, POST, PUT, DELETE)
3. Implement authentication routes
4. Add input validation middleware
5. Connect routes to the main app`,
    estimatedTime: '60 minutes',
    dependencies: ['task-2'],
  },
  {
    id: 'task-4',
    title: 'Database integration',
    description: 'Connect to database and implement data models',
    status: 'not_started',
    instructions: `1. Choose and install database driver (e.g., mongoose for MongoDB)
2. Create database connection module
3. Define data models/schemas
4. Implement CRUD operations
5. Add database error handling`,
    estimatedTime: '90 minutes',
    dependencies: ['task-2'],
  },
];

export const TaskListPane: React.FC<TaskListPaneProps> = ({ tasks = mockTasks }) => {
  // Use simple state management instead of complex store
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'not_started':
        return <div className="h-5 w-5 border-2 border-gray-400 rounded-full" />;
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
    }
  };

  const getProgressPercentage = () => {
    const completed = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-white mb-2">Learning Tasks</h2>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{tasks.filter(t => t.status === 'completed').length} of {tasks.length} completed</span>
          <span>{getProgressPercentage()}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {tasks.map((task) => {
            const isExpanded = expandedTasks.has(task.id);
            const isSelected = selectedTaskId === task.id;
            
            return (
              <div
                key={task.id}
                className={`rounded-lg border transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {/* Task Header */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => handleTaskSelect(task.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm leading-tight">
                        {task.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                          {getStatusText(task.status)}
                        </span>
                        {task.estimatedTime && (
                          <span>{task.estimatedTime}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskExpansion(task.id);
                      }}
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Instructions */}
                {isExpanded && task.instructions && (
                  <div className="px-3 pb-3 border-t border-gray-600">
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-white mb-2">Instructions:</h4>
                      <div className="text-sm text-gray-300 whitespace-pre-line bg-gray-800 rounded p-3 font-mono">
                        {task.instructions}
                      </div>
                    </div>
                    
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-white mb-2">Dependencies:</h4>
                        <div className="flex flex-wrap gap-1">
                          {task.dependencies.map((depId) => {
                            const depTask = tasks.find(t => t.id === depId);
                            return (
                              <span
                                key={depId}
                                className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded"
                              >
                                {depTask?.title || depId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};