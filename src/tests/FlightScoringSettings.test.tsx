import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { FlightScoringSettings } from '../components/admin/scoring/FlightScoringSettings';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: {
            settings: {
              direct_flight_bonus: 5,
              arrival_time_bonuses: {
                early_morning: { start: 3, end: 10, points: 5 },
                morning: { start: 10, end: 15, points: 3 }
              },
              departure_time_bonuses: {
                afternoon: { start: 14, end: 18, points: 3 },
                evening: { start: 18, end: 24, points: 5 }
              },
              stop_penalties: {
                one_stop: -5,
                two_plus_stops: -10
              },
              duration_penalties: {
                medium: { hours: 4, points: -1 },
                long: { hours: 6, points: -2 },
                very_long: { hours: 6, points: -3 }
              }
            }
          }
        }))
      }))
    })),
    upsert: vi.fn(() => Promise.resolve({ error: null }))
  }
}));

describe('FlightScoringSettings', () => {
  test('loads settings correctly', async () => {
    render(<FlightScoringSettings />);
    
    // Wait for settings to load
    expect(await screen.findByText('Flight Scoring Settings')).toBeInTheDocument();
    
    // Check if default values are loaded
    const directFlightInput = screen.getByLabelText(/Direct Flight/i);
    expect(directFlightInput).toHaveValue(5);
  });

  test('handles input changes', async () => {
    render(<FlightScoringSettings />);
    
    // Wait for settings to load
    await screen.findByText('Flight Scoring Settings');
    
    // Change direct flight bonus
    const directFlightInput = screen.getByLabelText(/Direct Flight/i);
    fireEvent.change(directFlightInput, { target: { value: '10' } });
    
    expect(directFlightInput).toHaveValue(10);
  });

  test('shows success message on save', async () => {
    render(<FlightScoringSettings />);
    
    // Wait for settings to load
    await screen.findByText('Flight Scoring Settings');
    
    // Click save button
    fireEvent.click(screen.getByText('Save Changes'));
    
    // Check for success message
    expect(await screen.findByText('Settings saved successfully!')).toBeInTheDocument();
  });

  test('resets to default values', async () => {
    render(<FlightScoringSettings />);
    
    // Wait for settings to load
    await screen.findByText('Flight Scoring Settings');
    
    // Change a value
    const directFlightInput = screen.getByLabelText(/Direct Flight/i);
    fireEvent.change(directFlightInput, { target: { value: '10' } });
    
    // Click reset button
    fireEvent.click(screen.getByText('Reset to Defaults'));
    
    // Check if value is reset
    expect(directFlightInput).toHaveValue(5);
  });
});