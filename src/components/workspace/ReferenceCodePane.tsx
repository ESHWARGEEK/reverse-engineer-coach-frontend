import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store';
import { 
  LinkIcon, 
  EyeIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  DocumentTextIcon,
  CodeIcon as CodeBracketIcon
} from '@heroicons/react/outline';

export interface ReferenceSnippet {
  id: string;
  title: string;
  description: string;
  githubUrl: string;
  filePath: string;
  startLine: number;
  endLine: number;
  code: string;
  language: string;
  taskIds: string[];
  relevanceScore: number;
  tags: string[];
}

interface ReferenceCodePaneProps {
  snippets?: ReferenceSnippet[];
}

const mockSnippets: ReferenceSnippet[] = [
  {
    id: 'snippet-1',
    title: 'Express Server Setup',
    description: 'Basic Express.js server configuration with middleware',
    githubUrl: 'https://github.com/expressjs/express/blob/main/examples/hello-world/index.js',
    filePath: 'examples/hello-world/index.js',
    startLine: 1,
    endLine: 15,
    code: `const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(\`Example app listening on port \${port}\`)
})`,
    language: 'javascript',
    taskIds: ['task-1', 'task-2'],
    relevanceScore: 0.95,
    tags: ['express', 'server', 'basic-setup'],
  },
  {
    id: 'snippet-2',
    title: 'Route Handler Pattern',
    description: 'Modular route handling with Express Router',
    githubUrl: 'https://github.com/expressjs/express/blob/main/examples/route-separation/index.js',
    filePath: 'examples/route-separation/index.js',
    startLine: 20,
    endLine: 35,
    code: `const express = require('express')
const router = express.Router()

// middleware that is specific to this router
router.use((req, res, next) => {
  console.log('Time: ', Date.now())
  next()
})

// define the home page route
router.get('/', (req, res) => {
  res.send('Birds home page')
})

module.exports = router`,
    language: 'javascript',
    taskIds: ['task-3'],
    relevanceScore: 0.88,
    tags: ['express', 'routing', 'middleware'],
  },
  {
    id: 'snippet-3',
    title: 'Database Connection',
    description: 'MongoDB connection setup with error handling',
    githubUrl: 'https://github.com/mongodb/node-mongodb-native/blob/main/examples/connect.js',
    filePath: 'examples/connect.js',
    startLine: 5,
    endLine: 25,
    code: `const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('myapp');
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

module.exports = { connectToDatabase };`,
    language: 'javascript',
    taskIds: ['task-4'],
    relevanceScore: 0.92,
    tags: ['mongodb', 'database', 'connection'],
  },
];

export const ReferenceCodePane: React.FC<ReferenceCodePaneProps> = ({ snippets = mockSnippets }) => {
  const { workspace } = useAppStore();
  const [expandedSnippets, setExpandedSnippets] = useState<Set<string>>(new Set());
  const [filteredSnippets, setFilteredSnippets] = useState<ReferenceSnippet[]>(snippets);

  // Filter snippets based on selected task
  useEffect(() => {
    if (workspace.selectedTaskId) {
      const taskRelevantSnippets = snippets.filter(snippet => 
        snippet.taskIds.includes(workspace.selectedTaskId!)
      );
      
      // If no task-specific snippets, show all snippets
      setFilteredSnippets(taskRelevantSnippets.length > 0 ? taskRelevantSnippets : snippets);
    } else {
      setFilteredSnippets(snippets);
    }
  }, [workspace.selectedTaskId, snippets]);

  const toggleSnippetExpansion = (snippetId: string) => {
    const newExpanded = new Set(expandedSnippets);
    if (newExpanded.has(snippetId)) {
      newExpanded.delete(snippetId);
    } else {
      newExpanded.add(snippetId);
    }
    setExpandedSnippets(newExpanded);
  };

  const handleGitHubLinkClick = (githubUrl: string, startLine?: number) => {
    let url = githubUrl;
    if (startLine) {
      url += `#L${startLine}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return <CodeBracketIcon className="h-4 w-4 text-yellow-400" />;
      case 'python':
        return <CodeBracketIcon className="h-4 w-4 text-blue-400" />;
      case 'go':
        return <CodeBracketIcon className="h-4 w-4 text-cyan-400" />;
      case 'rust':
        return <CodeBracketIcon className="h-4 w-4 text-orange-400" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-medium text-white mb-2">Reference Code</h2>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{filteredSnippets.length} snippets</span>
          {workspace.selectedTaskId && (
            <span className="text-blue-400">Filtered by task</span>
          )}
        </div>
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSnippets.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium">No reference code available</p>
            <p className="text-sm mt-1">Reference snippets will appear here when available</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredSnippets
              .sort((a, b) => b.relevanceScore - a.relevanceScore)
              .map((snippet) => {
                const isExpanded = expandedSnippets.has(snippet.id);
                const isHighlighted = workspace.selectedTaskId && 
                  snippet.taskIds.includes(workspace.selectedTaskId);
                
                return (
                  <div
                    key={snippet.id}
                    className={`rounded-lg border transition-all duration-200 ${
                      isHighlighted 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {/* Snippet Header */}
                    <div
                      className="p-3 cursor-pointer"
                      onClick={() => toggleSnippetExpansion(snippet.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getLanguageIcon(snippet.language)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-white text-sm leading-tight">
                              {snippet.title}
                            </h3>
                            <span className={`text-xs ${getRelevanceColor(snippet.relevanceScore)}`}>
                              {Math.round(snippet.relevanceScore * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                            {snippet.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <DocumentTextIcon className="h-3 w-3" />
                              {snippet.language}
                            </span>
                            <span>{snippet.filePath}</span>
                            <span>L{snippet.startLine}-{snippet.endLine}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGitHubLinkClick(snippet.githubUrl, snippet.startLine);
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Open in GitHub"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-white transition-colors">
                            {isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Code View */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-600">
                        <div className="mt-3">
                          {/* Tags */}
                          {snippet.tags.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {snippet.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Code Block */}
                          <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                            <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
                              <span>{snippet.filePath}</span>
                              <div className="flex items-center gap-2">
                                <span>Lines {snippet.startLine}-{snippet.endLine}</span>
                                <button
                                  onClick={() => handleGitHubLinkClick(snippet.githubUrl, snippet.startLine)}
                                  className="flex items-center gap-1 hover:text-white transition-colors"
                                >
                                  <EyeIcon className="h-3 w-3" />
                                  View
                                </button>
                              </div>
                            </div>
                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                              <code>{snippet.code}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};