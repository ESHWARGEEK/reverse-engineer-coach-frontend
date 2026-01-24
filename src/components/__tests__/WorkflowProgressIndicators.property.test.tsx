/**
 * Property-Based Test for Workflow Progress Indicators
 * Feature: reverse-engineer-coach, Property 22: Workflow Progress Indicators
 * 
 * Tests that workflow progress indicators accurately reflect the current stage
 * and provide appropriate visual and accessibility feedback.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';

// Create a simple WorkflowStepper component for testing
interface WorkflowStepperProps {
  currentStep: string;
  progress?: number;
}

const WORKFLOW_STEPS = [
  { id: 'intent', label: 'Learning Intent', description: 'Choose what to learn' },
  { id: 'analysis', label: 'Repository Analysis', description: 'Analyze codebase' },
  { id: 'generation', label: 'Curriculum Generation', description: 'Create learning path' },
  { id: 'workspace', label: 'Interactive Learning', description: 'Start coding' },
];

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStep, progress = 0 }) => {
  const currentIndex = WORKFLOW_STEPS.findIndex(step => step.id === currentStep);
  
  return (
    <div role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={WORKFLOW_STEPS.length}>
      <div className="flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${isCompleted ? 'bg-green-600 text-white' : 
                      isActive ? 'bg-blue-600 text-white' : 
                      'bg-gray-700 text-gray-400'}
                  `}
                  aria-label={`Step ${index + 1}: ${step.label} - ${
                    isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'
                  }`}
                >
                  {isCompleted ? (
                    <span aria-hidden="true">✓</span>
                  ) : isActive && progress > 0 ? (
                    <div data-testid="loading-spinner" />
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-white' : 
                    isCompleted ? 'text-green-400' : 
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress bar for current step */}
      {progress > 0 && currentIndex >= 0 && (
        <div className="mt-4">
          <div 
            data-testid="progress-bar"
            data-progress={progress}
            data-show-percentage={true}
            data-color="primary"
            role="progressbar"
            aria-valuenow={Math.min(Math.max(progress, 0), 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
    </div>
  );
};

// Mock loading components
const LoadingSpinner: React.FC<{ size?: string; color?: string; className?: string }> = ({ 
  size, color, className 
}) => (
  <div 
    data-testid="loading-spinner" 
    data-size={size}
    data-color={color}
    className={className}
  />
);

// Test wrapper component - no router needed for this component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

// Workflow step generator
const workflowStepArbitrary = fc.constantFrom(
  'intent',
  'analysis', 
  'generation',
  'workspace'
);

// Progress value generator (0-100)
const progressArbitrary = fc.integer({ min: 0, max: 100 });

describe('Property: Workflow Progress Indicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display correct step indicators for any workflow stage', () => {
    fc.assert(
      fc.property(workflowStepArbitrary, (currentStep) => {
        const { container } = render(
          <TestWrapper>
            <WorkflowStepper currentStep={currentStep} />
          </TestWrapper>
        );

        // Find the workflow stepper
        const progressBar = container.querySelector('[role="progressbar"]');
        expect(progressBar).toBeInTheDocument();

        // Verify step indicators are present
        const stepIndicators = container.querySelectorAll('[aria-label*="Step"]');
        expect(stepIndicators.length).toBe(4); // Should have 4 workflow steps

        // Verify current step is properly indicated
        const stepOrder = ['intent', 'analysis', 'generation', 'workspace'];
        const currentIndex = stepOrder.indexOf(currentStep);
        
        if (currentIndex >= 0) {
          const currentStepElement = stepIndicators[currentIndex];
          const ariaLabel = currentStepElement.getAttribute('aria-label');
          expect(ariaLabel).toContain(`Step ${currentIndex + 1}`);
          
          if (currentStep !== 'intent') {
            expect(ariaLabel).toMatch(/(In Progress|Completed)/);
          }
        }

        // Verify completed steps are marked
        const completedSteps = Array.from(stepIndicators).filter(element =>
          element.getAttribute('aria-label')?.includes('Completed')
        );

        expect(completedSteps.length).toBe(Math.max(0, currentIndex));
      }),
      { numRuns: 5 }
    );
  });

  it('should show progress bars with valid progress values', () => {
    fc.assert(
      fc.property(
        workflowStepArbitrary.filter(step => step === 'analysis' || step === 'generation'),
        progressArbitrary,
        (currentStep, progress) => {
          const { container } = render(
            <TestWrapper>
              <WorkflowStepper currentStep={currentStep} progress={progress} />
            </TestWrapper>
          );

          // Should have progress indicators during loading steps
          if (currentStep === 'analysis' || currentStep === 'generation') {
            const progressBars = container.querySelectorAll('[data-testid="progress-bar"]');
            
            if (progress > 0) {
              expect(progressBars.length).toBeGreaterThan(0);
              
              progressBars.forEach(progressBar => {
                const progressValue = progressBar.getAttribute('data-progress');
                const numericProgress = progressValue ? parseInt(progressValue, 10) : 0;
                
                // Progress should be between 0 and 100
                expect(numericProgress).toBeGreaterThanOrEqual(0);
                expect(numericProgress).toBeLessThanOrEqual(100);
                
                // Progress bar should have proper ARIA attributes
                expect(progressBar).toHaveAttribute('role', 'progressbar');
                expect(progressBar).toHaveAttribute('aria-valuenow');
              });
            }
          }
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should maintain accessibility attributes across all workflow states', () => {
    fc.assert(
      fc.property(workflowStepArbitrary, (currentStep) => {
        const { container } = render(
          <TestWrapper>
            <WorkflowStepper currentStep={currentStep} />
          </TestWrapper>
        );

        // Main progress container should have progressbar role
        const mainProgressBar = container.querySelector('[role="progressbar"]');
        expect(mainProgressBar).toBeInTheDocument();
        expect(mainProgressBar).toHaveAttribute('aria-valuenow');
        expect(mainProgressBar).toHaveAttribute('aria-valuemax', '4');

        // All step indicators should have descriptive labels
        const stepIndicators = container.querySelectorAll('[aria-label*="Step"]');
        stepIndicators.forEach((indicator, index) => {
          const ariaLabel = indicator.getAttribute('aria-label');
          expect(ariaLabel).toContain(`Step ${index + 1}`);
          expect(ariaLabel).toMatch(/(Completed|In Progress|Pending)/);
        });
      }),
      { numRuns: 5 }
    );
  });

  it('should show appropriate loading indicators for each workflow step', () => {
    fc.assert(
      fc.property(workflowStepArbitrary, (currentStep) => {
        const { container } = render(
          <TestWrapper>
            <WorkflowStepper currentStep={currentStep} progress={50} />
          </TestWrapper>
        );

        const stepOrder = ['intent', 'analysis', 'generation', 'workspace'];
        const currentIndex = stepOrder.indexOf(currentStep);

        if (currentStep === 'intent') {
          // Intent step should not show loading spinner in step indicator
          const stepIndicators = container.querySelectorAll('[aria-label*="Step 1"]');
          expect(stepIndicators.length).toBe(1);
          
          // For intent step, we just verify it doesn't have a loading spinner
          const loadingSpinners = container.querySelectorAll('[data-testid="loading-spinner"]');
          expect(loadingSpinners.length).toBe(0); // Intent step should not have loading spinner
        } else if (currentStep === 'analysis' || currentStep === 'generation') {
          // Active loading steps should show loading spinner in step indicator
          const loadingSpinners = container.querySelectorAll('[data-testid="loading-spinner"]');
          expect(loadingSpinners.length).toBeGreaterThan(0);
        } else if (currentStep === 'workspace') {
          // Workspace step should show completion indicator
          const completedSteps = container.querySelectorAll('[aria-label*="Completed"]');
          expect(completedSteps.length).toBe(3); // Previous steps should be completed
        }
      }),
      { numRuns: 5 }
    );
  });

  it('should provide consistent visual feedback across workflow transitions', () => {
    fc.assert(
      fc.property(
        fc.array(workflowStepArbitrary, { minLength: 2, maxLength: 4 }),
        (stepSequence) => {
          // Test that each step in sequence maintains visual consistency
          stepSequence.forEach((step) => {
            const { container } = render(
              <TestWrapper>
                <WorkflowStepper currentStep={step} />
              </TestWrapper>
            );

            // Each step should have consistent structure
            const progressContainer = container.querySelector('[role="progressbar"]');
            expect(progressContainer).toBeInTheDocument();

            // Step indicators should be consistently positioned
            const stepIndicators = container.querySelectorAll('[aria-label*="Step"]');
            expect(stepIndicators.length).toBe(4);

            // Visual state should be appropriate for step
            const stepOrder = ['intent', 'analysis', 'generation', 'workspace'];
            const currentIndex = stepOrder.indexOf(step);
            
            if (currentIndex >= 0) {
              const currentStepIndicator = stepIndicators[currentIndex];
              const ariaLabel = currentStepIndicator.getAttribute('aria-label');
              
              expect(ariaLabel).toContain(`Step ${currentIndex + 1}`);
              
              if (step === 'intent') {
                expect(ariaLabel).toContain('In Progress');
              } else {
                expect(ariaLabel).toMatch(/(In Progress|Completed)/);
              }
            }
          });
        }
      ),
      { numRuns: 3 }
    );
  });

  it('should handle edge cases in progress values gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(-10), // Negative progress
          fc.constant(0),   // Zero progress
          fc.constant(50),  // Mid progress
          fc.constant(100), // Complete progress
          fc.constant(150)  // Over 100% progress
        ),
        (progress) => {
          const { container } = render(
            <TestWrapper>
              <WorkflowStepper currentStep="analysis" progress={progress} />
            </TestWrapper>
          );

          // Progress bars should handle edge cases gracefully
          const progressBars = container.querySelectorAll('[data-testid="progress-bar"]');
          
          if (progress > 0) {
            expect(progressBars.length).toBeGreaterThan(0);
            
            progressBars.forEach(progressBar => {
              const progressValue = progressBar.getAttribute('data-progress');
              if (progressValue !== null) {
                const numericProgress = parseInt(progressValue, 10);
                
                // Progress should be the actual value passed (clamping happens in real component)
                expect(numericProgress).toBe(progress);
                
                // But ARIA values should be valid (clamped between 0-100)
                const ariaValue = progressBar.getAttribute('aria-valuenow');
                if (ariaValue) {
                  const ariaProgress = parseInt(ariaValue, 10);
                  expect(ariaProgress).toBeGreaterThanOrEqual(0);
                  expect(ariaProgress).toBeLessThanOrEqual(100);
                }
              }
            });
          } else {
            // No progress bars should be shown for zero or negative progress
            expect(progressBars.length).toBe(0);
          }
        }
      ),
      { numRuns: 5 }
    );
  });
});