import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SimpleEditor } from '../ui/SimpleEditor';
import { 
  DocumentIcon, 
  XIcon as XMarkIcon, 
  PlusIcon,
  FolderIcon,
  DocumentTextIcon,
  CodeIcon as CodeBracketIcon
} from '@heroicons/react/outline';

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

interface CodeEditorPaneProps {
  files?: ProjectFile[];
}

const mockFiles: ProjectFile[] = [
  {
    id: 'file-1',
    name: 'server.ts',
    path: 'src/server.ts',
    content: `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
    language: 'typescript',
    isDirty: false,
  },
  {
    id: 'file-2',
    name: 'package.json',
    path: 'package.json',
    content: `{
  "name": "learning-project",
  "version": "1.0.0",
  "description": "A learning project for reverse engineering",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.5.0"
  }
}`,
    language: 'json',
    isDirty: false,
  },
];

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({ files = mockFiles }) => {
  // Simplified state management without complex store
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(files);
  const [activeFileId, setActiveFileId] = useState<string | null>(files[0]?.id || null);
  const [openFiles, setOpenFiles] = useState<string[]>(files.slice(0, 1).map(f => f.id));
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const editorRef = useRef<any>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Get currently active file
  const activeFile = projectFiles.find(f => f.id === activeFileId) || projectFiles[0];

  // Simplified file management without complex workspace state
  useEffect(() => {
    if (projectFiles.length > 0 && !activeFileId) {
      setActiveFileId(projectFiles[0].id);
      setOpenFiles([projectFiles[0].id]);
    }
  }, [projectFiles, activeFileId]);

  // Handle editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure Monaco theme
    monaco.editor.defineTheme('dark-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#111827',
        'editor.foreground': '#e5e7eb',
        'editorLineNumber.foreground': '#6b7280',
        'editorLineNumber.activeForeground': '#9ca3af',
        'editor.selectionBackground': '#374151',
        'editor.inactiveSelectionBackground': '#1f2937',
      },
    });
    monaco.editor.setTheme('dark-theme');

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveFile();
    });
  };

  // Handle content change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!activeFile || value === undefined) return;

    // Update file content and mark as dirty
    setProjectFiles(prev => prev.map(file => 
      file.id === activeFile.id 
        ? { ...file, content: value, isDirty: true }
        : file
    ));

    // Auto-save after 2 seconds of inactivity
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSaveFile();
    }, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  // Handle file save
  const handleSaveFile = useCallback(() => {
    if (!activeFile || !editorRef.current) return;

    // Simple save - just mark as not dirty
    setProjectFiles(prev => prev.map(file => 
      file.id === activeFile.id 
        ? { ...file, isDirty: false }
        : file
    ));

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, [activeFile]);

  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    setActiveFileId(fileId);
    if (!openFiles.includes(fileId)) {
      setOpenFiles(prev => [...prev, fileId]);
    }
  };

  // Handle file close
  const handleFileClose = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const fileToClose = projectFiles.find(f => f.id === fileId);
    if (fileToClose?.isDirty) {
      // In a real app, show confirmation dialog
      if (!window.confirm('File has unsaved changes. Close anyway?')) {
        return;
      }
    }

    setOpenFiles(prev => prev.filter(id => id !== fileId));
    
    // If closing active file, switch to another open file
    if (fileId === activeFileId) {
      const remainingOpenFiles = openFiles.filter(id => id !== fileId);
      if (remainingOpenFiles.length > 0) {
        setActiveFileId(remainingOpenFiles[0]);
      } else {
        setActiveFileId(null);
      }
    }
  };

  // Handle new file creation
  const handleCreateNewFile = () => {
    if (!newFileName.trim()) return;

    const fileExtension = newFileName.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'js': 'javascript',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'css': 'css',
      'html': 'html',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
    };

    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name: newFileName,
      path: `src/${newFileName}`,
      content: '',
      language: languageMap[fileExtension] || 'plaintext',
      isDirty: false,
    };

    setProjectFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setOpenFiles(prev => [...prev, newFile.id]);
    setNewFileName('');
    setShowNewFileDialog(false);
  };

  // Get file icon based on language
  const getFileIcon = (language: string) => {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return <CodeBracketIcon className="h-4 w-4 text-blue-400" />;
      case 'json':
        return <DocumentTextIcon className="h-4 w-4 text-yellow-400" />;
      case 'markdown':
        return <DocumentIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <DocumentIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get open files for tabs
  const openFilesData = projectFiles.filter(file => openFiles.includes(file.id));

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* File Tabs */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700 min-h-[40px]">
        <div className="flex-1 flex items-center overflow-x-auto">
          {openFilesData.map((file) => (
            <div
              key={file.id}
              className={`flex items-center gap-2 px-3 py-2 border-r border-gray-700 cursor-pointer group min-w-0 ${
                file.id === activeFileId
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              onClick={() => handleFileSelect(file.id)}
            >
              {getFileIcon(file.language)}
              <span className="text-sm truncate">
                {file.name}
                {file.isDirty && <span className="text-yellow-400 ml-1">•</span>}
              </span>
              <button
                onClick={(e) => handleFileClose(file.id, e)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-600 rounded transition-opacity"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        
        {/* New File Button */}
        <button
          onClick={() => setShowNewFileDialog(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="New File"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="bg-gray-800 border-b border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter filename (e.g., app.ts)"
              className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewFile();
                if (e.key === 'Escape') setShowNewFileDialog(false);
              }}
              autoFocus
            />
            <button
              onClick={handleCreateNewFile}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowNewFileDialog(false)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        {activeFile ? (
          <SimpleEditor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              theme: 'dark-theme',
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FolderIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium">No file selected</p>
              <p className="text-sm mt-1">Open a file from the task list or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {activeFile && (
        <div className="bg-gray-800 border-t border-gray-700 px-3 py-1 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>{activeFile.language}</span>
            <span>{activeFile.path}</span>
          </div>
          <div className="flex items-center gap-4">
            {activeFile.isDirty && (
              <span className="text-yellow-400">Unsaved changes</span>
            )}
            <span>Ln 1, Col 1</span>
          </div>
        </div>
      )}
    </div>
  );
};