import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { SortingOptions } from '../components/results/SortingOptions';

describe('SortingOptions', () => {
  test('renders all sorting options', () => {
    render(
      <SortingOptions
        value="best"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Best')).toBeInTheDocument();
    expect(screen.getByText('Cheapest')).toBeInTheDocument();
    expect(screen.getByText('Fastest')).toBeInTheDocument();
  });

  test('highlights selected option', () => {
    render(
      <SortingOptions
        value="cheapest"
        onChange={() => {}}
      />
    );

    const cheapestButton = screen.getByText('Cheapest').closest('button');
    expect(cheapestButton).toHaveClass('bg-blue-600');
  });

  test('calls onChange when option clicked', () => {
    const handleChange = vi.fn();
    
    render(
      <SortingOptions
        value="best"
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByText('Fastest'));
    expect(handleChange).toHaveBeenCalledWith('fastest');
  });

  test('shows tooltips with descriptions', () => {
    render(
      <SortingOptions
        value="best"
        onChange={() => {}}
      />
    );

    const bestButton = screen.getByText('Best').closest('button');
    expect(bestButton).toHaveAttribute('title', expect.stringContaining('Balanced score'));
  });
});