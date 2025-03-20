import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, BarChart } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ApiStats {
  rapidapi: {
    total_requests: number;
    avg_response_time: number;
    error_rate: number;
  };
  flightapi: {
    total_requests: number;
    avg_response_time: number;
    error_rate: number;
  };
}

interface ApiConfig {
  active_api: 'rapidapi' | 'flightapi' | 'both';
  simultaneous_requests: boolean;
  oneway_api: 'rapidapi' | 'flightapi' | 'both';
  roundtrip_api: 'rapidapi' | 'flightapi' | 'both';
  rapidapi_key: string;
  flightapi_key: string;
}

export function FlightApiConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<ApiConfig>({
    active_api: 'rapidapi',
    simultaneous_requests: false,
    oneway_api: 'rapidapi',
    roundtrip_api: 'rapidapi',
    rapidapi_key: '',
    flightapi_key: ''
  });
  const [stats, setStats] = useState<ApiStats | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('flight_api_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setConfig(data);
    } catch (err) {
      console.error('Error fetching API config:', err);
      setError('Failed to load API configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('flight_api_stats')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) setStats(data);
    } catch (err) {
      console.error('Error fetching API stats:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Get existing config first
      const { data: existingConfig } = await supabase
        .from('flight_api_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      let saveError;
      if (existingConfig?.id) {
        // Update existing config
        const { error } = await supabase
          .from('flight_api_config')
          .update(config)
          .eq('id', existingConfig.id);
        saveError = error;
      } else {
        // Insert new config
        const { error } = await supabase
          .from('flight_api_config')
          .insert([config]);
        saveError = error;
      }

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving API config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Flight API Configuration</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure and monitor flight search API integrations
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            Configuration saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* API Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Flight Search API
            </label>
            <select
              value={config.active_api}
              onChange={(e) => setConfig({ ...config, active_api: e.target.value as ApiConfig['active_api'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rapidapi">RapidAPI Only</option>
              <option value="flightapi">FlightAPI.io Only</option>
              <option value="both">Both APIs</option>
            </select>
          </div>

          {/* Simultaneous Requests */}
          {config.active_api === 'both' && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.simultaneous_requests}
                  onChange={(e) => setConfig({ ...config, simultaneous_requests: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Enable simultaneous API requests</span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                When enabled, requests will be sent to both APIs simultaneously
              </p>
            </div>
          )}

          {/* One-Way Search API */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              One-Way Search API
            </label>
            <select
              value={config.oneway_api}
              onChange={(e) => setConfig({ ...config, oneway_api: e.target.value as ApiConfig['oneway_api'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rapidapi">RapidAPI</option>
              <option value="flightapi">FlightAPI.io</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Round-Trip Search API */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Round-Trip Search API
            </label>
            <select
              value={config.roundtrip_api}
              onChange={(e) => setConfig({ ...config, roundtrip_api: e.target.value as ApiConfig['roundtrip_api'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rapidapi">RapidAPI</option>
              <option value="flightapi">FlightAPI.io</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* API Keys */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RapidAPI Key
              </label>
              <input
                type="password"
                value={config.rapidapi_key}
                onChange={(e) => setConfig({ ...config, rapidapi_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FlightAPI.io Key
              </label>
              <input
                type="password"
                value={config.flightapi_key}
                onChange={(e) => setConfig({ ...config, flightapi_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* API Statistics */}
          {stats && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-blue-600" />
                API Usage Statistics
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* RapidAPI Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">RapidAPI</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Requests:</span>
                      <span className="font-medium">{stats.rapidapi.total_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Response Time:</span>
                      <span className="font-medium">{stats.rapidapi.avg_response_time}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Error Rate:</span>
                      <span className="font-medium">{stats.rapidapi.error_rate}%</span>
                    </div>
                  </div>
                </div>

                {/* FlightAPI.io Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">FlightAPI.io</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Requests:</span>
                      <span className="font-medium">{stats.flightapi.total_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Response Time:</span>
                      <span className="font-medium">{stats.flightapi.avg_response_time}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Error Rate:</span>
                      <span className="font-medium">{stats.flightapi.error_rate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`
                flex items-center px-4 py-2 rounded-lg font-medium text-white
                ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}