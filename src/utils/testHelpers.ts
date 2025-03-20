import { SearchParams, PriceStabilityLevel } from '../types/search';

export function validateSearchParams(params: SearchParams): string[] {
  const errors: string[] = [];
  
  if (!params.fromLocation || !params.fromCode) {
    errors.push('Departure location is required');
  }
  
  if (!params.toLocation || !params.toCode) {
    errors.push('Arrival location is required');
  }
  
  if (!params.departureDate) {
    errors.push('Departure date is required');
  }
  
  if (params.tripType === 'roundTrip' && !params.returnDate) {
    errors.push('Return date is required for round trips');
  }
  
  if (params.returnDate && new Date(params.returnDate) < new Date(params.departureDate)) {
    errors.push('Return date must be after departure date');
  }
  
  const totalPassengers = 
    params.passengers.adults +
    params.passengers.children +
    params.passengers.infantsInSeat +
    params.passengers.infantsOnLap;
    
  if (totalPassengers === 0) {
    errors.push('At least one passenger is required');
  }
  
  if (params.passengers.adults < 1) {
    errors.push('At least one adult passenger is required');
  }
  
  return errors;
}

export function mockSearchResponse(params: SearchParams) {
  return {
    best_flights: [
      {
        flights: [
          {
            departure_airport: {
              name: params.fromLocation,
              id: params.fromCode,
              time: new Date(params.departureDate).toISOString()
            },
            arrival_airport: {
              name: params.toLocation,
              id: params.toCode,
              time: new Date(
                new Date(params.departureDate).getTime() + 2 * 60 * 60 * 1000
              ).toISOString()
            },
            duration: 120,
            airline: "Test Airlines",
            airline_logo: "https://example.com/airline.png",
            flight_number: "TA123",
            travel_class: "Economy",
            legroom: "Standard",
            extensions: ["Wi-Fi", "Power Outlets"]
          }
        ],
        total_duration: 120,
        price: 299.99,
        type: "Best value",
        airline_logo: "https://example.com/airline.png"
      }
    ],
    other_flights: []
  };
}

export function calculateExpectedPriceStability(departureDate: string): PriceStabilityLevel {
  const daysUntilDeparture = Math.ceil(
    (new Date(departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDeparture > 60) return 'HIGH';
  if (daysUntilDeparture > 30) return 'MEDIUM';
  return 'LOW';
}

export function shouldHaveCache(departureDate: string): boolean {
  const daysUntilDeparture = Math.ceil(
    (new Date(departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilDeparture <= 7;
}

export function isCacheValid(cachedUntil: string | null): boolean {
  if (!cachedUntil) return false;
  return new Date(cachedUntil) > new Date();
}