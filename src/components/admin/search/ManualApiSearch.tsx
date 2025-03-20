import React, { useState } from 'react';
import { Search, Calendar, Plane, AlertTriangle, Loader2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { supabase } from '../../../lib/supabase';

interface SearchResult {
  yearMonth: string;
  priceGrid: Record<string, {
    price: number;
    isDirect: boolean;
  }>;
  lastUpdate: string;
  hasDirectFlight: boolean;
}

interface PriceGridDay {
  DirectOutboundAvailable: boolean;
  DirectOutbound?: {
    Price: number;
  };
  Direct?: {
    Price: number;
  };
  Indirect?: {
    Price: number;
  };
}

export function ManualApiSearch() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [success, setSuccess] = useState(false);

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = addMonths(now, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy')
      });
    }
    return options;
  };

  const handleSearch = async () => {
    if (!origin || !destination) {
      setError('Please enter both origin and destination airports');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSuccess(false);

    try {
      console.log('Fetching calendar prices for:', {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        yearMonth: selectedMonth
      });

      // Make direct API call to RapidAPI
      const response = await fetch(
        `https://sky-scanner3.p.rapidapi.com/flights/price-calendar-web?fromEntityId=${origin.toUpperCase()}&toEntityId=${destination.toUpperCase()}&yearMonth=${selectedMonth}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'sky-scanner3.p.rapidapi.com',
            'x-rapidapi-key': 'eff37b01a1msh6090de6dea39514p108435jsnf7c09e43a0a5'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.status || !data.data?.PriceGrids?.Grid) {
        throw new Error('Invalid API response format');
      }

      // Process the price grid data
      const priceGrid: Record<string, { price: number; isDirect: boolean }> = {};
      let hasDirectFlight = false;

      data.data.PriceGrids.Grid[0].forEach((dayData: PriceGridDay, index: number) => {
        if (!dayData) return;

        const day = (index + 1).toString().padStart(2, '0');
        const date = `${selectedMonth}-${day}`;

        // Check for direct flights first
        if (dayData.DirectOutboundAvailable === true && 
            dayData.DirectOutbound && 
            typeof dayData.DirectOutbound.Price === 'number' &&
            dayData.DirectOutbound.Price > 0) {
          hasDirectFlight = true;
          priceGrid[date] = {
            price: dayData.DirectOutbound.Price,
            isDirect: true
          };
        }
        // Check for indirect flights
        else if (dayData.Direct?.Price > 0) {
          priceGrid[date] = {
            price: dayData.Direct.Price,
            isDirect: false
          };
        }
        // Check for other indirect options
        else if (dayData.Indirect?.Price > 0) {
          priceGrid[date] = {
            price: dayData.Indirect.Price,
            isDirect: false
          };
        }
      });

      // Save to database
      const { error: saveError } = await supabase
        .from('calendar_prices')
        .upsert({
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          year_month: selectedMonth,
          price_grid: priceGrid,
          has_direct_flight: hasDirectFlight,
          last_update: new Date().toISOString()
        }, {
          onConflict: 'origin,destination,year_month'
        });

      if (saveError) throw saveError;

      setResult({
        yearMonth: selectedMonth,
        priceGrid,
        lastUpdate: new Date().toISOString(),
        hasDirectFlight
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Manual API Search</h2>
        <p className="text-sm text-gray-600 mt-1">
          Test flight price API integration and save results to the database
        </p>
      </div>

      <div className="p-6">
        {/* Search Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origin Airport
            </label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                placeholder="e.g., TIA"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination Airport
            </label>
            <div className="relative">
              <Plane className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                placeholder="e.g., FCO"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search Prices
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            Prices saved successfully!
          </div>
        )}

        {/* Results Table */}
        {result && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Search Results
              </h3>
            </div>

            {/* Direct Flight Status */}
            <div className={`mb-4 p-4 rounded-lg ${
              result.hasDirectFlight 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              <div className="font-medium">
                {result.hasDirectFlight 
                  ? '✈️ Direct flights available on this route'
                  : '🛑 No direct flights available'}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price (EUR)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direct Flight
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(result.priceGrid)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, data]) => (
                      <tr key={date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {data.price.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            data.isDirect 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {data.isDirect ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Last updated: {format(new Date(result.lastUpdate), 'dd MMM yyyy HH:mm:ss')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}