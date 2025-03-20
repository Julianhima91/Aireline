export interface Airport {
  name: string;
  id: string;
  time: string;
}

export interface Flight {
  departure_airport: Airport;
  arrival_airport: Airport;
  duration: number;
  airline: string;
  airline_logo: string;
  flight_number: string;
  travel_class: string;
  legroom: string;
  extensions: string[];
  baggage?: string;
  overnight?: boolean;
  airplane?: string;
}

export interface Layover {
  duration: number;
  name: string;
  id: string;
  overnight?: boolean;
}

export interface CarbonEmissions {
  this_flight: number;
  typical_for_this_route: number;
  difference_percent: number;
}

export interface FlightOption {
  flights: Flight[];
  layovers?: Layover[];
  total_duration: number;
  price: number;
  type: string;
  airline_logo: string;
  carbon_emissions?: CarbonEmissions;
  // Add new fields for separate outbound/return data
  outbound_flights?: Flight[];
  return_flights?: Flight[];
  outbound_layovers?: Layover[];
  return_layovers?: Layover[];
}