import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple component test without router dependencies
describe('Frontend Setup Tests', () => {
  test('Basic React rendering works', () => {
    const TestComponent = () => (
      <div>
        <h1 className="text-4xl font-bold text-white">Test Title</h1>
        <p className="text-gray-400">Test description</p>
      </div>
    );
    
    render(<TestComponent />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  test('Tailwind CSS classes can be applied', () => {
    const TestComponent = () => (
      <div className="bg-gray-900 text-gray-100">
        <span className="font-bold">Styled text</span>
      </div>
    );
    
    render(<TestComponent />);
    
    const styledText = screen.getByText('Styled text');
    expect(styledText).toHaveClass('font-bold');
  });
});