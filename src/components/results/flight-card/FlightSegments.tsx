import React from 'react';
import { Clock, Plane } from 'lucide-react';
import { Flight } from '../../../types/flight';
import { formatDuration } from '../../../utils/format';
import { getStopCount } from '../../../utils/flightSegments';

interface FlightSegmentsProps {
  flights: Flight[];
  totalDuration: number;
  isReturn?: boolean;
  label?: string;
}

export function FlightSegments({ flights, totalDuration, isReturn = false, label }: FlightSegmentsProps) {
  if (!flights || flights.length === 0) return null;

  const stopCount = getStopCount(flights);

  return (
    <div>
      {label && (
        <div className="text-sm font-medium text-gray-500 mb-2">{label}</div>
      )}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        {/* Departure */}
        <div className="text-center md:text-left">
          <p className="text-2xl font-bold">
            {new Date(flights[0].departure_airport.time).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </p>
          <p className="text-gray-600">{flights[0].departure_airport.id}</p>
        </div>

        {/* Flight duration */}
        <div className="flex flex-col items-center flex-1">
          <div className="text-gray-500 text-sm flex items-center">
            <Clock size={16} className="mr-1" />
            {formatDuration(totalDuration)}
          </div>
          <div className="relative w-full max-w-[200px]">
            <div className="border-t-2 border-gray-300 absolute w-full top-1/2"></div>
            <Plane 
              className={`text-blue-600 absolute -right-2 -top-2 transform ${isReturn ? 'rotate-180' : ''}`} 
              size={20} 
            />
          </div>
          <div className="text-sm text-gray-500">
            {stopCount === 0 ? (
              'Direct flight'
            ) : (
              `${stopCount} stop${stopCount !== 1 ? 's' : ''}`
            )}
          </div>
        </div>

        {/* Arrival */}
        <div className="text-center md:text-right">
          <p className="text-2xl font-bold">
            {new Date(flights[flights.length - 1].arrival_airport.time).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </p>
          <p className="text-gray-600">{flights[flights.length - 1].arrival_airport.id}</p>
        </div>
      </div>
    </div>
  );
}