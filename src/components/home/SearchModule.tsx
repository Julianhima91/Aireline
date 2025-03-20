import React from 'react';
import { TripTypeSelector } from './TripTypeSelector';
import { LocationInputs } from './LocationInputs';
import { DatePickers } from './DatePickers';
import { PassengerSelector } from './PassengerSelector';
import { SearchButton } from './SearchButton';
import { City } from '../../types/search';

interface SearchModuleProps {
  onSearch: () => void;
  loading: boolean;
  error: string | null;
  tripType: 'roundTrip' | 'oneWay';
  setTripType: (type: 'roundTrip' | 'oneWay') => void;
  fromCity: City | null;
  setFromCity: (city: City | null) => void;
  toCity: City | null;
  setToCity: (city: City | null) => void;
  departureDate: Date | null;
  setDepartureDate: (date: Date | null) => void;
  returnDate: Date | null;
  setReturnDate: (date: Date | null) => void;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  setPassengers: (passengers: {
    adults: number;
    children: number;
    infants: number;
  }) => void;
  directFlightsOnly: boolean;
  setDirectFlightsOnly: (value: boolean) => void;
}

export function SearchModule({
  onSearch,
  loading,
  error,
  tripType,
  setTripType,
  fromCity,
  setFromCity,
  toCity,
  setToCity,
  departureDate,
  setDepartureDate,
  returnDate,
  setReturnDate,
  passengers,
  setPassengers,
  directFlightsOnly,
  setDirectFlightsOnly
}: SearchModuleProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 md:p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-6 md:space-y-4">
          {/* Trip Type & Passenger Selection - Compact Layout */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <TripTypeSelector
                tripType={tripType}
                onTripTypeChange={setTripType}
              />
            </div>
            <div className="w-[120px]">
              <PassengerSelector
                passengers={passengers}
                onChange={setPassengers}
              />
            </div>
          </div>

          {/* Location Inputs */}
          <LocationInputs
            fromCity={fromCity}
            setFromCity={setFromCity}
            toCity={toCity}
            setToCity={setToCity}
          />

          {/* Date Inputs */}
          <DatePickers
            tripType={tripType}
            departureDate={departureDate}
            returnDate={returnDate}
            onDepartureDateChange={setDepartureDate}
            onReturnDateChange={setReturnDate}
            onTripTypeChange={setTripType}
            fromCode={fromCity?.code}
            toCode={toCity?.code}
          />

          {/* Search Button & Direct Flights */}
          <div className="space-y-4">
            <SearchButton loading={loading} onClick={onSearch} />
            
            <div className="flex items-center justify-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={directFlightsOnly}
                  onChange={(e) => setDirectFlightsOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-600">Show only direct flights</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}