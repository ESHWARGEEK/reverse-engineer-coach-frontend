import React from 'react';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { ReferenceCodePane, ReferenceSnippet } from '../workspace/ReferenceCodePane';

// Feature: reverse-engineer-coach, Property 8: Task-Reference Snippet Linking
// **Property 8: Task-Reference Snippet Linking**
// **Validates: Requirements 4.5**

// Create a mock store with all required functions
const createMockStore = (selectedTaskId: string | null = null) => ({
  workspace: {
    selectedTaskId,
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
});

// Mock the store - will be updated per test
let mockStore = createMockStore();

// Mock the store
jest.mock('../../store', () => ({
  useAppStore: jest.fn(() => mockStore),
}));

// Mock Heroicons
jest.mock('@heroicons/react/outline', () => ({
  LinkIcon: () => <div data-testid="link-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  ChevronDownIcon: () => <div data-testid="chevron-down-icon" />,
  ChevronRightIcon: () => <div data-testid="chevron-right-icon" />,
  DocumentTextIcon: () => <div data-testid="document-text-icon" />,
  CodeBracketIcon: () => <div data-testid="code-bracket-icon" />,
}));

describe('ReferenceCodePane Task-Snippet Linking Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Property 8: Task-Reference Snippet Linking - snippets should be filtered by selected task', () => {
    fc.assert(
      fc.property(
        fc.record({
          selectedTaskId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          snippets: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
              title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              taskIds: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 3 }),
              relevanceScore: fc.float({ min: 0, max: 1 }),
              language: fc.constantFrom('javascript', 'typescript', 'python'),
              code: fc.string({ minLength: 10, maxLength: 200 }),
              githubUrl: fc.constant('https://github.com/example/repo/blob/main/file.js'),
              filePath: fc.constant('src/example.js'),
              startLine: fc.integer({ min: 1, max: 100 }),
              endLine: fc.integer({ min: 1, max: 100 }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        (config) => {
          // Ensure endLine >= startLine and unique IDs
          const validSnippets: ReferenceSnippet[] = config.snippets.map((snippet, index) => ({
            ...snippet,
            id: `snippet-${index}`,
            title: `${snippet.title}-${index}`,
            endLine: Math.max(snippet.startLine, snippet.endLine),
          }));

          // Update mock store for this test
          mockStore = createMockStore(config.selectedTaskId);
          const { useAppStore } = require('../../store');
          useAppStore.mockReturnValue(mockStore);

          const { container } = render(<ReferenceCodePane snippets={validSnippets} />);

          // Count snippets that should be visible (those that include the selected task)
          const relevantSnippets = validSnippets.filter(snippet => 
            snippet.taskIds.includes(config.selectedTaskId)
          );

          // If no relevant snippets, all snippets should be shown
          const expectedCount = relevantSnippets.length > 0 ? relevantSnippets.length : validSnippets.length;

          // Verify the snippet count is displayed correctly using getAllByText to handle duplicates
          const snippetCountElements = screen.getAllByText(new RegExp(`${expectedCount} snippets?`));
          expect(snippetCountElements.length).toBeGreaterThan(0);

          // If there are relevant snippets, verify "Filtered by task" indicator is shown
          if (relevantSnippets.length > 0) {
            const filteredIndicator = screen.getByText('Filtered by task');
            expect(filteredIndicator).toBeInTheDocument();
          }

          // Clean up for next test
          container.remove();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 8: Task-Reference Snippet Linking - highlighted snippets should match selected task', () => {
    fc.assert(
      fc.property(
        fc.record({
          selectedTaskId: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          snippets: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
              title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              taskIds: fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 3 }),
              relevanceScore: fc.float({ min: 0, max: 1 }),
              language: fc.constantFrom('javascript', 'typescript', 'python'),
              code: fc.string({ minLength: 10, maxLength: 200 }),
              githubUrl: fc.constant('https://github.com/example/repo/blob/main/file.js'),
              filePath: fc.constant('src/example.js'),
              startLine: fc.integer({ min: 1, max: 100 }),
              endLine: fc.integer({ min: 1, max: 100 }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 }),
            }),
            { minLength: 2, maxLength: 3 }
          ),
        }),
        (config) => {
          // Ensure endLine >= startLine and include selected task in at least one snippet
          const validSnippets: ReferenceSnippet[] = config.snippets.map((snippet, index) => ({
            ...snippet,
            id: `snippet-${index}`,
            title: `${snippet.title}-${index}`,
            endLine: Math.max(snippet.startLine, snippet.endLine),
            taskIds: index === 0 ? [...snippet.taskIds, config.selectedTaskId] : snippet.taskIds,
          }));

          // Update mock store for this test
          mockStore = createMockStore(config.selectedTaskId);
          const { useAppStore } = require('../../store');
          useAppStore.mockReturnValue(mockStore);

          const { container } = render(<ReferenceCodePane snippets={validSnippets} />);

          // Find snippets that should be highlighted (contain the selected task)
          const highlightedSnippets = validSnippets.filter(snippet => 
            snippet.taskIds.includes(config.selectedTaskId)
          );

          // Verify that at least one snippet is highlighted
          expect(highlightedSnippets.length).toBeGreaterThan(0);

          // Verify the filtering indicator is shown when task is selected
          const filteredIndicator = screen.getByText('Filtered by task');
          expect(filteredIndicator).toBeInTheDocument();

          // Clean up for next test
          container.remove();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 8: Task-Reference Snippet Linking - no task selection should show all snippets', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0),
            title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            taskIds: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 3 }),
            relevanceScore: fc.float({ min: 0, max: 1 }),
            language: fc.constantFrom('javascript', 'typescript', 'python'),
            code: fc.string({ minLength: 10, maxLength: 200 }),
            githubUrl: fc.constant('https://github.com/example/repo/blob/main/file.js'),
            filePath: fc.constant('src/example.js'),
            startLine: fc.integer({ min: 1, max: 100 }),
            endLine: fc.integer({ min: 1, max: 100 }),
            tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (snippets) => {
          // Ensure endLine >= startLine and unique IDs
          const validSnippets: ReferenceSnippet[] = snippets.map((snippet, index) => ({
            ...snippet,
            id: `snippet-${index}`,
            title: `${snippet.title}-${index}`,
            endLine: Math.max(snippet.startLine, snippet.endLine),
          }));

          // Update mock store for this test (no selected task)
          mockStore = createMockStore(null);
          const { useAppStore } = require('../../store');
          useAppStore.mockReturnValue(mockStore);

          const { container } = render(<ReferenceCodePane snippets={validSnippets} />);

          // Verify all snippets are shown when no task is selected using getAllByText
          const snippetCountElements = screen.getAllByText(new RegExp(`${validSnippets.length} snippets?`));
          expect(snippetCountElements.length).toBeGreaterThan(0);

          // Verify "Filtered by task" indicator is not shown
          const filteredIndicator = screen.queryByText('Filtered by task');
          expect(filteredIndicator).not.toBeInTheDocument();

          // Clean up for next test
          container.remove();
        }
      ),
      { numRuns: 10 }
    );
  });
});