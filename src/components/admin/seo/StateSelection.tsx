import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface State {
  state_name: string;
  is_enabled: boolean;
}

export function StateSelection() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get unique states from airports table
      const { data: uniqueStates, error: statesError } = await supabase
        .from('airports')
        .select('state')
        .order('state');

      if (statesError) throw statesError;

      // Get enabled states
      const { data: enabledStates, error: enabledError } = await supabase
        .from('seo_enabled_states')
        .select('state_name');

      if (enabledError) throw enabledError;

      // Create a Set of enabled state names for O(1) lookup
      const enabledSet = new Set(enabledStates?.map(s => s.state_name) || []);

      // Create unique states array with enabled status
      const uniqueStatesList = Array.from(
        new Set(uniqueStates?.map(s => s.state) || [])
      ).map(state => ({
        state_name: state,
        is_enabled: enabledSet.has(state)
      }));

      setStates(uniqueStatesList);
    } catch (err) {
      console.error('Error fetching states:', err);
      setError('Failed to load states. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (state: State) => {
    try {
      setSaving(state.state_name);
      setError(null);

      if (state.is_enabled) {
        // Delete from enabled states
        const { error: deleteError } = await supabase
          .from('seo_enabled_states')
          .delete()
          .eq('state_name', state.state_name);

        if (deleteError) throw deleteError;

        // Delete associated location formats
        const { error: formatsError } = await supabase
          .from('seo_location_formats')
          .delete()
          .eq('state', state.state_name);

        if (formatsError) throw formatsError;
      } else {
        // Add to enabled states
        const { error: insertError } = await supabase
          .from('seo_enabled_states')
          .insert([{ state_name: state.state_name }])
          .select()
          .single();

        if (insertError) throw insertError;

        // Get all cities for this state
        const { data: cities, error: citiesError } = await supabase
          .from('airports')
          .select('city, state')
          .eq('state', state.state_name);

        if (citiesError) throw citiesError;

        // Create unique city-state pairs
        const uniqueCityPairs = Array.from(
          new Set((cities || []).map(c => `${c.city}-${c.state}`))
        ).map(pair => {
          const [city, state] = pair.split('-');
          return { city, state };
        });

        // Create state-level format
        const stateFormat = {
          type: 'state',
          city: null,
          state: state.state_name,
          nga_format: `Nga ${state.state_name}`,
          per_format: `Për ${state.state_name}`,
          status: 'pending'
        };

        // Create city-level formats
        const cityFormats = uniqueCityPairs.map(pair => ({
          type: 'city',
          city: pair.city,
          state: pair.state,
          nga_format: `Nga ${pair.city}`,
          per_format: `Për ${pair.city}`,
          status: 'pending'
        }));

        // Insert formats one by one to avoid conflicts
        for (const format of [stateFormat, ...cityFormats]) {
          const { error: formatError } = await supabase
            .from('seo_location_formats')
            .upsert(format, {
              onConflict: 'type,city,state'
            });

          if (formatError) {
            console.error('Error inserting format:', formatError);
            // Continue with other formats even if one fails
          }
        }
      }

      // Update local state
      setStates(states.map(s => 
        s.state_name === state.state_name 
          ? { ...s, is_enabled: !s.is_enabled }
          : s
      ));
    } catch (err) {
      console.error('Error toggling state:', err);
      setError('Failed to update state. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  // Filter and paginate states
  const filteredStates = states.filter(state =>
    state.state_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredStates.length / ITEMS_PER_PAGE);
  const paginatedStates = filteredStates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          placeholder="Search states..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* States Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                SEO Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedStates.map((state) => (
              <tr key={state.state_name} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {state.state_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleToggle(state)}
                    disabled={saving === state.state_name}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    style={{
                      backgroundColor: state.is_enabled ? '#2563eb' : '#d1d5db'
                    }}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        state.is_enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredStates.length)}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredStates.length)}
              </span>{' '}
              of <span className="font-medium">{filteredStates.length}</span> states
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}