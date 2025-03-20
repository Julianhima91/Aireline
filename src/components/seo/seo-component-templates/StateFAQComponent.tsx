import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Location {
  type: string;
  city: string | null;
  state: string;
  nga_format: string | null;
  per_format: string | null;
}

interface FAQ {
  question: string;
  answer: string;
}

interface StateFAQProps {
  fromLocation: Location;
  toLocation: Location;
  title?: string;
  className?: string;
}

export function StateFAQComponent({ 
  fromLocation, 
  toLocation, 
  title,
  className = '' 
}: StateFAQProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [routeStats, setRouteStats] = useState<{
    minPrice: number;
    maxPrice: number;
    avgDuration: string;
    airlines: string[];
    directFlights: boolean;
    popularCities: { from: string[]; to: string[] };
  } | null>(null);

  useEffect(() => {
    fetchRouteStats();
  }, [fromLocation, toLocation]);

  const fetchRouteStats = async () => {
    try {
      // Get ready cities for both states
      const [fromCities, toCities] = await Promise.all([
        getReadyCities(fromLocation.state),
        getReadyCities(toLocation.state)
      ]);

      // Get all airports for ready cities
      const [fromAirports, toAirports] = await Promise.all([
        getStateAirports(fromLocation.state, fromCities),
        getStateAirports(toLocation.state, toCities)
      ]);

      // Get price statistics for all routes between these airports
      const stats = await getRouteStatistics(fromAirports, toAirports);

      setRouteStats(stats);
    } catch (err) {
      console.error('Error fetching route stats:', err);
    }
  };

  const getReadyCities = async (state: string): Promise<string[]> => {
    const { data } = await supabase
      .from('seo_location_formats')
      .select('city')
      .eq('state', state)
      .eq('type', 'city')
      .eq('status', 'ready');

    return (data || []).map(d => d.city).filter(Boolean);
  };

  const getStateAirports = async (state: string, cities: string[]) => {
    const { data } = await supabase
      .from('airports')
      .select('iata_code, city')
      .eq('state', state)
      .in('city', cities);

    return data || [];
  };

  const getRouteStatistics = async (fromAirports: any[], toAirports: any[]) => {
    let minPrice = Infinity;
    let maxPrice = 0;
    let totalDuration = 0;
    let routeCount = 0;
    const airlines = new Set<string>();
    let hasDirectFlights = false;
    const popularFromCities = new Map<string, number>();
    const popularToCities = new Map<string, number>();

    for (const fromAirport of fromAirports) {
      for (const toAirport of toAirports) {
        const { data: flights } = await supabase
          .from('processed_flight_prices')
          .select('total_price, duration, airline, is_direct')
          .eq('origin', fromAirport.iata_code)
          .eq('destination', toAirport.iata_code);

        if (flights?.length) {
          flights.forEach(flight => {
            minPrice = Math.min(minPrice, flight.total_price);
            maxPrice = Math.max(maxPrice, flight.total_price);
            if (flight.duration) {
              totalDuration += flight.duration;
              routeCount++;
            }
            if (flight.airline) airlines.add(flight.airline);
            if (flight.is_direct) hasDirectFlights = true;

            // Track popular cities
            popularFromCities.set(fromAirport.city, (popularFromCities.get(fromAirport.city) || 0) + 1);
            popularToCities.set(toAirport.city, (popularToCities.get(toAirport.city) || 0) + 1);
          });
        }
      }
    }

    // Get top 3 most popular cities
    const getTopCities = (cityMap: Map<string, number>) => 
      Array.from(cityMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([city]) => city);

    return {
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === 0 ? 0 : maxPrice,
      avgDuration: routeCount > 0 ? `${Math.round(totalDuration / routeCount / 60)}h ${Math.round((totalDuration / routeCount) % 60)}m` : '2h 0m',
      airlines: Array.from(airlines),
      directFlights: hasDirectFlights,
      popularCities: {
        from: getTopCities(popularFromCities),
        to: getTopCities(popularToCities)
      }
    };
  };

  const generateFAQs = (): FAQ[] => {
    if (!routeStats) return [];

    const faqs: FAQ[] = [
      {
        question: `Sa kushton nje bilete avioni ${title} ?`,
        answer: routeStats.minPrice > 0 
          ? `Çmimet per fluturime nga ${title} fillojne nga ${routeStats.minPrice}€ dhe mund te arrijne deri ne ${routeStats.maxPrice}€, ne varesi te sezonit dhe disponueshmerise. Qytetet me te kerkuara per nisje jane ${routeStats.popularCities.from.join(', ')}, ndersa destinacionet kryesore jane ${routeStats.popularCities.to.join(', ')}.`
          : `Çmimet ndryshojne ne varesi te sezonit dhe disponueshmerise. Kontaktoni me stafin tone per çmimet aktuale.`
      },
      {
        question: `Cilat jane qytetet kryesore per fluturime ${title}?`,
        answer: `Nga ${fromLocation.state}, fluturimet me te shpeshta nisen nga qytetet ${routeStats.popularCities.from.join(', ')}. Ne ${toLocation.state}, destinacionet kryesore jane ${routeStats.popularCities.to.join(', ')}. Secili qytet ofron opsione te ndryshme per udhetaret.`
      },
      {
        question: `Sa zgjat fluturimi nga ${title}?`,
        answer: `Kohezgjatja mesatare e fluturimit eshte rreth ${routeStats.avgDuration}. ${
          routeStats.directFlights 
            ? 'Ka fluturime direkte te disponueshme ne disa rute.' 
            : 'Shumica e fluturimeve kane nje ose me shume ndalesa.'
        }`
      },
      {
        question: `Cilat kompani ajrore operojne fluturime midis ${title}?`,
        answer: routeStats.airlines.length > 0
          ? `Kompanite kryesore qe operojne ne kete rruge jane ${routeStats.airlines.join(', ')}. Secila kompani ofron sherbime dhe çmime te ndryshme.`
          : `Disa nga kompanite kryesore ajrore operojne fluturime midis ketyre destinacioneve. Kontaktoni me stafin tone per informacion te detajuar.`
      },
      {
        question: 'Kur duhet te rezervoj bileten time?',
        answer: 'Rekomandohet te rezervoni bileten tuaj te pakten 2-3 muaj perpara per te gjetur çmimet me te mira. Gjate sezonit te larte (vere dhe festa), eshte mire te rezervoni edhe me heret.'
      },
      {
        question: 'A mund te rezervoj bileta per grup?',
        answer: 'Po, ofrojme rezervime per grupe te çdo madhesie. Per grupet mbi 5 persona, mund te perfitoni nga çmimet tona speciale. Kontaktoni direkt me stafin tone per nje oferte te personalizuar.'
      }
    ];

    return faqs;
  };

  const handleContact = () => {
    const message = encodeURIComponent(
      `Pershendetje! Me intereson te di per fluturime ${title}. Faleminderit!`
    );
    window.open(`https://api.whatsapp.com/send/?phone=355695161381&text=${message}`, '_blank');
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <h3 className="text-xl font-semibold text-[#2D3748]">
          Pyetjet me te shpeshta per fluturimet {title}
        </h3>
        <p className="text-[#4A5568] mt-2">
          Gjeni pergjigjet per pyetjet tuaja me te shpeshta
        </p>
      </div>

      {/* FAQ List */}
      <div className="divide-y divide-gray-100">
        {generateFAQs().map((faq, index) => (
          <div key={index} className="group">
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              className="w-full px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center pr-4">
                <div className="p-2 bg-blue-50 rounded-lg mr-4 group-hover:bg-blue-100 transition-colors">
                  <HelpCircle className="w-5 h-5 text-[#3182CE]" />
                </div>
                <span className="text-left font-medium text-[#2D3748] group-hover:text-[#1A365D]">
                  {faq.question}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-[#4A5568] transform transition-transform duration-300 ${
                  expandedIndex === index ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Answer Panel */}
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${expandedIndex === index ? 'max-h-96' : 'max-h-0'}
              `}
            >
              <div className="px-8 py-6 bg-gray-50">
                <div className="pl-11 text-[#4A5568] leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-blue-100/50 mt-4">
        <p className="text-[#2D3748]">
          Nuk gjeni pergjigjen qe kerkoni?{' '}
          <button 
            onClick={handleContact}
            className="font-medium text-[#3182CE] hover:text-[#2C5282] underline decoration-2 decoration-blue-200 hover:decoration-blue-400 transition-all"
          >
            Na kontaktoni
          </button>
        </p>
      </div>
    </div>
  );
}