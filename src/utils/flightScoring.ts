import { FlightOption } from '../types/flight';
import { supabase } from './supabase';
import { splitFlightSegments } from './flightSegments';

export type SortOption = 'cheapest' | 'fastest' | 'best';

interface ScoringSettings {
  direct_flight_bonus: number;
  arrival_time_bonuses: {
    early_morning: { start: number; end: number; points: number };
    morning: { start: number; end: number; points: number };
  };
  departure_time_bonuses: {
    afternoon: { start: number; end: number; points: number };
    evening: { start: number; end: number; points: number };
  };
  stop_penalties: {
    one_stop: number;
    two_plus_stops: number;
  };
  duration_penalties: {
    medium: { hours: number; points: number };
    long: { hours: number; points: number };
    very_long: { hours: number; points: number };
  };
}

// Rebalanced default settings
const DEFAULT_SETTINGS: ScoringSettings = {
  direct_flight_bonus: 10, // Increased from 5 to 10 to prioritize direct flights
  arrival_time_bonuses: {
    early_morning: { start: 3, end: 10, points: 2 }, // Reduced from 5 to 2
    morning: { start: 10, end: 15, points: 1 }       // Reduced from 3 to 1
  },
  departure_time_bonuses: {
    afternoon: { start: 14, end: 18, points: 1 },    // Reduced from 3 to 1
    evening: { start: 18, end: 24, points: 2 }       // Reduced from 5 to 2
  },
  stop_penalties: {
    one_stop: -8,      // Increased penalty from -5 to -8
    two_plus_stops: -15 // Increased penalty from -10 to -15
  },
  duration_penalties: {
    medium: { hours: 4, points: -2 },  // Increased penalty from -1 to -2
    long: { hours: 6, points: -4 },    // Increased penalty from -2 to -4
    very_long: { hours: 6, points: -6 } // Increased penalty from -3 to -6
  }
};

let cachedSettings: ScoringSettings | null = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getScoringSettings(): Promise<ScoringSettings> {
  const now = Date.now();
  if (cachedSettings && now - lastFetch < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from('scoring_settings')
      .select('*')
      .single();

    if (error) throw error;
    if (data?.settings) {
      cachedSettings = data.settings;
      lastFetch = now;
      return data.settings;
    }
  } catch (err) {
    console.warn('Error fetching scoring settings:', err);
  }

  return DEFAULT_SETTINGS;
}

async function calculateFlightScore(flight: FlightOption): Promise<number> {
  const settings = await getScoringSettings();
  let score = 0;

  // Determine if the flight is a round-trip by checking if return_flights exists
  const isRoundTrip = flight.return_flights && flight.return_flights.length > 0;

  // Get origin and destination from the first flight segment
  const origin = flight.flights[0]?.departure_airport.id;
  const destination = flight.flights[0]?.arrival_airport.id;

  // Use the departure time of the first flight as the outbound departure date.
  const outboundDepartureDate = flight.flights[0]?.departure_airport.time;
  // For round-trip, find the first flight with a departure time later than the outbound departure date.
  const inboundDepartureDate = isRoundTrip
    ? flight.flights.find(f => new Date(f.departure_airport.time) > new Date(outboundDepartureDate))?.departure_airport.time || null
    : null;

  // Split the flight segments using the actual departure times.
  const { outboundFlights, returnFlights } = splitFlightSegments(flight.flights, {
    tripType: isRoundTrip ? 'roundTrip' : 'oneWay',
    departureDate: outboundDepartureDate,
    returnDate: inboundDepartureDate,
    fromCode: origin,
    toCode: destination
  });

  // Calculate stops (each stop increases the count by one per leg)
  const outboundStops = outboundFlights.length - 1;
  const returnStops = returnFlights ? returnFlights.length - 1 : 0;

  // Apply direct flight bonus
  if (isRoundTrip) {
    if (outboundStops === 0 && returnStops === 0) {
      score += settings.direct_flight_bonus * 2;
      console.log('Applied double direct flight bonus for round-trip:', settings.direct_flight_bonus * 2);
    }
  } else {
    if (outboundStops === 0) {
      score += settings.direct_flight_bonus;
      console.log('Applied direct flight bonus for one-way:', settings.direct_flight_bonus);
    }
  }

  // Apply stop penalties
  if (isRoundTrip) {
    if (outboundStops === 1) score += settings.stop_penalties.one_stop;
    if (outboundStops >= 2) score += settings.stop_penalties.two_plus_stops;
    if (returnStops === 1) score += settings.stop_penalties.one_stop;
    if (returnStops >= 2) score += settings.stop_penalties.two_plus_stops;
  } else {
    if (outboundStops === 1) score += settings.stop_penalties.one_stop;
    if (outboundStops >= 2) score += settings.stop_penalties.two_plus_stops;
  }

  // Process time-based bonuses for each leg (using the first and last segments of each leg)
  const processTimeBonuses = (segments: typeof flight.flights) => {
    if (!segments.length) return 0;
    
    let legScore = 0;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    // Bonus based on arrival time (of final segment)
    const arrivalHour = new Date(lastSegment.arrival_airport.time).getHours();
    const { early_morning, morning } = settings.arrival_time_bonuses;
    if (arrivalHour >= early_morning.start && arrivalHour <= early_morning.end) {
      legScore += early_morning.points;
    } else if (arrivalHour > morning.start && arrivalHour < morning.end) {
      legScore += morning.points;
    }

    // Bonus based on departure time (of first segment)
    const departureHour = new Date(firstSegment.departure_airport.time).getHours();
    const { afternoon, evening } = settings.departure_time_bonuses;
    if (departureHour > afternoon.start && departureHour < afternoon.end) {
      legScore += afternoon.points;
    } else if (departureHour >= evening.start && departureHour <= evening.end) {
      legScore += evening.points;
    }

    return legScore;
  };

  score += processTimeBonuses(outboundFlights);
  if (returnFlights) {
    score += processTimeBonuses(returnFlights);
  }

  // Duration penalties
  const durationHours = flight.total_duration / 60;
  const { medium, long, very_long } = settings.duration_penalties;
  if (durationHours > 2) {
    if (durationHours <= medium.hours) {
      score += medium.points;
    } else if (durationHours <= long.hours) {
      score += long.points;
    } else {
      score += very_long.points;
    }
  }

  // Price factor: bonus for flights with below-average prices
  const averagePrice = 200;
  if (flight.price < averagePrice) {
    score += 2;
  }

  return score;
}

