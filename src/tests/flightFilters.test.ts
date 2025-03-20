import { describe, test, expect } from 'vitest';
import { applyFilters } from '../utils/flightFilters';
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
  },
  {
    flights: [
      {
        departure_airport: { id: 'TIA', name: 'Tirana', time: '2025-03-15T14:00:00Z' },
        arrival_airport: { id: 'VIE', name: 'Vienna', time: '2025-03-15T16:00:00Z' },
        duration: 120,
        airline: 'Austrian',
        airline_logo: 'https://example.com/austrian.png',
        flight_number: 'OS123',
        travel_class: 'Economy',
        legroom: 'Standard',
        extensions: []
      },
      {
        departure_airport: { id: 'VIE', name: 'Vienna', time: '2025-03-15T17:00:00Z' },
        arrival_airport: { id: 'FCO', name: 'Rome', time: '2025-03-15T19:00:00Z' },
        duration: 120,
        airline: 'Austrian',
        airline_logo: 'https://example.com/austrian.png',
        flight_number: 'OS456',
        travel_class: 'Economy',
        legroom: 'Standard',
        extensions: []
      }
    ],
    total_duration: 300,
    price: 200,
    type: 'One way',
    airline_logo: 'https://example.com/austrian.png'
  }
];

describe('Flight Filters', () => {
  test('filters by stops correctly', () => {
    const filters = {
      stops: ['direct'],
      departureTime: [],
      returnTime: [],
      airlines: [],
      priceRange: { min: 0, max: 1000 }
    };

    const filtered = applyFilters(mockFlights, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].flights).toHaveLength(1);
  });

  test('filters by departure time correctly', () => {
    const filters = {
      stops: [],
      departureTime: ['morning'],
      returnTime: [],
      airlines: [],
      priceRange: { min: 0, max: 1000 }
    };

    const filtered = applyFilters(mockFlights, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].flights[0].departure_airport.time).toContain('08:00');
  });

  test('filters by airline correctly', () => {
    const filters = {
      stops: [],
      departureTime: [],
      returnTime: [],
      airlines: ['Austrian'],
      priceRange: { min: 0, max: 1000 }
    };

    const filtered = applyFilters(mockFlights, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].flights[0].airline).toBe('Austrian');
  });

  test('filters by price range correctly', () => {
    const filters = {
      stops: [],
      departureTime: [],
      returnTime: [],
      airlines: [],
      priceRange: { min: 0, max: 150 }
    };

    const filtered = applyFilters(mockFlights, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].price).toBeLessThanOrEqual(150);
  });

  test('combines multiple filters correctly', () => {
    const filters = {
      stops: ['direct'],
      departureTime: ['morning'],
      returnTime: [],
      airlines: ['Wizz Air'],
      priceRange: { min: 0, max: 150 }
    };

    const filtered = applyFilters(mockFlights, filters);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].flights).toHaveLength(1);
    expect(filtered[0].flights[0].airline).toBe('Wizz Air');
    expect(filtered[0].price).toBeLessThanOrEqual(150);
  });
});