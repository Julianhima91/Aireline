import { describe, test, expect, vi } from 'vitest';
import { sortFlights, getScoreDescription } from '../utils/flightScoring';
import { FlightOption } from '../types/flight';

// Mock flight data
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

describe('Flight Scoring', () => {
  test('sorts by price correctly', async () => {
    const sorted = await sortFlights(mockFlights, 'cheapest');
    expect(sorted[0].price).toBe(100);
    expect(sorted[1].price).toBe(200);
  });

  test('sorts by duration correctly', async () => {
    const sorted = await sortFlights(mockFlights, 'fastest');
    expect(sorted[0].total_duration).toBe(120);
    expect(sorted[1].total_duration).toBe(300);
  });

  test('sorts by best score correctly', async () => {
    const sorted = await sortFlights(mockFlights, 'best');
    
    // Direct flight should be scored higher
    expect(sorted[0].flights.length).toBe(1);
    
    // Get score descriptions for verification
    const firstScore = await getScoreDescription(sorted[0]);
    const secondScore = await getScoreDescription(sorted[1]);
    
    expect(firstScore).toContain('Direct flight');
    expect(secondScore).toContain('1 stop');
  });

  test('provides detailed score description', async () => {
    const description = await getScoreDescription(mockFlights[0]);
    
    expect(description).toContain('Direct flight');
    expect(description).toContain('Morning arrival');
    expect(description).not.toContain('stop');
  });
});