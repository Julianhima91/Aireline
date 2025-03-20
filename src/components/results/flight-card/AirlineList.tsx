import React from 'react';
import { Flight } from '../../../types/flight';

interface AirlineListProps {
  flights: Flight[];
}

export function AirlineList({ flights }: AirlineListProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {Array.from(new Set(flights.map(f => f.airline))).map((airline, idx) => (
        <div key={idx} className="flex items-center">
          <img 
            src={flights.find(f => f.airline === airline)?.airline_logo}
            alt={airline}
            className="h-6 w-6 object-contain mr-2"
          />
          <span className="text-gray-600 text-sm">{airline}</span>
        </div>
      ))}
    </div>
  );
}