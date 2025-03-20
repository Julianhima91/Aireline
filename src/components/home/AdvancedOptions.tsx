import React from 'react';
import { PassengerSelector } from './PassengerSelector';

type TravelClass = '1' | '2' | '3' | '4';
type StopsFilter = '0' | '1' | '2' | '3';

interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

interface AdvancedOptionsProps {
  travelClass: TravelClass;
  stops: StopsFilter;
  passengers: PassengerCounts;
  onTravelClassChange: (value: TravelClass) => void;
  onStopsChange: (value: StopsFilter) => void;
  onPassengerChange: (passengers: PassengerCounts) => void;
}

export function AdvancedOptions({
  travelClass,
  stops,
  passengers,
  onTravelClassChange,
  onStopsChange,
  onPassengerChange,
}: AdvancedOptionsProps) {
  return (
    <>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Travel Class
          </label>
          <select
            value={travelClass}
            onChange={(e) => onTravelClassChange(e.target.value as TravelClass)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="1">Economy</option>
            <option value="2">Premium Economy</option>
            <option value="3">Business</option>
            <option value="4">First</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Stops
          </label>
          <select
            value={stops}
            onChange={(e) => onStopsChange(e.target.value as StopsFilter)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="0">Any number of stops</option>
            <option value="1">Nonstop only</option>
            <option value="2">1 stop or fewer</option>
            <option value="3">2 stops or fewer</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Passengers
          </label>
          <PassengerSelector
            passengers={passengers}
            onChange={onPassengerChange}
          />
        </div>
      </div>
    </>
  );
}