import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plane, Calendar, Search, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface RouteStats {
  id: string;
  origin: string;
  destination: string;
  month: string;
  departure_date: string;
  return_date: string | null;
  search_count: number;
  last_search_at: string;
  top_dates: Array<{
    date: string;
    count: number;
  }>;
}

export function RoutePopularity() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<RouteStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

  useEffect(() => {
    fetchRouteStats();
  }, [selectedMonth]);

  const fetchRouteStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('search_route_tracking')
        .select('*')
        .eq('month', selectedMonth)
        .order('search_count', { ascending: false });

      if (fetchError) throw fetchError;

      // Process and group the data
      const processedRoutes = processRouteData(data || []);
      setRoutes(processedRoutes);
    } catch (err) {
      console.error('Error fetching route stats:', err);
      setError('Failed to load route statistics');
    } finally {
      setLoading(false);
    }
  };

  const processRouteData = (data: any[]): RouteStats[] => {
    // Group by origin-destination pair
    const routeGroups = data.reduce((acc, curr) => {
      const key = `${curr.origin}-${curr.destination}`;
      if (!acc[key]) {
        acc[key] = {
          ...curr,
          top_dates: [{
            date: curr.departure_date,
            count: curr.search_count
          }]
        };
      } else {
        acc[key].search_count += curr.search_count;
        acc[key].top_dates.push({
          date: curr.departure_date,
          count: curr.search_count
        });
        // Keep the most recent last_search_at
        if (new Date(curr.last_search_at) > new Date(acc[key].last_search_at)) {
          acc[key].last_search_at = curr.last_search_at;
        }
      }
      return acc;
    }, {} as Record<string, RouteStats>);

    // Convert to array and sort top dates
    return Object.values(routeGroups).map(route => ({
      ...route,
      top_dates: route.top_dates
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    }));
  };

  const filteredRoutes = routes.filter(route => {
    const searchLower = searchTerm.toLowerCase();
    return route.origin.toLowerCase().includes(searchLower) ||
           route.destination.toLowerCase().includes(searchLower);
  });

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    return options;
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Route Popularity</h2>
        <p className="text-sm text-gray-600 mt-1">
          Track the most searched flight routes and popular travel dates
        </p>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Routes
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by airport code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getMonthOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {filteredRoutes.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No routes found for the selected criteria</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Route Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-lg font-medium">
                      <Plane className="w-5 h-5 text-blue-600" />
                      <span>{route.origin}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span>{route.destination}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {route.top_dates.map((date, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center px-2 py-1 bg-white rounded-md text-sm"
                        >
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          {format(new Date(date.date), 'dd MMM')}
                          <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {date.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 md:gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {route.search_count}
                      </div>
                      <div className="text-sm text-gray-500">Total Searches</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Last Search
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(route.last_search_at), 'dd MMM HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}