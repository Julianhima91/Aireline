import { FlightOption } from '../types/flight';
import { FilterState } from '../components/results/filters/FlightFilterPanel';

function isInTimeRange(time: string, ranges: string[]): boolean {
  if (ranges.length === 0) return true;

  const hour = new Date(time).getHours();
  return ranges.some(range => {
    switch (range) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'evening':
        return hour >= 18 && hour < 24;
      case 'night':
        return hour >= 0 && hour < 6;
      default:
        return false;
    }
  });
}

function getStopCount(flights: typeof FlightOption.prototype.flights): number {
  if (!flights?.length) return 0;
  return flights.length - 1;
}

function matchesStopFilter(flight: FlightOption, stops: string[], isRoundTrip: boolean): boolean {
  if (stops.length === 0) return true;

  // Use the separated outbound and return flights
  const outboundStops = flight.outbound_flights ? getStopCount(flight.outbound_flights) : 0;
  const returnStops = flight.return_flights ? getStopCount(flight.return_flights) : 0;

  return stops.some(stop => {
    switch (stop) {
      case 'direct':
        return isRoundTrip ? outboundStops === 0 && returnStops === 0 : outboundStops === 0;
      case '1stop':
        return isRoundTrip ? outboundStops <= 1 && returnStops <= 1 : outboundStops === 1;
      case '2plus':
        return isRoundTrip ? outboundStops >= 2 || returnStops >= 2 : outboundStops >= 2;
      default:
        return false;
    }
  });
}

function matchesAirlineFilter(flight: FlightOption, airlines: string[]): boolean {
  if (airlines.length === 0) return true;
  
  // Create a Set for faster airline lookup
  const airlineSet = new Set(airlines);
  
  // Check if any flight segment's airline matches the filter
  return flight.flights.some(segment => airlineSet.has(segment.airline));
}

function matchesPriceFilter(flight: FlightOption, priceRange: { min: number; max: number }): boolean {
  return flight.price >= priceRange.min && flight.price <= priceRange.max;
}

function matchesTimeFilter(flight: FlightOption, timeRanges: string[], isReturn: boolean = false): boolean {
  if (timeRanges.length === 0) return true;

  const segments = isReturn ? flight.return_flights : flight.outbound_flights;
  if (!segments?.length) return true;

  // Check departure time of first segment
  return isInTimeRange(segments[0].departure_airport.time, timeRanges);
}

export function applyFilters(
  flights: FlightOption[], 
  filters: FilterState, 
  isRoundTrip: boolean = false
): FlightOption[] {
  // Create a Set for faster airline lookup
  const airlineSet = new Set(filters.airlines);

  // Use array filter with optimized checks
  return flights.filter(flight => {
    // Price check first (fastest)
    if (!matchesPriceFilter(flight, filters.priceRange)) {
      return false;
    }

    // Airline check next (using Set for O(1) lookup)
    if (filters.airlines.length > 0 && !matchesAirlineFilter(flight, filters.airlines)) {
      return false;
    }

    // Stop check
    if (!matchesStopFilter(flight, filters.stops, isRoundTrip)) {
      return false;
    }

    // Time checks
    if (!matchesTimeFilter(flight, filters.departureTime)) {
      return false;
    }

    if (isRoundTrip && flight.return_flights && filters.returnTime.length > 0) {
      if (!matchesTimeFilter(flight, filters.returnTime, true)) {
        return false;
      }
    }

    return true;
  });
}

// Clear caches when needed (e.g., when new search results arrive)
export function clearFilterCaches(): void {
  // Add any cache clearing logic here if needed
}