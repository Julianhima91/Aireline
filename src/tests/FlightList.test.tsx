import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlightList } from '../components/results/FlightList';
import { FlightOption } from '../types/flight';
import { SearchParams } from '../types/search';

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

describe('FlightList', () => {
  test('renders flight cards correctly', () => {
    render(
      <FlightList
        flights={mockFlights}
        searchParams={mockSearchParams}
        batchId="test-123"
        onSelect={() => {}}
        onBack={() => {}}
      />
    );

    expect(screen.getByText('Wizz Air')).toBeInTheDocument();
    expect(screen.getByText('100 EUR')).toBeInTheDocument();
  });

  test('shows empty state when no flights', () => {
    render(
      <FlightList
        flights={[]}
        searchParams={mockSearchParams}
        batchId="test-123"
        onSelect={() => {}}
        onBack={() => {}}
      />
    );

    expect(screen.getByText(/No Flights Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Modify Search/i)).toBeInTheDocument();
  });

  test('handles back button click', () => {
    const handleBack = vi.fn();
    
    render(
      <FlightList
        flights={[]}
        searchParams={mockSearchParams}
        batchId="test-123"
        onSelect={() => {}}
        onBack={handleBack}
      />
    );

    screen.getByText('Modify Search').click();
    expect(handleBack).toHaveBeenCalledTimes(1);
  });
});