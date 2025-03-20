import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ScoringSettings {
  direct_flight_bonus: number;
  arrival_time_bonuses: {
    early_morning: { start: number; end: number; points: number };
    morning: { start: number; end: number; points: number };
  };
  departure_time_bonuses: {
    afternoon: { start: number; end: number; points: number };
    evening: { start: number; end: number; points: number };
  };
  stop_penalties: {
    one_stop: number;
    two_plus_stops: number;
  };
  duration_penalties: {
    medium: { hours: number; points: number };
    long: { hours: number; points: number };
    very_long: { hours: number; points: number };
  };
}

const DEFAULT_SETTINGS: ScoringSettings = {
  direct_flight_bonus: 5,
  arrival_time_bonuses: {
    early_morning: { start: 3, end: 10, points: 5 },
    morning: { start: 10, end: 15, points: 3 }
  },
  departure_time_bonuses: {
    afternoon: { start: 14, end: 18, points: 3 },
    evening: { start: 18, end: 24, points: 5 }
  },
  stop_penalties: {
    one_stop: -5,
    two_plus_stops: -10
  },
  duration_penalties: {
    medium: { hours: 4, points: -1 },
    long: { hours: 6, points: -2 },
    very_long: { hours: 6, points: -3 }
  }
};

export function FlightScoringSettings() {
  const [settings, setSettings] = useState<ScoringSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('scoring_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching scoring settings:', err);
      setError('Failed to load scoring settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: saveError } = await supabase
        .from('scoring_settings')
        .upsert({
          id: 'default',
          settings,
          updated_at: new Date().toISOString()
        });

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving scoring settings:', err);
      setError('Failed to save scoring settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Flight Scoring Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure the scoring parameters used to rank and sort flights
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-8">
          {/* Direct Flight Bonus */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Direct Flight Bonus</h3>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={settings.direct_flight_bonus}
                onChange={(e) => setSettings({
                  ...settings,
                  direct_flight_bonus: Number(e.target.value)
                })}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600">points</span>
            </div>
          </div>

          {/* Arrival Time Bonuses */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Arrival Time Bonuses</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Early Morning (03:00 - 10:00)
                </label>
                <input
                  type="number"
                  value={settings.arrival_time_bonuses.early_morning.points}
                  onChange={(e) => setSettings({
                    ...settings,
                    arrival_time_bonuses: {
                      ...settings.arrival_time_bonuses,
                      early_morning: {
                        ...settings.arrival_time_bonuses.early_morning,
                        points: Number(e.target.value)
                      }
                    }
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Morning (10:01 - 14:59)
                </label>
                <input
                  type="number"
                  value={settings.arrival_time_bonuses.morning.points}
                  onChange={(e) => setSettings({
                    ...settings,
                    arrival_time_bonuses: {
                      ...settings.arrival_time_bonuses,
                      morning: {
                        ...settings.arrival_time_bonuses.morning,
                        points: Number(e.target.value)
                      }
                    }
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Stop Penalties */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stop Penalties</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  One Stop
                </label>
                <input
                  type="number"
                  value={settings.stop_penalties.one_stop}
                  onChange={(e) => setSettings({
                    ...settings,
                    stop_penalties: {
                      ...settings.stop_penalties,
                      one_stop: Number(e.target.value)
                    }
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Two or More Stops
                </label>
                <input
                  type="number"
                  value={settings.stop_penalties.two_plus_stops}
                  onChange={(e) => setSettings({
                    ...settings,
                    stop_penalties: {
                      ...settings.stop_penalties,
                      two_plus_stops: Number(e.target.value)
                    }
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Duration Penalties */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Duration Penalties</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medium (2-4 hours)
                </label>
                <input
                  type="number"
                  value={settings.duration_penalties.medium.points}
                  onChange={(e) => setSettings({
                    ...settings,
                    duration_penalties: {
                      ...settings.duration_penalties,
                      medium: {
                        ...settings.duration_penalties.medium,
                        points: Number(e.target.value)
                      }
                    }
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Long (4-6 hours)
                </label>
                <input
                  type="number"
                  value={settings.duration_penalties.long.points}
                  onChange={(e) => setSettings({
                    ...settings,
                    duration_penalties: {
                      ...settings.duration_penalties,
                      long: {
                        ...settings.duration_penalties.long,
                        points: Number(e.target.value)
                      }
                    }
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Very Long (6+ hours)
                </label>
                <input
                  type="number"
                  value={settings.duration_penalties.very_long.points}
                  onChange={(e) => setSettings({
                    ...settings,
                    duration_penalties: {
                      ...settings.duration_penalties,
                      very_long: {
                        ...settings.duration_penalties.very_long,
                        points: Number(e.target.value)
                      }
                    }
                  })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-end gap-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white
              ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}