import React, { useState, useEffect } from 'react';
import { Calendar, Plane, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
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
}

interface Price {
  airline: string;
  flight_date: string;
  total_price: number;
  fromCity: string;
  toCity: string;
  iataFrom: string;
  iataTo: string;
}

interface StateCityPricingProps {
  fromLocation: Location;
  toLocation: Location;
  title?: string;
  className?: string;
}

export function StateCityPricingComponent({
  fromLocation,
  toLocation,
  title,
  className = ''
}: StateCityPricingProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);

  useEffect(() => {
    fetchPrices();
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

  const getAirportsForLocation = async (location: Location): Promise<Airport[]> => {
    try {
      console.log(`Getting airports for location:`, location);

      if (location.type === 'city') {
        // For city-type locations, get specific airport(s)
        const { data: airports, error } = await supabase
          .from('airports')
          .select('iata_code, city, state')
          .eq('city', location.city)
          .eq('state', location.state);

        if (error) throw error;
        
        console.log(`Found ${airports?.length || 0} airports for city ${location.city}`);
        return airports || [];
      } else {
        // For state-type locations:
        // 1. Get list of ready cities from seo_location_formats
        const readyCities = await getReadyLocations(location.state);
        
        // 2. Get all airports in the state
        const { data: airports, error } = await supabase
          .from('airports')
          .select('iata_code, city, state')
          .eq('state', location.state);

        if (error) throw error;

        // 3. Filter airports to only include those in ready cities
        const filteredAirports = (airports || []).filter(airport => 
          readyCities.has(airport.city)
        );

        console.log(`Found ${filteredAirports.length} airports in ready cities for state ${location.state}`);
        return filteredAirports;
      }
    } catch (err) {
      console.error('Error getting airports:', err);
      throw new Error(`Failed to get airports for ${location.type === 'city' ? location.city : location.state}`);
    }
  };

  const getBestPrice = async (fromIata: string, toIata: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('processed_flight_prices')
        .select('airline, flight_date, total_price')
        .eq('origin', fromIata)
        .eq('destination', toIata)
        .order('total_price', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`Error getting price for ${fromIata}-${toIata}:`, err);
      return null;
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching prices for route:', {
        from: `${fromLocation.type}: ${fromLocation.city || fromLocation.state}`,
        to: `${toLocation.type}: ${toLocation.city || toLocation.state}`
      });

      // Get airports for both locations
      const [fromAirports, toAirports] = await Promise.all([
        getAirportsForLocation(fromLocation),
        getAirportsForLocation(toLocation)
      ]);

      if (!fromAirports.length || !toAirports.length) {
        throw new Error('No valid airports found for this route');
      }

      console.log('Retrieved airports:', {
        from: fromAirports.map(a => `${a.city} (${a.iata_code})`),
        to: toAirports.map(a => `${a.city} (${a.iata_code})`)
      });

      const allPrices: Price[] = [];

      // Generate all possible route combinations
      for (const fromAirport of fromAirports) {
        for (const toAirport of toAirports) {
          // Skip if same airport
          if (fromAirport.iata_code === toAirport.iata_code) continue;

          const bestPrice = await getBestPrice(fromAirport.iata_code, toAirport.iata_code);
          
          if (bestPrice) {
            allPrices.push({
              airline: bestPrice.airline,
              flight_date: bestPrice.flight_date,
              total_price: bestPrice.total_price,
              fromCity: fromAirport.city,
              toCity: toAirport.city,
              iataFrom: fromAirport.iata_code,
              iataTo: toAirport.iata_code
            });
          }
        }
      }

      // Sort by price and limit to top 10
      const sortedPrices = allPrices
        .sort((a, b) => a.total_price - b.total_price)
        .slice(0, 10);

      console.log(`Found ${sortedPrices.length} routes with prices`);
      setPrices(sortedPrices);

    } catch (err) {
      console.error('Error fetching prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Ensure the date string is valid ISO format
      const date = parseISO(dateString);
      if (!isValid(date)) {
        console.warn('Invalid date:', dateString);
        return 'Date unavailable';
      }
      return format(date, 'dd MMM yyyy');
    } catch (err) {
      console.error('Error formatting date:', err, 'Date string:', dateString);
      return 'Date unavailable';
    }
  };

  const generateWhatsAppMessage = (price: Price) => {
    try {
      const message = [
        'Pershendetje, Me intereson te di per bileta avioni',
        '',
        `${price.fromCity} - ${price.toCity}`,
        `Data: ${formatDate(price.flight_date)}`,
        `Cmimi: ${price.total_price}€`,
      ].join('\n');

      return encodeURIComponent(message);
    } catch (err) {
      console.error('Error generating message:', err);
      return encodeURIComponent('Pershendetje, Me intereson te di per bileta avioni');
    }
  };

  const handleBooking = (price: Price) => {
    const message = generateWhatsAppMessage(price);
    window.open(`https://api.whatsapp.com/send/?phone=355695161381&text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${className}`}>
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Duke ngarkuar çmimet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">Nuk u gjeten çmime per kete rruge. Ju lutem beni kerkimin me siper...</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <h3 className="text-xl font-semibold text-[#2D3748]">
          Bileta avioni te lira {title}
        </h3>
        <p className="text-[#4A5568] mt-2">
          Çmimet online dhe disponueshmeria mund të ndryshojne
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-8 py-4 text-left text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Linjat
              </th>
              <th className="px-8 py-4 text-left text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Kompanite
              </th>
              <th className="px-8 py-4 text-left text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Data
              </th>
              <th className="px-8 py-4 text-left text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Cmimi
              </th>
              <th className="px-8 py-4 text-right text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Kontakto
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {prices.map((price, index) => (
              <tr key={`${price.iataFrom}-${price.iataTo}-${index}`} className="group hover:bg-blue-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <Plane className="w-5 h-5 text-[#3182CE] mr-3" />
                    <div>
                      <span className="text-[#2D3748] font-medium">{price.fromCity}</span>
                      <ArrowRight className="w-4 h-4 mx-2 inline text-gray-400" />
                      <span className="text-[#2D3748] font-medium">{price.toCity}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[#4A5568]">{price.airline}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center text-[#4A5568]">
                    <Calendar className="w-4 h-4 mr-2 text-[#4A5568]" />
                    {formatDate(price.flight_date)}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-lg font-semibold text-[#2D3748]">
                    {price.total_price}€
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    onClick={() => handleBooking(price)}
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium group-hover:shadow-md"
                  >
                    Kontakto Tani
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-100">
        {prices.map((price, index) => (
          <div key={`${price.iataFrom}-${price.iataTo}-${index}`} className="p-6 hover:bg-blue-50/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Plane className="w-5 h-5 text-[#3182CE] mr-2" />
                <div>
                  <div className="font-medium text-[#2D3748]">
                    {price.fromCity}
                    <ArrowRight className="w-4 h-4 mx-2 inline text-gray-400" />
                    {price.toCity}
                  </div>
                  <div className="text-[#4A5568] text-sm mt-1">
                    {price.airline}
                  </div>
                </div>
              </div>
              <span className="text-xl font-bold text-[#3182CE]">
                {price.total_price}€
              </span>
            </div>
            <div className="flex items-center text-[#4A5568] text-sm mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(price.flight_date)}
            </div>
            <button
              onClick={() => handleBooking(price)}
              className="w-full py-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
            >
              Kontakto Tani
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
