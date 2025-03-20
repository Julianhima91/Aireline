import { describe, test, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { FlightCard } from '../components/results/FlightCard';
import { FlightOption } from '../types/flight';
import { SearchParams } from '../types/search';

const mockFlight: FlightOption = {
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
};

const mockSearchParams: SearchParams = {
  fromLocation: 'Tirana',
  toLocation: 'Rome',
  fromCode: 'TIA',
  toCode: 'FCO',
  departureDate: '2025-03-15T08:00:00Z',
  returnDate: null,
  tripType: 'oneWay',
  travelClass: '1',
  stops: '0',
  passengers: {
    adults: 1,
    children: 0,
    infantsInSeat: 0,
    infantsOnLap: 0
  }
};

describe('FlightCard', () => {
  test('renders flight details correctly', () => {
    render(
      <FlightCard
        flight={mockFlight}
        searchParams={mockSearchParams}
        batchId="test-123"
        onSelect={() => {}}
      />
    );

    // Check basic flight information
    expect(screen.getByText('Wizz Air')).toBeInTheDocument();
    expect(screen.getByText('100 EUR')).toBeInTheDocument();
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  test('handles click events correctly', () => {
    const handleSelect = vi.fn();
    
    render(
      <FlightCard
        flight={mockFlight}
        searchParams={mockSearchParams}
        batchId="test-123"
        onSelect={handleSelect}
      />
    );

    // Click the card
    fireEvent.click(screen.getByText('100 EUR'));
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  test('displays correct duration', () => {
    render(
      <FlightCard
        flight={mockFlight}
        searchParams={mockSearchParams}
        batchId="test-123"
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('2h 0m')).toBeInTheDocument();
  });

  test('shows route summary', () => {
    render(
      <FlightCard
        flight={mockFlight}
        searchParams={mockSearchParams}
        batchId="test-123"
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('TIA')).toBeInTheDocument();
    expect(screen.getByText('FCO')).toBeInTheDocument();
  });
});