import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { CodeEditorPane, ProjectFile } from '../workspace/CodeEditorPane';

// Feature: reverse-engineer-coach, Property 9: Code Editor Language Support
// **Property 9: Code Editor Language Support**
// **Validates: Requirements 5.1, 5.5**

// Create a mock store with all required functions
const mockStore = {
  workspace: {
    selectedTaskId: null,
    openFiles: [],
    activeFileId: null,
    layoutConfig: {
      leftPaneWidth: 25,
      rightPaneWidth: 33,
    },
  },
  setSelectedTaskId: jest.fn(),
  addOpenFile: jest.fn(),
  removeOpenFile: jest.fn(),
  setActiveFileId: jest.fn(),
  updateLayoutConfig: jest.fn(),
  openFile: jest.fn(),
  closeFile: jest.fn(),
  setActiveFile: jest.fn(),
};

// Mock the store
jest.mock('../../store', () => ({
  useAppStore: () => mockStore,
}));

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ language, value, options }: any) => (
      <div 
        data-testid="monaco-editor"
        data-language={language}
        data-value={value}
        data-options={JSON.stringify(options)}
      >
        Monaco Editor Mock - Language: {language}
      </div>
    ),
  };
});

// Mock Heroicons
jest.mock('@heroicons/react/outline', () => ({
  DocumentIcon: () => <div data-testid="document-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  PlusIcon: () => <div data-testid="plus-icon" />,
  FolderIcon: () => <div data-testid="folder-icon" />,
  DocumentTextIcon: () => <div data-testid="document-text-icon" />,
  CodeBracketIcon: () => <div data-testid="code-bracket-icon" />,
}));

describe('CodeEditorPane Language Support Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store state
    mockStore.workspace = {
      selectedTaskId: null,
      openFiles: [],
      activeFileId: null,
      layoutConfig: {
        leftPaneWidth: 25,
        rightPaneWidth: 33,
      },
    };
  });

  afterEach(() => {
    cleanup();
  });

  // Helper function to render component with proper React context
  const renderWithContext = (component: React.ReactElement) => {
    return render(
      <React.StrictMode>
        {component}
      </React.StrictMode>
    );
  };

  test('Property 9: Code Editor Language Support - editor should support various programming languages', () => {
    fc.assert(
      fc.property(
        fc.record({
          language: fc.constantFrom(
            'typescript', 'javascript', 'python', 'go', 'rust', 
            'java', 'cpp', 'c', 'json', 'markdown', 'html', 'css'
          ),
          fileName: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '')).filter(s => s.length > 0),
          content: fc.string({ minLength: 0, maxLength: 1000 }),
        }),
        (config) => {
          const testFile: ProjectFile = {
            id: 'test-file',
            name: `${config.fileName}.${getExtensionForLanguage(config.language)}`,
            path: `src/${config.fileName}.${getExtensionForLanguage(config.language)}`,
            content: config.content,
            language: config.language,
            isDirty: false,
          };

          // Set the file as active in the mock store
          mockStore.workspace.openFiles = [testFile.id];
          mockStore.workspace.activeFileId = testFile.id;

          const { unmount } = renderWithContext(<CodeEditorPane files={[testFile]} />);

          try {
            // Verify Monaco editor is rendered with correct language
            const editor = screen.getByTestId('monaco-editor');
            expect(editor).toBeInTheDocument();
            expect(editor).toHaveAttribute('data-language', config.language);
            expect(editor).toHaveAttribute('data-value', config.content);

            // Verify editor options are set correctly
            const optionsAttr = editor.getAttribute('data-options');
            expect(optionsAttr).toBeTruthy();
            const options = JSON.parse(optionsAttr!);
            expect(options).toHaveProperty('minimap');
            expect(options).toHaveProperty('fontSize');
            expect(options).toHaveProperty('lineNumbers');
            expect(options.theme).toBe('dark-theme');
          } finally {
            // Clean up
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 9: Code Editor Language Support - file icons should match language types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'typescript', 'javascript', 'python', 'go', 'rust', 
          'java', 'cpp', 'c', 'json', 'markdown', 'html', 'css'
        ),
        (language) => {
          const testFile: ProjectFile = {
            id: 'test-file',
            name: `test.${getExtensionForLanguage(language)}`,
            path: `src/test.${getExtensionForLanguage(language)}`,
            content: '// test content',
            language: language,
            isDirty: false,
          };

          // Set the file as active in the mock store
          mockStore.workspace.openFiles = [testFile.id];
          mockStore.workspace.activeFileId = testFile.id;

          const { unmount } = renderWithContext(<CodeEditorPane files={[testFile]} />);

          try {
            // Verify appropriate icon is displayed based on language
            const expectedIcon = getExpectedIconForLanguage(language);
            const icon = screen.getByTestId(expectedIcon);
            expect(icon).toBeInTheDocument();

            // Verify file tab shows correct language info
            const statusBar = screen.getByText(language);
            expect(statusBar).toBeInTheDocument();
          } finally {
            // Clean up
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 9: Code Editor Language Support - editor configuration should be consistent across languages', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            language: fc.constantFrom('typescript', 'javascript', 'python', 'json'),
            content: fc.string({ minLength: 0, maxLength: 500 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (fileConfigs) => {
          const testFiles: ProjectFile[] = fileConfigs.map((config, index) => ({
            id: `file-${index}`,
            name: `test${index}.${getExtensionForLanguage(config.language)}`,
            path: `src/test${index}.${getExtensionForLanguage(config.language)}`,
            content: config.content,
            language: config.language,
            isDirty: false,
          }));

          // Set first file as active in mock store
          mockStore.workspace.openFiles = testFiles.map(f => f.id);
          mockStore.workspace.activeFileId = testFiles[0].id;

          const { unmount } = renderWithContext(<CodeEditorPane files={testFiles} />);

          try {
            // Verify editor is rendered with consistent configuration
            const editor = screen.getByTestId('monaco-editor');
            expect(editor).toBeInTheDocument();

            const optionsAttr = editor.getAttribute('data-options');
            expect(optionsAttr).toBeTruthy();
            const options = JSON.parse(optionsAttr!);

            // Verify consistent editor options regardless of language
            expect(options.minimap.enabled).toBe(false);
            expect(options.fontSize).toBe(14);
            expect(options.lineNumbers).toBe('on');
            expect(options.tabSize).toBe(2);
            expect(options.insertSpaces).toBe(true);
            expect(options.wordWrap).toBe('on');
            expect(options.theme).toBe('dark-theme');
          } finally {
            // Clean up
            unmount();
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});

// Helper function to get file extension for language
function getExtensionForLanguage(language: string): string {
  const extensionMap: Record<string, string> = {
    'typescript': 'ts',
    'javascript': 'js',
    'python': 'py',
    'go': 'go',
    'rust': 'rs',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'json': 'json',
    'markdown': 'md',
    'html': 'html',
    'css': 'css',
  };
  return extensionMap[language] || 'txt';
}

// Helper function to get expected icon for language
function getExpectedIconForLanguage(language: string): string {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return 'code-bracket-icon';
    case 'json':
      return 'document-text-icon';
    case 'markdown':
      return 'document-icon';
    default:
      return 'document-icon';
  }
}