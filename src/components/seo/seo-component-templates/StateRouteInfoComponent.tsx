import React, { useState, useEffect } from 'react';
import { Plane, Clock, CheckCircle, MapPin, Info, ArrowRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Location {
  type: string;
  city: string | null;
  state: string;
  nga_format: string | null;
  per_format: string | null;
}

interface Airport {
  iata_code: string;
  city: string;
  state: string;
  name: string;
}

interface RouteInfo {
  airlines: string[];
  hasDirectFlights: boolean;
  averageDuration: string;
  fromAirports: Airport[];
  toAirports: Airport[];
}

interface StateRouteInfoProps {
  fromLocation: Location;
  toLocation: Location;
  title?: string;
  className?: string;
}

export function StateRouteInfoComponent({
  fromLocation,
  toLocation,
  title,
  className = ''
}: StateRouteInfoProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    fetchRouteInfo();
  }, [fromLocation, toLocation]);

  const getReadyLocations = async (state: string): Promise<Set<string>> => {
    try {
      const { data, error } = await supabase
        .from('seo_location_formats')
        .select('city')
        .eq('state', state)
        .eq('type', 'city')
        .eq('status', 'ready');

      if (error) throw error;
      return new Set((data || []).map(d => d.city).filter(Boolean));
    } catch (err) {
      console.error('Error getting ready locations:', err);
      return new Set();
    }
  };

  const getAirportsForState = async (state: string): Promise<Airport[]> => {
    try {
      // Get list of ready cities first
      const readyCities = await getReadyLocations(state);
      
      // Get all airports in the state
      const { data: airports, error } = await supabase
        .from('airports')
        .select('iata_code, city, state, name')
        .eq('state', state);

      if (error) throw error;

      // Filter airports to only include those in ready cities
      return (airports || []).filter(airport => readyCities.has(airport.city));
    } catch (err) {
      console.error('Error getting airports for state:', err);
      return [];
    }
  };

  const fetchRouteInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get airports for both states
      const [fromAirports, toAirports] = await Promise.all([
        getAirportsForState(fromLocation.state),
        getAirportsForState(toLocation.state)
      ]);

      if (!fromAirports.length || !toAirports.length) {
        throw new Error('No airports found for the selected states');
      }

      // Get unique airlines and check for direct flights
      const airlines = new Set<string>();
      let hasDirectFlights = false;
      let totalDuration = 0;
      let routeCount = 0;

      // Check each possible route combination
      for (const fromAirport of fromAirports) {
        for (const toAirport of toAirports) {
          if (fromAirport.iata_code === toAirport.iata_code) continue;

          const { data: flights } = await supabase
            .from('processed_flight_prices')
            .select('airline, is_direct, duration')
            .eq('origin', fromAirport.iata_code)
            .eq('destination', toAirport.iata_code);

          if (flights?.length) {
            flights.forEach(flight => {
              airlines.add(flight.airline);
              if (flight.is_direct) hasDirectFlights = true;
              if (flight.duration) {
                totalDuration += flight.duration;
                routeCount++;
              }
            });
          }
        }
      }

      // Calculate average duration
      const averageDuration = routeCount > 0 
        ? `${Math.round(totalDuration / routeCount / 60)}h ${Math.round((totalDuration / routeCount) % 60)}m`
        : '2h 0m'; // Fallback average

      setRouteInfo({
        airlines: Array.from(airlines),
        hasDirectFlights,
        averageDuration,
        fromAirports,
        toAirports
      });

    } catch (err) {
      console.error('Error fetching route info:', err);
      setError(err instanceof Error ? err.message : 'Failed to load route information');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    const message = encodeURIComponent(
      `Pershendetje! Me intereson te di per fluturime nga ${fromLocation.state} ne ${toLocation.state}. Faleminderit!`
    );
    window.open(`https://api.whatsapp.com/send/?phone=355695161381&text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Duke ngarkuar informacionin...</p>
      </div>
    );
  }

  if (error || !routeInfo) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${className}`}>
        <p className="text-red-600">{error || 'Nuk u gjet informacion per kete rruge'}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <h3 className="text-xl font-semibold text-[#2D3748]">
          Informacion per fluturimet {title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Airlines Section */}
            <div>
              <h4 className="text-sm font-medium text-[#4A5568] mb-4">
                Kompanite Ajrore
              </h4>
              <div className="space-y-3">
                {routeInfo.airlines.map((airline, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-gray-50 p-4 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Plane className="w-5 h-5 text-[#3182CE] mr-3" />
                    <span className="text-[#2D3748] font-medium">{airline}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Airports Section */}
            <div>
              <h4 className="text-sm font-medium text-[#4A5568] mb-4">
                Aeroportet e Disponueshme
              </h4>
              <div className="space-y-6">
                {/* Origin Airports */}
                <div>
                  <div className="text-sm text-[#4A5568] mb-2">Nga {fromLocation.state}:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {routeInfo.fromAirports.map((airport) => (
                      <div key={airport.iata_code} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-[#2D3748]">{airport.city}</div>
                        <div className="text-sm text-[#4A5568]">{airport.iata_code}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Destination Airports */}
                <div>
                  <div className="text-sm text-[#4A5568] mb-2">Ne {toLocation.state}:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {routeInfo.toAirports.map((airport) => (
                      <div key={airport.iata_code} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-[#2D3748]">{airport.city}</div>
                        <div className="text-sm text-[#4A5568]">{airport.iata_code}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Booking Guidance Section */}
            <div>
              <h4 className="text-sm font-medium text-[#4A5568] mb-4">
                Rezervoni me Specialistet Tane
              </h4>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-[#2D3748] mb-2">
                      Pse te rezervoni me ne?
                    </h5>
                    <ul className="space-y-3">
                      <li className="flex items-center text-[#4A5568]">
                        <span className="w-1.5 h-1.5 bg-[#3182CE] rounded-full mr-3" />
                        Çmime ekskluzive dhe oferta speciale
                      </li>
                      <li className="flex items-center text-[#4A5568]">
                        <span className="w-1.5 h-1.5 bg-[#3182CE] rounded-full mr-3" />
                        Asistence 24/7 gjate gjithe udhetimit
                      </li>
                      <li className="flex items-center text-[#4A5568]">
                        <span className="w-1.5 h-1.5 bg-[#3182CE] rounded-full mr-3" />
                        Eksperience 15+ vjeçare ne treg
                      </li>
                      <li className="flex items-center text-[#4A5568]">
                        <span className="w-1.5 h-1.5 bg-[#3182CE] rounded-full mr-3" />
                        Garanci cmimi me te mire
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Box */}
            <div className="mt-8 bg-green-50 rounded-xl p-6 border border-green-200">
              <h4 className="font-medium text-[#2D3748] mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-green-600" />
                Kontaktoni Tani
              </h4>
              <div className="space-y-4">
                <p className="text-green-800">
                  Specialistet tane jane gati t'ju ndihmojne me:
                </p>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Keshillim per datat me te pershtatshme
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Informacion per bagazhet
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Zgjidhje alternative udhetimi
                  </li>
                </ul>
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleContact}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Kontakto ne WhatsApp</span>
                  </button>
                  <a
                    href="tel:+355695161381"
                    className="w-full py-3 bg-white text-green-700 border border-green-300 rounded-lg font-medium hover:bg-green-50 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <span>+355 69 516 1381</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Flight Details Summary */}
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h4 className="font-medium text-[#2D3748] mb-4">
                Detaje te Fluturimit
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center text-[#4A5568]">
                  <Clock className="w-4 h-4 text-[#3182CE] mr-2" />
                  Kohezgjatja mesatare: {routeInfo.averageDuration}
                </li>
                <li className="flex items-center text-[#4A5568]">
                  <Plane className="w-4 h-4 text-[#3182CE] mr-2" />
                  {routeInfo.airlines.length} kompani ajrore
                </li>
                <li className="flex items-center text-[#4A5568]">
                  <MapPin className="w-4 h-4 text-[#3182CE] mr-2" />
                  {routeInfo.fromAirports.length + routeInfo.toAirports.length} aeroporte
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}