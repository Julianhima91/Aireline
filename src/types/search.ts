export interface City {
  name: string;   // Airport name with IATA code, e.g. "Tirana International Airport (TIA)"
  code: string;   // IATA code, e.g. "TIA"
  country: string; // State/Country, e.g. "Albania"
}

export interface PassengerCounts {
  adults: number;
  children: number;
  infantsInSeat: number;
  infantsOnLap: number;
}

export interface SearchParams {
  fromLocation: string;
  toLocation: string;
  fromCode: string;
  toCode: string;
  departureDate: string;
  returnDate: string | null;
  tripType: 'roundTrip' | 'oneWay';
  travelClass: string;
  stops: string;
  passengers: PassengerCounts;
}

export type PriceStabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW';