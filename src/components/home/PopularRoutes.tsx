import React, { useState, useEffect } from 'react';
import { Plane, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface DisplayRoute {
  from_city: string;
  to_city: string;
  search_count: number;
}

export function PopularRoutes() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<DisplayRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      // 1. Merr të dhënat nga search_route_tracking (më të kërkuarat)
      const { data: routeData, error: routeError } = await supabase
        .from('search_route_tracking')
        .select('origin, destination, search_count')
        .order('search_count', { ascending: false });

      if (routeError) throw routeError;
      if (!routeData || routeData.length === 0) {
        setRoutes([]);
        return;
      }

      // 2. Merr aeroportet përkatëse nga tabela airports
      const iataCodes = Array.from(new Set([
        ...routeData.map(r => r.origin),
        ...routeData.map(r => r.destination)
      ]));

      const { data: airports, error: airportError } = await supabase
        .from('airports')
        .select('iata_code, city')
        .in('iata_code', iataCodes);

      if (airportError) throw airportError;

      const airportMap = new Map<string, string>();
      airports?.forEach(a => {
        airportMap.set(a.iata_code, a.city);
      });

      // 3. Eliminimi i duplikateve dhe mbajtja e rrugëve më të kërkuara
      const uniqueRoutes = new Map<string, DisplayRoute>();

      routeData.forEach(route => {
        const fromCity = airportMap.get(route.origin) || route.origin;
        const toCity = airportMap.get(route.destination) || route.destination;

        const key = `${fromCity}-${toCity}`;

        if (!uniqueRoutes.has(key) || uniqueRoutes.get(key)!.search_count < route.search_count) {
          uniqueRoutes.set(key, {
            from_city: fromCity,
            to_city: toCity,
            search_count: route.search_count
          });
        }
      });

      setRoutes(Array.from(uniqueRoutes.values()).slice(0, 6)); // Shfaq max 6 rrugë unike
    } catch (err) {
      console.error('Error fetching popular routes:', err);
      setError(err instanceof Error ? err.message : 'Error loading routes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Destinacionet më të kërkuara</h2>
          <p className="mt-2 text-base text-gray-600">
            Zbuloni destinacionet tona më të kërkuara.
          </p>
        </div>

        <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {routes.map((route, idx) => (
            <div
              key={idx}
              className="group bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors duration-200 w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <span>{route.from_city}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span>{route.to_city}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
