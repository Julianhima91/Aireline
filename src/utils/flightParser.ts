import { FlightOption, Flight, Layover } from '../types/flight';

interface SkySegment {
  id: string;
  origin: {
    flightPlaceId: string;
    displayCode: string;
    parent: {
      flightPlaceId: string;
      displayCode: string;
      name: string;
      type: string;
    };
    name: string;
    type: string;
    country: string;
  };
  destination: {
    flightPlaceId: string;
    displayCode: string;
    parent: {
      flightPlaceId: string;
      displayCode: string;
      name: string;
      type: string;
    };
    name: string;
    type: string;
    country: string;
  };
  departure: string;
  arrival: string;
  durationInMinutes: number;
  flightNumber: string;
  marketingCarrier: {
    id: number;
    name: string;
    alternateId: string;
    allianceId: number;
    displayCode: string;
  };
  operatingCarrier: {
    id: number;
    name: string;
    alternateId: string;
    allianceId: number;
    displayCode: string;
  };
}

interface SkyLeg {
  id: string;
  origin: {
    id: string;
    name: string;
    displayCode: string;
    city: string;
    country: string;
  };
  destination: {
    id: string;
    name: string;
    displayCode: string;
    city: string;
    country: string;
  };
  durationInMinutes: number;
  stopCount: number;
  departure: string;
  arrival: string;
  timeDeltaInDays: number;
  carriers: {
    marketing: Array<{
      id: number;
      alternateId: string;
      logoUrl: string;
      name: string;
    }>;
    operationType: string;
  };
  segments: SkySegment[];
}

interface SkyItinerary {
  id: string;
  legs: SkyLeg[];
  price: {
    raw: number;
    formatted: string;
  };
  score: number;
  tags?: string[];
}

export function parseRapidApiResponse(response: any): { best_flights: FlightOption[]; other_flights: FlightOption[] } {
  console.log('Parsing RapidAPI response:', response);

  if (!response?.data?.itineraries) {
    console.log('Invalid response format - missing itineraries');
    return { best_flights: [], other_flights: [] };
  }

  const itineraries: SkyItinerary[] = response.data.itineraries;
  const bestFlights: FlightOption[] = [];
  const otherFlights: FlightOption[] = [];

  for (const itinerary of itineraries) {
    try {
      const flightOption = convertItineraryToFlightOption(itinerary);
      if (flightOption) {
        // Use score and tags to determine if it's a "best" flight
        const isBestFlight = itinerary.score > 0.8 || 
                           (itinerary.tags && (
                             itinerary.tags.includes('shortest') ||
                             itinerary.tags.includes('cheapest') ||
                             itinerary.tags.includes('best_value')
                           ));

        if (isBestFlight) {
          bestFlights.push(flightOption);
        } else {
          otherFlights.push(flightOption);
        }
      }
    } catch (err) {
      console.error('Error processing itinerary:', err);
    }
  }

  console.log('Parsed flights:', {
    best: bestFlights.length,
    other: otherFlights.length
  });

  return { best_flights: bestFlights, other_flights: otherFlights };
}

function processLeg(leg: SkyLeg): { flights: Flight[]; layovers: Layover[]; duration: number } {
  const flights: Flight[] = [];
  const layovers: Layover[] = [];
  let totalDuration = 0;

  leg.segments.forEach((segment, index) => {
    // Add layover if there's a previous segment
    if (index > 0) {
      const prevSegment = leg.segments[index - 1];
      const layoverStart = new Date(prevSegment.arrival);
      const layoverEnd = new Date(segment.departure);
      const duration = Math.round((layoverEnd.getTime() - layoverStart.getTime()) / 60000);
      const isOvernight = layoverEnd.getDate() > layoverStart.getDate();

      layovers.push({
        duration,
        name: segment.origin.name,
        id: segment.origin.displayCode,
        overnight: isOvernight
      });
      totalDuration += duration;
    }

    // Add flight segment
    const flight: Flight = {
      departure_airport: {
        id: segment.origin.displayCode,
        name: segment.origin.name,
        time: segment.departure
      },
      arrival_airport: {
        id: segment.destination.displayCode,
        name: segment.destination.name,
        time: segment.arrival
      },
      duration: segment.durationInMinutes,
      airline: segment.marketingCarrier.name,
      airline_logo: leg.carriers.marketing[0]?.logoUrl || 
                   `https://logos.skyscnr.com/images/airlines/favicon/${segment.marketingCarrier.alternateId}.png`,
      flight_number: segment.flightNumber,
      travel_class: 'Economy',
      legroom: 'Standard',
      extensions: []
    };

    flights.push(flight);
    totalDuration += segment.durationInMinutes;
  });

  return { flights, layovers, duration: totalDuration };
}

function convertItineraryToFlightOption(itinerary: SkyItinerary): FlightOption | null {
  try {
    const outboundLeg = itinerary.legs[0];
    const returnLeg = itinerary.legs[1];
    const isRoundTrip = !!returnLeg;

    // Process outbound leg
    const outbound = processLeg(outboundLeg);
    let return_: { flights: Flight[]; layovers: Layover[]; duration: number } | null = null;

    // Process return leg if it exists
    if (isRoundTrip && returnLeg) {
      return_ = processLeg(returnLeg);
    }

    // Calculate total duration
    const totalDuration = outbound.duration + (return_?.duration || 0);

    // Create flight option
    const flightOption: FlightOption = {
      flights: [...outbound.flights, ...(return_?.flights || [])],
      layovers: [...outbound.layovers, ...(return_?.layovers || [])],
      total_duration: totalDuration,
      price: itinerary.price.raw,
      type: isRoundTrip ? 'Round trip' : 'One way',
      airline_logo: outbound.flights[0]?.airline_logo,
      // Add separate outbound and return flight arrays
      outbound_flights: outbound.flights,
      return_flights: return_?.flights,
      // Add separate outbound and return layover arrays
      outbound_layovers: outbound.layovers.length > 0 ? outbound.layovers : undefined,
      return_layovers: return_?.layovers.length ? return_.layovers : undefined
    };

    console.log('Created flight option:', {
      id: itinerary.id,
      type: flightOption.type,
      outboundSegments: outbound.flights.length,
      outboundLayovers: outbound.layovers.length,
      returnSegments: return_?.flights.length || 0,
      returnLayovers: return_?.layovers.length || 0,
      price: flightOption.price
    });

    return flightOption;

  } catch (err) {
    console.error('Error converting itinerary:', err);
    return null;
  }
}