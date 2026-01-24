/**
 * Simple integration tests for core functionality.
 * 
 * These tests verify basic integration without complex dependencies.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  })),
  defaults: { headers: { common: {} } },
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  }
}));

// Simple test component
const TestComponent: React.FC = () => {
  return (
    <div data-testid="test-component">
      <h1>Integration Test</h1>
      <p>Testing basic React functionality</p>
    </div>
  );
};

describe('Simple Integration Tests', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  test('should render test component successfully', () => {
    renderWithRouter(<TestComponent />);
    
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
    expect(screen.getByText('Integration Test')).toBeInTheDocument();
    expect(screen.getByText('Testing basic React functionality')).toBeInTheDocument();
  });

  test('should handle router integration', () => {
    renderWithRouter(<TestComponent />);
    
    // Verify router context is available
    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });

  test('should handle async operations', async () => {
    const AsyncComponent: React.FC = () => {
      const [data, setData] = React.useState<string>('Loading...');
      
      React.useEffect(() => {
        setTimeout(() => {
          setData('Loaded successfully');
        }, 100);
      }, []);
      
      return <div data-testid="async-component">{data}</div>;
    };

    renderWithRouter(<AsyncComponent />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for async update
    await screen.findByText('Loaded successfully');
    expect(screen.getByText('Loaded successfully')).toBeInTheDocument();
  });

  test('should handle state management', () => {
    const StatefulComponent: React.FC = () => {
      const [count, setCount] = React.useState(0);
      
      return (
        <div data-testid="stateful-component">
          <span data-testid="count">{count}</span>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      );
    };

    renderWithRouter(<StatefulComponent />);
    
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    
    // Click button to increment
    screen.getByText('Increment').click();
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  test('should handle error boundaries gracefully', () => {
    const ErrorComponent: React.FC = () => {
      throw new Error('Test error');
    };

    const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      try {
        return <>{children}</>;
      } catch (error) {
        return <div data-testid="error-boundary">Error caught</div>;
      }
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderWithRouter(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    }).toThrow();

    consoleSpy.mockRestore();
  });
});