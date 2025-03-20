import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../../lib/supabase';

interface UpdateFrequency {
  id: string;
  origin: string;
  destination: string;
  year_month: string;
  update_interval: number;
  is_ignored: boolean;
  search_count: number;
  last_price_update: string | null;
  demand_level: 'HIGH' | 'MEDIUM' | 'LOW';
}

const UPDATE_INTERVALS = [
  { value: 3, label: 'Every 3 hours' },
  { value: 6, label: 'Every 6 hours' },
  { value: 12, label: 'Every 12 hours' },
  { value: 24, label: 'Every 24 hours' }
];

export function UpdateFrequencySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [routes, setRoutes] = useState<UpdateFrequency[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    fetchRouteSettings();
  }, [selectedMonth]);

  const fetchRouteSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('route_demand_tracking')
        .select('*')
        .eq('year_month', selectedMonth)
        .order('search_count', { ascending: false });

      if (fetchError) throw fetchError;
      setRoutes(data || []);
    } catch (err) {
      console.error('Error fetching route settings:', err);
      setError('Failed to load update frequency settings');
    } finally {
      setLoading(false);
    }
  };

  const handleIntervalChange = async (routeId: string, hours: number) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: updateError } = await supabase
        .from('route_demand_tracking')
        .update({ update_interval: hours })
        .eq('id', routeId);

      if (updateError) throw updateError;

      setRoutes(routes.map(route => 
        route.id === routeId 
          ? { ...route, update_interval: hours }
          : route
      ));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating interval:', err);
      setError('Failed to update interval');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleIgnore = async (routeId: string, ignored: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const { error: updateError } = await supabase
        .from('route_demand_tracking')
        .update({ is_ignored: ignored })
        .eq('id', routeId);

      if (updateError) throw updateError;

      setRoutes(routes.map(route => 
        route.id === routeId 
          ? { ...route, is_ignored: ignored }
          : route
      ));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating ignore status:', err);
      setError('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const filteredRoutes = routes.filter(route => {
    const searchLower = searchTerm.toLowerCase();
    return route.origin.toLowerCase().includes(searchLower) ||
           route.destination.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Update Frequency Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure how often flight prices should be refreshed for each route
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            Settings updated successfully!
          </div>
        )}

        {/* Search and Month Selection */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search routes by airport code..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Routes Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demand Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Update Interval
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="font-medium">{route.origin}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{route.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {route.search_count} searches
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      route.demand_level === 'HIGH' ? 'bg-green-100 text-green-800' :
                      route.demand_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {route.demand_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={route.update_interval}
                      onChange={(e) => handleIntervalChange(route.id, parseInt(e.target.value))}
                      disabled={route.is_ignored || saving}
                      className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      {UPDATE_INTERVALS.map(interval => (
                        <option key={interval.value} value={interval.value}>
                          {interval.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!route.is_ignored}
                          onChange={(e) => handleToggleIgnore(route.id, !e.target.checked)}
                          disabled={saving}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {route.is_ignored ? 'Disabled' : 'Active'}
                        </span>
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.last_price_update ? (
                      format(new Date(route.last_price_update), 'dd MMM HH:mm')
                    ) : (
                      'Never'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRoutes.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No routes found</p>
          </div>
        )}
      </div>
    </div>
  );
}