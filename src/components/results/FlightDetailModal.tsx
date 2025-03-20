import React, { useState } from 'react';
import { Plane, Clock, X, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { FlightOption } from '../../types/flight';
import { SearchParams } from '../../types/search';
import { formatDuration } from '../../utils/format';
import { PriceSection } from './flight-card/PriceSection';
import { StopsBadge } from './flight-card/StopsBadge';
import { formatFlightMessage } from '../../utils/formatFlightMessage';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  flightOption: FlightOption;
  searchParams: SearchParams;
}

export function FlightDetailModal({ isOpen, onClose, flightOption, searchParams }: ModalProps) {
  const [formattedMessage, setFormattedMessage] = useState<string | null>(null);
  const WHATSAPP_PHONE = '355695161381';

  // Format WhatsApp message when modal opens
  React.useEffect(() => {
    if (isOpen && flightOption) {
      formatFlightMessage(flightOption, searchParams, '')
        .then(message => setFormattedMessage(message))
        .catch(err => console.error('Error formatting message:', err));
    }
  }, [isOpen, flightOption, searchParams]);

  const handleContact = () => {
    if (formattedMessage) {
      window.open(`https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(formattedMessage)}`, '_blank');
    }
  };

  if (!isOpen) return null;

  // Ensure flights array exists and has items
  if (!flightOption?.flights?.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white w-full md:max-w-3xl md:w-full max-h-[90vh] rounded-t-xl md:rounded-xl p-8">
          <div className="text-center">
            <p className="text-gray-600">No flight details available</p>
          </div>
        </div>
      </div>
    );
  }

  const FlightSegment = ({ 
    flights, 
    layovers,
    title 
  }: { 
    flights: typeof flightOption.flights,
    layovers?: typeof flightOption.layovers,
    title: string 
  }) => {
    if (!flights?.length) return null;

    const stops = flights.length - 1;
    const totalDuration = flights.reduce((total, f) => total + f.duration, 0);

    return (
      <div className="mb-6 last:mb-0">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <StopsBadge stops={stops} />
        </div>

        {/* Flight Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {/* Date Header */}
          <div className="bg-gray-50 p-3 border-b border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">
                {new Date(flights[0].departure_airport.time).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Flight Info */}
          <div className="p-4">
            {/* Cities */}
            <div className="text-left mb-4">
              <div className="text-lg font-medium text-gray-900">
                {flights[0].departure_airport.name} - {flights[flights.length - 1].arrival_airport.name}
              </div>
            </div>

            {/* Duration */}
            {flights.map((flight, index) => (
              <React.Fragment key={index}>
                {/* Flight Details */}
                <div className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0">
                  {/* Airline Info */}
                  <div className="grid grid-cols-3 gap-2 md:gap-8">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Nisja</div>
                      <div className="text-xl font-bold">
                        {new Date(flight.departure_airport.time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.departure_airport.name} ({flight.departure_airport.id})
                      </div>
                    </div>
                    <div className="flex flex-col text-left items-start justify-start">
                      <div className="flex items-center justify-start gap-2 text-sm text-green-600">
                        <Clock className="w-4 h-4" />
                        {formatDuration(flight.duration)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Mberritja</div>
                      <div className="text-xl font-bold">
                        {new Date(flight.arrival_airport.time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.arrival_airport.name} ({flight.arrival_airport.id})
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <img 
                    src={flight.airline_logo} 
                    alt={flight.airline}
                    className="w-8 h-8 object-contain"
                  />
                  <div className="flex gap-3 items-center">
                    <div className="font-medium text-gray-900">{flight.airline}</div>
                    <div className="text-sm text-gray-600">Fluturimi {flight.flight_number}</div>
                  </div>
                </div>

                {/* Layover Information */}
                {layovers && index < flights.length - 1 && layovers[index] && (
                  <div className="my-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formatDuration(layovers[index].duration)} Ndalese ne {layovers[index].name}
                      </span>
                    </div>
                    {layovers[index].overnight && (
                      <div className="mt-1 text-sm text-amber-600">
                        ⚠️ Overnight layover
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full md:rounded-xl md:max-w-3xl md:w-full max-h-[90vh] overflow-y-auto rounded-t-xl">
        {/* Mobile-optimized Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 p-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Detajet e Fluturimit</h2>
              <p className="text-sm text-gray-600">
                {searchParams.fromLocation} → {searchParams.toLocation}
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Outbound Flight */}
          <FlightSegment 
            flights={flightOption.outbound_flights || []} 
            layovers={flightOption.outbound_layovers}
            title={searchParams.tripType === 'roundTrip' ? 'Fluturimi Vajtjes' : 'Flight'} 
          />

          {/* Return Flight */}
          {flightOption.return_flights && flightOption.return_flights.length > 0 && (
            <FlightSegment 
              flights={flightOption.return_flights} 
              layovers={flightOption.return_layovers}
              title="Fluturimi Kthimit"
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex flex-col gap-3">
            <PriceSection
              basePrice={flightOption.price_breakdown?.base_price}
              passengers={searchParams.passengers}
              totalPrice={flightOption.price}
            />
            <button
              onClick={handleContact}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors text-center"
            >
              Kontakto per Rezervim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}