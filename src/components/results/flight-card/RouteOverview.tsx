import React from 'react';
import { Flight } from '../../../types/flight';

interface RouteOverviewProps {
  flights: Flight[];
  isReturn?: boolean;
}

export function RouteOverview({ flights, isReturn = false }: RouteOverviewProps) {
  if (!flights || flights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {isReturn && <span className="text-blue-600 font-medium">Return: </span>}
      {flights.map((segment, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-gray-400">→</span>}
          <span className="text-gray-600">{segment.departure_airport.id}</span>
        </React.Fragment>
      ))}
      <span className="text-gray-400">→</span>
      <span className="text-gray-600">
        {flights[flights.length - 1].arrival_airport.id}
      </span>
    </div>
  );
}