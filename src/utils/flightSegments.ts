import { Flight } from '../types/flight';
import { SearchParams } from '../types/search';

interface SegmentSplit {
  outboundFlights: Flight[];
  returnFlights: Flight[] | null;
}

export function splitFlightSegments(flights: Flight[], searchParams: SearchParams): SegmentSplit {
  // If not roundTrip or no flights, return as-is
  if (!flights?.length || searchParams.tripType !== 'roundTrip') {
    return {
      outboundFlights: flights || [],
      returnFlights: null
    };
  }

  const fromCode = searchParams.fromCode;
  const toCode = searchParams.toCode;
  let outboundEnd = -1;
  let returnStart = -1;

  // Find the index for the outbound leg:
  // Assume flights are ordered: the first flight's departure should match fromCode.
  for (let i = 0; i < flights.length; i++) {
    if (flights[0].departure_airport.id === fromCode && flights[i].arrival_airport.id === toCode) {
      outboundEnd = i;
      break;
    }
  }

  // Find the index for the return leg:
  // Look for the first flight after outboundEnd whose departure matches toCode and arrival matches fromCode.
  if (outboundEnd !== -1) {
    for (let i = outboundEnd + 1; i < flights.length; i++) {
      if (flights[i].departure_airport.id === toCode && flights[i].arrival_airport.id === fromCode) {
        returnStart = i;
        break;
      }
    }
  }

  // Optional: Minimal logging – disable in production
  if (process.env.NODE_ENV === 'development') {
    console.log('Flight Segments Split:', {
      totalSegments: flights.length,
      outboundEnd,
      returnStart,
      outboundFlights: outboundEnd !== -1 ? flights.slice(0, outboundEnd + 1).map(f => ({
        flightNumber: f.flight_number,
        from: f.departure_airport.id,
        to: f.arrival_airport.id
      })) : [],
      returnFlights: returnStart !== -1 ? flights.slice(returnStart).map(f => ({
        flightNumber: f.flight_number,
        from: f.departure_airport.id,
        to: f.arrival_airport.id
      })) : null
    });
  }

  if (outboundEnd !== -1 && returnStart !== -1) {
    return {
      outboundFlights: flights.slice(0, outboundEnd + 1),
      returnFlights: flights.slice(returnStart)
    };
  }

  // If no clear split is found, treat all flights as outbound.
  return {
    outboundFlights: flights,
    returnFlights: null
  };
}

export function getStopCount(flights: Flight[]): number {
  return flights?.length ? flights.length - 1 : 0;
}

export function getTotalDuration(flights: Flight[]): number {
  return flights?.reduce((total, flight) => total + (flight.duration || 0), 0) || 0;
}
