import { Flight } from '../types/flight';

interface ItineraryPair {
  outbound: Flight[];
  return: Flight[];
  isValid: boolean;
  validationErrors?: string[];
}

interface AnalysisResult {
  matchedPairs: ItineraryPair[];
  unmatchedOutbound: Flight[][];
  unmatchedReturn: Flight[][];
  summary: {
    totalPairs: number;
    validPairs: number;
    unmatchedOutbound: number;
    unmatchedReturn: number;
  };
}

/**
 * Analyzes flight itineraries and matches outbound/return pairs
 */
export function analyzeFlightItineraries(
  flights: Flight[],
  fromCode: string,
  toCode: string
): AnalysisResult {
  console.log('Analyzing flight itineraries:', {
    totalFlights: flights.length,
    fromCode,
    toCode
  });

  // Initialize result containers
  const matchedPairs: ItineraryPair[] = [];
  const unmatchedOutbound: Flight[][] = [];
  const unmatchedReturn: Flight[][] = [];

  // Group flights into segments
  const segments = groupFlightSegments(flights, fromCode, toCode);
  console.log('Grouped flight segments:', {
    outbound: segments.outbound.length,
    return: segments.return.length,
    unmatched: segments.unmatched.length
  });

  // Match outbound and return segments
  for (const outboundSegment of segments.outbound) {
    let matched = false;
    const outboundArrival = new Date(outboundSegment[outboundSegment.length - 1].arrival_airport.time);

    for (const returnSegment of segments.return) {
      const returnDeparture = new Date(returnSegment[0].departure_airport.time);

      // Validate the pair
      const validationResult = validateFlightPair(outboundSegment, returnSegment, outboundArrival, returnDeparture);

      if (validationResult.isValid) {
        matchedPairs.push({
          outbound: outboundSegment,
          return: returnSegment,
          isValid: true
        });
        matched = true;
        break;
      } else {
        console.log('Invalid flight pair:', validationResult.errors);
      }
    }

    if (!matched) {
      unmatchedOutbound.push(outboundSegment);
    }
  }

  // Add remaining unmatched return segments
  const matchedReturnIds = new Set(matchedPairs.flatMap(pair => 
    pair.return.map(flight => flight.flight_number)
  ));

  segments.return.forEach(returnSegment => {
    if (!matchedReturnIds.has(returnSegment[0].flight_number)) {
      unmatchedReturn.push(returnSegment);
    }
  });

  // Generate summary
  const summary = {
    totalPairs: matchedPairs.length,
    validPairs: matchedPairs.filter(pair => pair.isValid).length,
    unmatchedOutbound: unmatchedOutbound.length,
    unmatchedReturn: unmatchedReturn.length
  };

  console.log('Analysis complete:', summary);

  return {
    matchedPairs,
    unmatchedOutbound,
    unmatchedReturn,
    summary
  };
}

/**
 * Groups flights into outbound and return segments
 */
function groupFlightSegments(
  flights: Flight[],
  fromCode: string,
  toCode: string
): {
  outbound: Flight[][];
  return: Flight[][];
  unmatched: Flight[][];
} {
  const outbound: Flight[][] = [];
  const return_: Flight[][] = [];
  const unmatched: Flight[][] = [];
  let currentSegment: Flight[] = [];

  console.log('Grouping flight segments:', {
    totalFlights: flights.length,
    fromCode,
    toCode
  });

  for (let i = 0; i < flights.length; i++) {
    const flight = flights[i];
    currentSegment.push(flight);

    // Check if this is the last flight or if next flight starts a new segment
    const isLastFlight = i === flights.length - 1;
    const nextFlight = !isLastFlight ? flights[i + 1] : null;
    const isSegmentEnd = isLastFlight || !isConnectingFlight(flight, nextFlight);

    if (isSegmentEnd) {
      // Determine segment type based on origin/destination
      const firstFlight = currentSegment[0];
      const lastFlight = currentSegment[currentSegment.length - 1];

      if (firstFlight.departure_airport.id === fromCode && lastFlight.arrival_airport.id === toCode) {
        outbound.push([...currentSegment]);
      } else if (firstFlight.departure_airport.id === toCode && lastFlight.arrival_airport.id === fromCode) {
        return_.push([...currentSegment]);
      } else {
        unmatched.push([...currentSegment]);
      }

      // Start new segment
      currentSegment = [];
    }
  }

  console.log('Grouped segments:', {
    outbound: outbound.length,
    return: return_.length,
    unmatched: unmatched.length
  });

  return {
    outbound,
    return: return_,
    unmatched
  };
}

/**
 * Checks if two flights are connecting
 */
function isConnectingFlight(flight1: Flight, flight2: Flight | null): boolean {
  if (!flight2) return false;

  const arrival = new Date(flight1.arrival_airport.time);
  const departure = new Date(flight2.departure_airport.time);
  const layoverTime = departure.getTime() - arrival.getTime();

  // Minimum 30 minutes, maximum 24 hours for connection
  const MIN_LAYOVER = 30 * 60 * 1000;
  const MAX_LAYOVER = 24 * 60 * 60 * 1000;

  return (
    flight1.arrival_airport.id === flight2.departure_airport.id &&
    layoverTime >= MIN_LAYOVER &&
    layoverTime <= MAX_LAYOVER
  );
}

/**
 * Validates a pair of outbound and return flights
 */
function validateFlightPair(
  outbound: Flight[],
  return_: Flight[],
  outboundArrival: Date,
  returnDeparture: Date
): {
  isValid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  // Check minimum connection time (4 hours)
  const connectionTime = returnDeparture.getTime() - outboundArrival.getTime();
  const MIN_CONNECTION = 4 * 60 * 60 * 1000;
  if (connectionTime < MIN_CONNECTION) {
    errors.push(`Connection time (${Math.round(connectionTime / (60 * 60 * 1000))}h) is less than minimum 4h`);
  }

  // Check that return departs from outbound arrival city
  const outboundArrivalCity = outbound[outbound.length - 1].arrival_airport.id;
  const returnDepartureCity = return_[0].departure_airport.id;
  if (outboundArrivalCity !== returnDepartureCity) {
    errors.push(`Return departure city (${returnDepartureCity}) doesn't match outbound arrival (${outboundArrivalCity})`);
  }

  // Check that return arrives at outbound departure city
  const outboundDepartureCity = outbound[0].departure_airport.id;
  const returnArrivalCity = return_[return_.length - 1].arrival_airport.id;
  if (returnArrivalCity !== outboundDepartureCity) {
    errors.push(`Return arrival city (${returnArrivalCity}) doesn't match outbound departure (${outboundDepartureCity})`);
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}