export async function sortFlights(flights: FlightOption[], sortBy: SortOption): Promise<FlightOption[]> {
  const sortedFlights = [...flights];

  switch (sortBy) {
    case 'cheapest':
      return sortedFlights.sort((a, b) => a.price - b.price);

    case 'fastest':
      return sortedFlights.sort((a, b) => a.total_duration - b.total_duration);

    case 'best':
      const scores = await Promise.all(
        sortedFlights.map(async flight => ({
          flight,
          score: await calculateFlightScore(flight)
        }))
      );
      return scores
        .sort((a, b) => b.score - a.score || a.flight.price - b.flight.price)
        .map(item => item.flight);

    default:
      return sortedFlights;
  }
}

export async function getScoreDescription(flight: FlightOption): Promise<string> {
  const score = await calculateFlightScore(flight);
  const settings = await getScoringSettings();
  const factors: string[] = [];

  // Determine if the flight is round-trip based on existence of return_flights
  const isRoundTrip = flight.return_flights && flight.return_flights.length > 0;
  const origin = flight.flights[0]?.departure_airport.id;
  const destination = flight.flights[0]?.arrival_airport.id;

  const outboundDepartureDate = flight.flights[0]?.departure_airport.time;
  const inboundDepartureDate = isRoundTrip
    ? flight.flights.find(f => new Date(f.departure_airport.time) > new Date(outboundDepartureDate))?.departure_airport.time || null
    : null;

  const { outboundFlights, returnFlights } = splitFlightSegments(flight.flights, {
    tripType: isRoundTrip ? 'roundTrip' : 'oneWay',
    departureDate: outboundDepartureDate,
    returnDate: inboundDepartureDate,
    fromCode: origin,
    toCode: destination
  });

  const outboundStops = outboundFlights.length - 1;
  const returnStops = returnFlights ? returnFlights.length - 1 : 0;

  if (isRoundTrip) {
    if (outboundStops === 0 && returnStops === 0) {
      factors.push(`Direct round-trip flight (+${settings.direct_flight_bonus * 2})`);
    } else {
      if (outboundStops > 0) {
        factors.push(`${outboundStops} outbound stop${outboundStops !== 1 ? 's' : ''} (${outboundStops === 1 ? settings.stop_penalties.one_stop : settings.stop_penalties.two_plus_stops})`);
      }
      if (returnStops > 0) {
        factors.push(`${returnStops} return stop${returnStops !== 1 ? 's' : ''} (${returnStops === 1 ? settings.stop_penalties.one_stop : settings.stop_penalties.two_plus_stops})`);
      }
    }
  } else {
    if (outboundStops === 0) {
      factors.push(`Direct flight (+${settings.direct_flight_bonus})`);
    } else {
      factors.push(`${outboundStops} stop${outboundStops !== 1 ? 's' : ''} (${outboundStops === 1 ? settings.stop_penalties.one_stop : settings.stop_penalties.two_plus_stops})`);
    }
  }

  const addTimeBonuses = (segments: typeof flight.flights, prefix: string) => {
    if (!segments.length) return;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const arrivalHour = new Date(lastSegment.arrival_airport.time).getHours();
    const departureHour = new Date(firstSegment.departure_airport.time).getHours();
    const { early_morning, morning } = settings.arrival_time_bonuses;
    if (arrivalHour >= early_morning.start && arrivalHour <= early_morning.end) {
      factors.push(`${prefix} early morning arrival (+${early_morning.points})`);
    } else if (arrivalHour > morning.start && arrivalHour < morning.end) {
      factors.push(`${prefix} morning arrival (+${morning.points})`);
    }
    const { afternoon, evening } = settings.departure_time_bonuses;
    if (departureHour > afternoon.start && departureHour < afternoon.end) {
      factors.push(`${prefix} afternoon departure (+${afternoon.points})`);
    } else if (departureHour >= evening.start && departureHour <= evening.end) {
      factors.push(`${prefix} evening departure (+${evening.points})`);
    }
  };

  addTimeBonuses(outboundFlights, isRoundTrip ? 'Outbound' : '');
  if (returnFlights) {
    addTimeBonuses(returnFlights, 'Return');
  }

  const durationHours = flight.total_duration / 60;
  const { medium, long, very_long } = settings.duration_penalties;
  if (durationHours > 2) {
    if (durationHours <= medium.hours) {
      factors.push(`Medium duration (${medium.points})`);
    } else if (durationHours <= long.hours) {
      factors.push(`Long duration (${long.points})`);
    } else {
      factors.push(`Very long duration (${very_long.points})`);
    }
  }

  if (flight.price < 200) {
    factors.push('Below average price (+2)');
  }

  return `Score: ${score} (${factors.join(', ')})`;
}
