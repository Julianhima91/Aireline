import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { FlightFilterPanel } from '../components/results/filters/FlightFilterPanel';
import { FlightOption } from '../types/flight';

const mockFlights: FlightOption[] = [
  {
    flights: [
      {
        departure_airport: { id: 'TIA', name: 'Tirana', time: '2025-03-15T08:00:00Z' },
        arrival_airport: { id: 'FCO', name: 'Rome', time: '2025-03-15T10:00:00Z' },
        duration: 120,
        airline: 'Wizz Air',
        airline_logo: 'https://example.com/wizzair.png',
        flight_number: 'W6123',
        travel_class: 'Economy',
        legroom: 'Standard',
        extensions: []
      }
    ],
    total_duration: 120,
    price: 100,
    type: 'One way',
    airline_logo: 'https://example.com/wizzair.png'
  }
];

describe('FlightFilterPanel', () => {
  test('renders all filter sections', () => {
    render(
      <FlightFilterPanel
        flights={mockFlights}
        filters={{
          stops: [],
          departureTime: [],
          returnTime: [],
          airlines: [],
          priceRange: { min: 0, max: 1000 }
        }}
        onFilterChange={() => {}}
        isRoundTrip={false}
      />
    );

    expect(screen.getByText('Stops')).toBeInTheDocument();
    expect(screen.getByText('Departure Time')).toBeInTheDocument();
    expect(screen.getByText('Airlines')).toBeInTheDocument();
  });

  test('shows return time filter only for round trips', () => {
    const { rerender } = render(
      <FlightFilterPanel
        flights={mockFlights}
        filters={{
          stops: [],
          departureTime: [],
          returnTime: [],
          airlines: [],
          priceRange: { min: 0, max: 1000 }
        }}
        onFilterChange={() => {}}
        isRoundTrip={false}
      />
    );

    expect(screen.queryByText('Return Time')).not.toBeInTheDocument();

    rerender(
      <FlightFilterPanel
        flights={mockFlights}
        filters={{
          stops: [],
          departureTime: [],
          returnTime: [],
          airlines: [],
          priceRange: { min: 0, max: 1000 }
        }}
        onFilterChange={() => {}}
        isRoundTrip={true}
      />
    );

    expect(screen.getByText('Return Time')).toBeInTheDocument();
  });

  test('handles filter changes correctly', () => {
    const handleFilterChange = vi.fn();
    
    render(
      <FlightFilterPanel
        flights={mockFlights}
        filters={{
          stops: [],
          departureTime: [],
          returnTime: [],
          airlines: [],
          priceRange: { min: 0, max: 1000 }
        }}
        onFilterChange={handleFilterChange}
        isRoundTrip={false}
      />
    );

    fireEvent.click(screen.getByText('Direct'));
    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      stops: ['direct']
    }));
  });

  test('shows reset button when filters are active', () => {
    render(
      <FlightFilterPanel
        flights={mockFlights}
        filters={{
          stops: ['direct'],
          departureTime: ['morning'],
          returnTime: [],
          airlines: ['Wizz Air'],
          priceRange: { min: 0, max: 1000 }
        }}
        onFilterChange={() => {}}
        isRoundTrip={false}
      />
    );

    expect(screen.getByText('Reset All Filters')).toBeInTheDocument();
  });
});