import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConceptSearchInput } from '../ui/ConceptSearchInput';

describe('ConceptSearchInput', () => {
  it('renders with placeholder text', () => {
    render(
      <ConceptSearchInput 
        placeholder="Enter a concept..."
        onChange={() => {}}
      />
    );
    
    expect(screen.getByPlaceholderText('Enter a concept...')).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const mockOnChange = jest.fn();
    
    render(
      <ConceptSearchInput 
        onChange={mockOnChange}
      />
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'microservices' } });
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('microservices');
    });
  });

  it('shows suggestions when typing', async () => {
    render(
      <ConceptSearchInput 
        onChange={() => {}}
      />
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'micro' } });
    
    await waitFor(() => {
      expect(screen.getByText('Microservices Architecture')).toBeInTheDocument();
    });
  });

  it('validates concept input', () => {
    render(
      <ConceptSearchInput 
        value="ab"
        required
        onChange={() => {}}
      />
    );
    
    // Should show validation error for short input
    expect(screen.getByText('Please enter at least 3 characters')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    render(
      <ConceptSearchInput 
        onChange={() => {}}
      />
    );
    
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'arch' } });
    
    await waitFor(() => {
      expect(screen.getByText('Clean Architecture')).toBeInTheDocument();
    });
    
    // Test arrow down navigation
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    await waitFor(() => {
      expect(input).toHaveValue('clean architecture');
    });
  });
});