import { FlightOption, Flight, Layover } from '../types/flight';

interface ApiSegment {
  id: string;
  origin_place_id: number;
  destination_place_id: number;
  arrival: string;
  departure: string;
  duration: number;
  marketing_flight_number: string;
  marketing_carrier_id: number;
  operating_carrier_id: number;
  mode: string;
}

interface ApiLeg {
  id: string;
  origin_place_id: number;
  destination_place_id: number;
  departure: string;
  arrival: string;
  segment_ids: string[];
  duration: number;
  stop_count: number;
  marketing_carrier_ids: number[];
  operating_carrier_ids: number[];
  stop_ids: number[][];
}

interface ApiItinerary {
  id: string;
  leg_ids: string[];
  pricing_options: Array<{
    price: {
      amount: number;
    };
  }>;
}

export function parseFlightApiResponse(response: any): { best_flights: FlightOption[]; other_flights: FlightOption[] } {
  console.time('parseFlightApiResponse');
  console.log('🚀 FlightAPI.io Response:', response);

  if (!response?.itineraries?.length) {
    console.log('No itineraries found in response');
    return { best_flights: [], other_flights: [] };
  }

  // Pre-build lookup maps for O(1) access
  const carrierMap = new Map<number, any>(
    response.carriers.map((c: any) => {
      const id = c.id < 0 ? Math.abs(c.id) : c.id;
      return [id, c];
    })
  );
  const placeMap = new Map<number, any>(response.places.map((p: any) => [p.id, p]));
  const segmentMap = new Map<string, ApiSegment>(response.segments.map((s: any) => [s.id, s]));
  const legMap = new Map<string, ApiLeg>(response.legs.map((l: any) => [l.id, l]));

  const flightOptions = response.itineraries
    .map((itinerary: ApiItinerary) => {
      try {
        // Get legs for outbound and return flights
        const legs = itinerary.leg_ids.map(legId => legMap.get(legId)).filter(Boolean);
        if (!legs.length) {
          console.warn('No legs found for itinerary:', itinerary.id);
          return null;
        }

        const outboundFlights: Flight[] = [];
        const returnFlights: Flight[] = [];
        const outboundLayovers: Layover[] = [];
        const returnLayovers: Layover[] = [];
        let totalDuration = 0;

        // Process each leg (outbound and return)
        legs.forEach((leg, legIndex) => {
          const isReturn = legIndex === 1;
          let prevSegment: ApiSegment | null = null;
          
          // Get segments for this leg
          const segments = leg.segment_ids
            .map(segmentId => segmentMap.get(segmentId))
            .filter(Boolean);

          // Process segments
          segments.forEach(segment => {
            // Handle layover between segments
            if (prevSegment) {
              const layoverStart = new Date(prevSegment.arrival);
              const layoverEnd = new Date(segment.departure);
              const duration = Math.round((layoverEnd.getTime() - layoverStart.getTime()) / 60000);
              const isOvernight = new Date(segment.departure).getDate() > new Date(prevSegment.arrival).getDate();
              
              const layoverPlace = placeMap.get(prevSegment.destination_place_id);
              if (layoverPlace) {
                const layover: Layover = {
                  duration,
                  name: layoverPlace.name,
                  id: layoverPlace.display_code,
                  overnight: isOvernight
                };
                
                if (isReturn) {
                  returnLayovers.push(layover);
                } else {
                  outboundLayovers.push(layover);
                }
              }
              totalDuration += duration;
            }

            // Process current segment
            const carrierId = Math.abs(segment.marketing_carrier_id);
            const carrier = carrierMap.get(carrierId);
            const originPlace = placeMap.get(segment.origin_place_id);
            const destinationPlace = placeMap.get(segment.destination_place_id);

            if (!originPlace || !destinationPlace) {
              console.warn('Missing place data for segment:', segment.id);
              return;
            }

            const flight: Flight = {
              departure_airport: {
                id: originPlace.display_code,
                name: originPlace.name,
                time: segment.departure
              },
              arrival_airport: {
                id: destinationPlace.display_code,
                name: destinationPlace.name,
                time: segment.arrival
              },
              duration: segment.duration,
              airline: carrier.name,
              airline_logo: carrier.logo_url || `https://logos.skyscnr.com/images/airlines/favicon/${carrier.display_code}.png`,
              flight_number: segment.marketing_flight_number,
              travel_class: 'Economy',
              legroom: 'Standard',
              extensions: []
            };

            if (isReturn) {
              returnFlights.push(flight);
            } else {
              outboundFlights.push(flight);
            }
            totalDuration += segment.duration;
            prevSegment = segment;
          });
        });

        const flightOption: FlightOption = {
          flights: [...outboundFlights, ...returnFlights],
          layovers: [...outboundLayovers, ...returnLayovers],
          total_duration: totalDuration,
          price: itinerary.pricing_options[0]?.price?.amount || 0,
          type: legs.length > 1 ? 'Round trip' : 'One way',
          airline_logo: outboundFlights[0]?.airline_logo,
          outbound_flights: outboundFlights,
          return_flights: returnFlights.length > 0 ? returnFlights : undefined,
          outbound_layovers: outboundLayovers.length > 0 ? outboundLayovers : undefined,
          return_layovers: returnLayovers.length > 0 ? returnLayovers : undefined
        };

        console.log('Created flight option:', {
          id: itinerary.id,
          type: flightOption.type,
          outboundSegments: outboundFlights.length,
          outboundLayovers: outboundLayovers.length,
          returnSegments: returnFlights.length,
          returnLayovers: returnLayovers.length,
          totalDuration,
          price: flightOption.price
        });

        return flightOption;
      } catch (err) {
        console.error('Error processing itinerary:', itinerary.id, err);
        return null;
      }
    })
    .filter((option): option is FlightOption => option !== null);

  // Sort options by price and split into best/other flights
  flightOptions.sort((a, b) => a.price - b.price);
  const bestCount = Math.max(1, Math.ceil(flightOptions.length * 0.3));

  const result = {
    best_flights: flightOptions.slice(0, bestCount),
    other_flights: flightOptions.slice(bestCount)
  };

  console.log('Parsed flight results:', {
    totalFlights: flightOptions.length,
    bestFlights: result.best_flights.length,
    otherFlights: result.other_flights.length
  });
  console.timeEnd('parseFlightApiResponse');
  return result;
}