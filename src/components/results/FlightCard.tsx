import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { FlightOption } from '../../types/flight';
import { SearchParams } from '../../types/search';
import { formatDuration } from '../../utils/format';
import { WhatsAppButton } from '../common/WhatsAppButton';
import { CopyButton } from '../common/CopyButton';
import { StopsBadge } from './flight-card/StopsBadge';
import { TimeDisplay } from './flight-card/TimeDisplay';
import { PriceSection } from './flight-card/PriceSection';

interface FlightCardProps {
  flight: FlightOption;
  searchParams: SearchParams;
  batchId: string;
  onSelect: () => void;
}

export function FlightCard({ flight, searchParams, batchId, onSelect }: FlightCardProps) {
  const isRoundTrip = searchParams.tripType === 'roundTrip';

  const renderFlightSegment = (flights: typeof flight.flights, layovers?: typeof flight.layovers, isReturn = false) => {
    if (!flights?.length) return null;

    const firstFlight = flights[0];
    const lastFlight = flights[flights.length - 1];
    const stops = flights.length - 1;

    // Calculate total duration for this segment
    const segmentDuration = flights.reduce((total, f) => total + f.duration, 0);

    // Add layover durations to total duration
    const totalDuration = segmentDuration + (layovers?.reduce((total, layover) => total + layover.duration, 0) || 0);

    // Check if arrival is next day
    const departureDate = new Date(firstFlight.departure_airport.time);
    const arrivalDate = new Date(lastFlight.arrival_airport.time);
    const isNextDay = arrivalDate.getDate() > departureDate.getDate();

    return (
      <div className={`flex flex-col ${isReturn ? 'mt-4 pt-4 border-t border-gray-100' : ''}`}>
        {isReturn && (
          <div className="text-sm font-medium text-blue-600 mb-2">Return Flight</div>
        )}
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0 w-12">
            <img 
              src={firstFlight.airline_logo} 
              alt={firstFlight.airline}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <TimeDisplay 
                time={firstFlight.departure_airport.time}
              />
              <div className="text-sm text-gray-600">{firstFlight.departure_airport.id}</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(totalDuration)}
              </div>
              <StopsBadge 
                stops={stops} 
                isRoundTrip={isRoundTrip && !isReturn && !flight.return_flights}
              />
            </div>
            <div className="text-right">
              <TimeDisplay 
                time={lastFlight.arrival_airport.time}
                showNextDay={isNextDay}
                isArrival
              />
              <div className="text-sm text-gray-600">{lastFlight.arrival_airport.id}</div>
            </div>
          </div>
        </div>

        {/* Layover Information */}
        {layovers && layovers.length > 0 && (
          <div className="mt-2 space-y-2">
            {layovers.map((layover, idx) => (
              <div key={idx} className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  {formatDuration(layover.duration)} Ndalese ne {layover.name}
                  {layover.overnight && ' (overnight)'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          {Array.from(new Set(flights.map(f => f.airline))).map((airline, idx) => (
            <div key={idx} className="inline-flex items-center px-2 py-1 bg-gray-50 rounded-md text-sm text-gray-600">
              {airline}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      onClick={onSelect}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden"
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Flight Details */}
          <div className="flex-1">
            {/* Outbound Flight */}
            {renderFlightSegment(flight.outbound_flights || [], flight.outbound_layovers)}
            
            {/* Return Flight */}
            {flight.return_flights && flight.return_flights.length > 0 && 
              renderFlightSegment(flight.return_flights, flight.return_layovers, true)
            }
          </div>

          {/* Price and Action */}
          <div className="lg:w-64 flex flex-col items-center gap-4 lg:border-l lg:border-gray-100 lg:pl-6">
            <PriceSection
              basePrice={flight.price_breakdown?.base_price}
              passengers={searchParams.passengers}
              totalPrice={flight.price}
            />
            <WhatsAppButton
              flight={flight}
              searchParams={searchParams}
              batchId={batchId}
              className="whatsapp-button w-full"
            />
            <CopyButton
              flight={flight}
              searchParams={searchParams}
              batchId={batchId}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Route Summary */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <div className="flex items-center text-sm text-gray-600">
          <span>{searchParams.fromCode}</span>
          <ArrowRight className="w-4 h-4 mx-2" />
          <span>{searchParams.toCode}</span>
          {searchParams.tripType === 'roundTrip' && (
            <>
              <ArrowRight className="w-4 h-4 mx-2 rotate-180" />
              <span>{searchParams.fromCode}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}