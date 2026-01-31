/**
 * Property-Based Tests for Enhanced Workflow State Management
 * 
 * These tests use property-based testing to verify that workflow state
 * management behaves correctly across all possible inputs and state transitions.
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import fc from 'fast-check';
import { WorkflowStateManager } from '../../services/WorkflowStateManager';
import { useWorkflowState } from '../../hooks/useWorkflowState';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Test component that uses workflow state
const TestWorkflowComponent: React.FC<{ initialStep?: string; persistKey?: string }> = ({ 
  initialStep = 'welcome', 
  persistKey = 'test-workflow' 
}) => {
  const workflowState = useWorkflowState({ initialStep, persistKey });
  
  return (
    <div data-testid="workflow-component">
      <div data-testid="current-step">{workflowState.currentStep}</div>
      <div data-testid="progress">{workflowState.progress}</div>
      <div data-testid="can-go-back">{workflowState.canGoBack.toString()}</div>
      <div data-testid="can-go-forward">{workflowState.canGoForward.toString()}</div>
      <button onClick={() => workflowState.nextStep()} data-testid="next-button">Next</button>
      <button onClick={() => workflowState.previousStep()} data-testid="prev-button">Previous</button>
    </div>
  );
};

// Arbitraries for property-based testing
const workflowStepArbitrary = fc.constantFrom(
  'welcome',
  'skill-assessment', 
  'technology-preferences',
  'ai-discovery',
  'repository-selection',
  'project-preview'
);

const stepDataArbitrary = fc.record({
  experienceLevel: fc.constantFrom('beginner', 'intermediate', 'advanced'),
  currentSkills: fc.array(fc.string(), { minLength: 0, maxLength: 10 }),
  learningGoals: fc.array(fc.string(), { minLength: 0, maxLength: 5 }),
  selectedTechnologies: fc.array(fc.string(), { minLength: 0, maxLength: 8 })
});

const workflowStateArbitrary = fc.record({
  currentStep: workflowStepArbitrary,
  stepData: fc.dictionary(workflowStepArbitrary, stepDataArbitrary),
  isComplete: fc.boolean(),
  progress: fc.integer({ min: 0, max: 100 })
});

describe('Property: Enhanced Workflow State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Workflow State Consistency', () => {
    it('should maintain consistent state across all possible step transitions', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary, { minLength: 2, maxLength: 6 }),
          (stepSequence) => {
            const manager = new WorkflowStateManager('test-workflow');
            let previousStep = stepSequence[0];
            
            // Initialize with first step
            manager.goToStep(previousStep);
            
            // Test each transition in sequence
            for (let i = 1; i < stepSequence.length; i++) {
              const currentStep = stepSequence[i];
              const initialState = manager.getCurrentState();
              
              // Perform transition
              manager.goToStep(currentStep);
              const newState = manager.getCurrentState();
              
              // Verify state consistency
              expect(newState.currentStep).toBe(currentStep);
              expect(newState.stepData).toEqual(expect.objectContaining(initialState.stepData));
              
              // Verify progress is monotonic (non-decreasing)
              if (manager.getStepIndex(currentStep) > manager.getStepIndex(previousStep)) {
                expect(newState.progress).toBeGreaterThanOrEqual(initialState.progress);
              }
              
              previousStep = currentStep;
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve step data integrity across all state operations', () => {
      fc.assert(
        fc.property(
          workflowStepArbitrary,
          stepDataArbitrary,
          (step, data) => {
            const manager = new WorkflowStateManager('test-workflow');
            
            // Update step data
            manager.updateStepData(step, data);
            
            // Verify data is preserved exactly
            const state = manager.getCurrentState();
            expect(state.stepData[step]).toEqual(data);
            
            // Verify data persists after navigation
            manager.goToStep('welcome');
            manager.goToStep(step);
            
            const stateAfterNavigation = manager.getCurrentState();
            expect(stateAfterNavigation.stepData[step]).toEqual(data);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain valid navigation state for any workflow configuration', () => {
      fc.assert(
        fc.property(
          workflowStepArbitrary,
          (currentStep) => {
            const manager = new WorkflowStateManager('test-workflow');
            manager.goToStep(currentStep);
            
            const state = manager.getCurrentState();
            const stepIndex = manager.getStepIndex(currentStep);
            
            // Verify navigation state consistency
            expect(state.canGoBack).toBe(stepIndex > 0);
            expect(state.canGoForward).toBe(stepIndex < manager.getTotalSteps() - 1);
            
            // Verify progress calculation
            const expectedProgress = Math.round((stepIndex / (manager.getTotalSteps() - 1)) * 100);
            expect(state.progress).toBe(expectedProgress);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('State Persistence Properties', () => {
    it('should persist and restore state correctly for any valid workflow state', () => {
      fc.assert(
        fc.property(
          workflowStateArbitrary,
          (workflowState) => {
            const persistKey = 'test-persist-workflow';
            
            // Create manager and set state
            const manager1 = new WorkflowStateManager(persistKey);
            manager1.goToStep(workflowState.currentStep);
            
            // Update step data
            Object.entries(workflowState.stepData).forEach(([step, data]) => {
              manager1.updateStepData(step, data);
            });
            
            // Save state
            manager1.saveProgress();
            
            // Create new manager instance (simulating page reload)
            const manager2 = new WorkflowStateManager(persistKey);
            manager2.loadProgress();
            
            const restoredState = manager2.getCurrentState();
            
            // Verify state restoration
            expect(restoredState.currentStep).toBe(workflowState.currentStep);
            expect(restoredState.stepData).toEqual(workflowState.stepData);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle corrupted persistence data gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('invalid-json'),
            fc.constant('{}'),
            fc.record({
              currentStep: fc.string(),
              stepData: fc.anything(),
              invalidField: fc.anything()
            })
          ),
          (corruptedData) => {
            mockLocalStorage.getItem.mockReturnValue(
              typeof corruptedData === 'string' ? corruptedData : JSON.stringify(corruptedData)
            );
            
            // Should not throw and should use default state
            const manager = new WorkflowStateManager('test-corrupted');
            expect(() => manager.loadProgress()).not.toThrow();
            
            const state = manager.getCurrentState();
            expect(state.currentStep).toBe('welcome'); // Default step
            expect(state.stepData).toEqual({});
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('React Hook Integration Properties', () => {
    it('should provide consistent state interface across all workflow steps', () => {
      fc.assert(
        fc.property(
          workflowStepArbitrary,
          (initialStep) => {
            const { container } = render(
              <TestWorkflowComponent initialStep={initialStep} />
            );
            
            const currentStepElement = container.querySelector('[data-testid="current-step"]');
            const progressElement = container.querySelector('[data-testid="progress"]');
            const canGoBackElement = container.querySelector('[data-testid="can-go-back"]');
            const canGoForwardElement = container.querySelector('[data-testid="can-go-forward"]');
            
            // Verify all required elements are present
            expect(currentStepElement).toBeInTheDocument();
            expect(progressElement).toBeInTheDocument();
            expect(canGoBackElement).toBeInTheDocument();
            expect(canGoForwardElement).toBeInTheDocument();
            
            // Verify state values are valid
            expect(currentStepElement?.textContent).toBe(initialStep);
            expect(parseInt(progressElement?.textContent || '0')).toBeGreaterThanOrEqual(0);
            expect(parseInt(progressElement?.textContent || '0')).toBeLessThanOrEqual(100);
            expect(['true', 'false']).toContain(canGoBackElement?.textContent);
            expect(['true', 'false']).toContain(canGoForwardElement?.textContent);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle rapid state updates without inconsistencies', () => {
      fc.assert(
        fc.property(
          fc.array(workflowStepArbitrary, { minLength: 3, maxLength: 10 }),
          (stepSequence) => {
            const { container } = render(<TestWorkflowComponent />);
            const nextButton = container.querySelector('[data-testid="next-button"]') as HTMLButtonElement;
            const prevButton = container.querySelector('[data-testid="prev-button"]') as HTMLButtonElement;
            
            // Perform rapid navigation
            stepSequence.forEach((_, index) => {
              act(() => {
                if (index % 2 === 0 && nextButton && !nextButton.disabled) {
                  nextButton.click();
                } else if (prevButton && !prevButton.disabled) {
                  prevButton.click();
                }
              });
            });
            
            // Verify component is still in valid state
            const currentStepElement = container.querySelector('[data-testid="current-step"]');
            const progressElement = container.querySelector('[data-testid="progress"]');
            
            expect(currentStepElement).toBeInTheDocument();
            expect(progressElement).toBeInTheDocument();
            
            const progress = parseInt(progressElement?.textContent || '0');
            expect(progress).toBeGreaterThanOrEqual(0);
            expect(progress).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Error Handling Properties', () => {
    it('should handle invalid step transitions gracefully', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !['welcome', 'skill-assessment', 'technology-preferences', 
                                   'ai-discovery', 'repository-selection', 'project-preview'].includes(s)),
          (invalidStep) => {
            const manager = new WorkflowStateManager('test-invalid');
            const initialState = manager.getCurrentState();
            
            // Attempt invalid step transition
            expect(() => manager.goToStep(invalidStep)).not.toThrow();
            
            // Verify state remains unchanged
            const stateAfterInvalid = manager.getCurrentState();
            expect(stateAfterInvalid).toEqual(initialState);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate step data without breaking workflow state', () => {
      fc.assert(
        fc.property(
          workflowStepArbitrary,
          fc.anything(),
          (step, invalidData) => {
            const manager = new WorkflowStateManager('test-validation');
            const initialState = manager.getCurrentState();
            
            // Attempt to update with potentially invalid data
            expect(() => manager.updateStepData(step, invalidData)).not.toThrow();
            
            // Verify workflow can still navigate
            expect(() => manager.nextStep()).not.toThrow();
            expect(() => manager.previousStep()).not.toThrow();
            
            const finalState = manager.getCurrentState();
            expect(finalState.currentStep).toBeDefined();
            expect(typeof finalState.progress).toBe('number');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Performance Properties', () => {
    it('should maintain acceptable performance for large step data', () => {
      fc.assert(
        fc.property(
          fc.record({
            largeArray: fc.array(fc.string(), { minLength: 100, maxLength: 1000 }),
            deepObject: fc.record({
              level1: fc.record({
                level2: fc.record({
                  level3: fc.array(fc.string(), { minLength: 10, maxLength: 50 })
                })
              })
            })
          }),
          (largeData) => {
            const manager = new WorkflowStateManager('test-performance');
            
            const startTime = performance.now();
            
            // Perform operations with large data
            manager.updateStepData('skill-assessment', largeData);
            manager.saveProgress();
            manager.loadProgress();
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Should complete within reasonable time (100ms)
            expect(executionTime).toBeLessThan(100);
            
            // Verify data integrity
            const state = manager.getCurrentState();
            expect(state.stepData['skill-assessment']).toEqual(largeData);
          }
        ),
        { numRuns: 10 } // Fewer runs for performance tests
      );
    });
  });

  describe('Concurrent Access Properties', () => {
    it('should handle multiple workflow instances without interference', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 2, maxLength: 5 }),
          workflowStepArbitrary,
          (persistKeys, step) => {
            // Create multiple workflow managers
            const managers = persistKeys.map(key => new WorkflowStateManager(key));
            
            // Update each manager independently
            managers.forEach((manager, index) => {
              manager.goToStep(step);
              manager.updateStepData(step, { index, timestamp: Date.now() });
            });
            
            // Verify each manager maintains independent state
            managers.forEach((manager, index) => {
              const state = manager.getCurrentState();
              expect(state.currentStep).toBe(step);
              expect(state.stepData[step]).toEqual(
                expect.objectContaining({ index })
              );
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});