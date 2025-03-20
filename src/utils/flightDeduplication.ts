import { FlightOption } from '../types/flight';

// Cache for flight signatures
const signatureCache = new Map<string, string>();

// Main deduplication function using Map for O(1) lookup
export function deduplicateFlights(flights: FlightOption[]): FlightOption[] {
  console.log('Starting deduplication of', flights.length, 'flights');

  // Use Map for O(1) lookup instead of Array.filter
  const uniqueFlights = new Map<string, FlightOption>();

  for (const flight of flights) {
    // Get cached signature if available
    let signature = signatureCache.get(flight.flights[0].flight_number);
    
    if (!signature) {
      signature = generateFlightSignature(flight);
      signatureCache.set(flight.flights[0].flight_number, signature);
    }
    
    // Only add if this is the first instance or has a better price
    const existingFlight = uniqueFlights.get(signature);
    if (!existingFlight || flight.price < existingFlight.price) {
      uniqueFlights.set(signature, flight);
    }
  }

  const result = Array.from(uniqueFlights.values());
  console.log('Deduplication complete:', {
    originalCount: flights.length,
    uniqueCount: result.length,
    duplicatesRemoved: flights.length - result.length
  });

  return result;
}

// Generate a unique signature for a flight using a faster method
function generateFlightSignature(flight: FlightOption): string {
  const segments = flight.flights;
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  // Create a minimal signature using only essential data
  return `${firstSegment.departure_airport.id}-${firstSegment.departure_airport.time}-${lastSegment.arrival_airport.id}-${lastSegment.arrival_airport.time}-${segments.length}`;
}

// Clear signature cache when needed
export function clearSignatureCache(): void {
  signatureCache.clear();
}