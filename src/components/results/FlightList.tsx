import React from 'react';
import { AlertCircle } from 'lucide-react';
import { FlightCard } from './FlightCard';
import { FlightOption } from '../../types/flight';
import { SearchParams } from '../../types/search';

interface FlightListProps {
  flights: FlightOption[];
  searchParams: SearchParams;
  batchId: string;
  onSelect: (flight: FlightOption) => void;
  onBack: () => void;
  isSearchComplete?: boolean;
}

export function FlightList({ 
  flights = [], 
  searchParams, 
  batchId, 
  onSelect, 
  onBack,
  isSearchComplete = false 
}: FlightListProps) {
  // Ensure flights is always an array
  const flightList = Array.isArray(flights) ? flights : [];
  
  // Only show "No Flights Found" if search is complete and we have no results
  if (isSearchComplete && flightList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <AlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Flights Found</h2>
        <p className="text-gray-600 mb-4">
          We couldn't find any flights matching your search criteria. Try adjusting your search parameters.
        </p>
        <button
          onClick={onBack}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Modify Search
        </button>
      </div>
    );
  }

  // If we have no flights but search is not complete, return null
  if (flightList.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {flightList.map((flight, index) => (
        <FlightCard
          key={`${flight.flights[0].flight_number}-${index}`}
          flight={flight}
          searchParams={searchParams}
          batchId={batchId}
          onSelect={() => onSelect(flight)}
        />
      ))}
    </div>
  );
}