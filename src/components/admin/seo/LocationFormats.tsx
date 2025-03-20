import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, Filter, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Location {
  id?: string;
  type: 'city' | 'state';
  city: string | null;
  state: string;
  nga_format: string | null;
  per_format: string | null;
  status: 'ready' | 'pending' | 'disabled';
  template_created: boolean;
  template_url: string | null;
}

type StatusFilter = 'all' | 'ready' | 'pending' | 'disabled';
type TypeFilter = 'all' | 'city' | 'state';

export function LocationFormats() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState<string | null>(null);

  // Used to track inline editing of nga_format/per_format
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: 'state' | 'nga_format' | 'per_format';
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetches all enabled states, their cities, and any existing formats
  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get enabled states
      const { data: enabledStates, error: statesError } = await supabase
        .from('seo_enabled_states')
        .select('state_name');

      if (statesError) throw statesError;
      if (!enabledStates?.length) {
        setLocations([]);
        return;
      }

      // 2. Get cities from enabled states
      const { data: cities, error: citiesError } = await supabase
        .from('airports')
        .select('city, state')
        .in('state', enabledStates.map((s) => s.state_name))
        .order('city');

      if (citiesError) throw citiesError;

      // 3. Get existing formats (including IDs)
      const { data: formats, error: formatsError } = await supabase
        .from('seo_location_formats')
        .select('*');

      if (formatsError) throw formatsError;

      // Create a map: key => format object
      // For a city:  key = "city-{city}-{state}"
      // For a state: key = "state-{state}"
      const formatMap = new Map(
        formats?.map((f) => [
          f.type === 'city' ? `city-${f.city}-${f.state}` : `state-${f.state}`,
          f,
        ]) || []
      );

      // 4. Build state list
      const statesList: Location[] = enabledStates.map(({ state_name }) => {
        const format = formatMap.get(`state-${state_name}`);
        return {
          id: format?.id,
          type: 'state',
          city: null,
          state: state_name,
          nga_format: format?.nga_format || null,
          per_format: format?.per_format || null,
          status: format?.status || 'pending',
          template_created: format?.template_created || false,
          template_url: format?.template_url || null,
        };
      });

      // 5. Build city list
      const uniqueCityKeys = new Set<string>();
      const citiesList: Location[] = [];

      (cities || []).forEach((cityObj) => {
        const cityKey = `${cityObj.city}-${cityObj.state}`;
        if (!uniqueCityKeys.has(cityKey)) {
          uniqueCityKeys.add(cityKey);

          const format = formatMap.get(`city-${cityObj.city}-${cityObj.state}`);
          citiesList.push({
            id: format?.id,
            type: 'city',
            city: cityObj.city,
            state: cityObj.state,
            nga_format: format?.nga_format || null,
            per_format: format?.per_format || null,
            status: format?.status || 'pending',
            template_created: format?.template_created || false,
            template_url: format?.template_url || null,
          });
        }
      });

      // 6. Combine & sort
      setLocations([
        ...statesList.sort((a, b) => a.state.localeCompare(b.state)),
        ...citiesList.sort((a, b) => a.city!.localeCompare(b.city!)),
      ]);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle changes to the status dropdown (ready/pending/disabled)
 const handleStatusChange = async (location: Location, newStatus: Location['status']) => {
  try {
    const savingId = location.type === 'city' ? location.city! : location.state;
    setSaving(savingId);
    setError(null);

    // Create updated location object
    const updatedLocation = {
      ...location,
      status: newStatus,
      // Set default formats if changing to ready and formats are not set
      nga_format:
        newStatus === 'ready' && !location.nga_format
          ? `Nga ${location.type === 'city' ? location.city : location.state}`
          : location.nga_format,
      per_format:
        newStatus === 'ready' && !location.per_format
          ? `per ${location.type === 'city' ? location.city : location.state}`
          : location.per_format,
    };

    // Save location format
    const { data: savedFormat, error: saveError } = await supabase
      .from('seo_location_formats')
      .update({
        nga_format: updatedLocation.nga_format,
        per_format: updatedLocation.per_format,
        status: updatedLocation.status
      })
      .eq('id', location.id)
      .select()
      .single();

    if (saveError) throw saveError;
    if (!savedFormat) throw new Error('Failed to save location format');

    // If status changed to ready, create route connections
    if (newStatus === 'ready') {
      // Get all other ready locations
      const { data: readyLocations, error: readyError } = await supabase
        .from('seo_location_formats')
        .select('*')
        .eq('status', 'ready')
        .neq('id', location.id);

      if (readyError) throw readyError;

      // Get template types for connections
      const { data: templateTypes, error: typesError } = await supabase
        .from('seo_template_types')
        .select(`
          id,
          slug,
          templates:seo_page_templates(
            id,
            template_type_id,
            url_structure
          )
        `)
        .eq('status', 'active');

      if (typesError) throw typesError;

      // Create map of template types
      const templateTypeMap = new Map();
      templateTypes?.forEach(type => {
        if(type.templates)
        {
          templateTypeMap.set(type.slug, {
            id: type.id,
            url_structure: type.templates.url_structure
          });
        }
      });
      

      // Prepare connections array
      const connections = [];

      // Generate connections with other ready locations
      for (const otherLocation of readyLocations || []) {
        // Skip invalid connections
        if (
          location.id === otherLocation.id ||
          (location.type === 'city' &&
            otherLocation.type === 'state' &&
            location.state === otherLocation.state) ||
          (location.type === 'state' &&
            otherLocation.type === 'city' &&
            location.state === otherLocation.state)
        ) {
          continue;
        }

        // Get template type based on location types
        const templateKey = `${location.type}-${otherLocation.type}`;
        const templateType = templateTypeMap.get(templateKey);

        if (!templateType) continue;

        // Generate URL for forward connection
        let forwardUrl = templateType.url_structure;
        forwardUrl = forwardUrl.replace(
          '{nga_city}',
          location.nga_format || `nga-${location.city}`
        );
        forwardUrl = forwardUrl.replace(
          '{nga_state}',
          location.nga_format || `nga-${location.state}`
        );

        forwardUrl = forwardUrl.replace(
          '{per_city}',
          otherLocation.per_format || `per-${otherLocation.city}`
        );
        forwardUrl = forwardUrl.replace(
          '{per_state}',
          otherLocation.per_format || `per-${otherLocation.state}`
        );

        // Generate URL for reverse connection
        let reverseUrl = templateType.url_structure;
        reverseUrl = reverseUrl.replace(
          '{nga_city}',
          otherLocation.nga_format || `nga-${otherLocation.city}`
        );
        reverseUrl = reverseUrl.replace(
          '{nga_state}',
          otherLocation.nga_format || `nga-${otherLocation.state}`
        );

        reverseUrl = reverseUrl.replace(
          '{per_city}',
          location.per_format || `per-${location.city}`
        );
        reverseUrl = reverseUrl.replace(
          '{per_state}',
          location.per_format || `per-${location.state}`
        );

        // Clean URLs
        const cleanForwardUrl = forwardUrl
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-\/]/g, '')
          .replace(/\-+/g, '-')
          .replace(/^\-+|\-+$/g, '');

        const cleanReverseUrl = reverseUrl
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-\/]/g, '')
          .replace(/\-+/g, '-')
          .replace(/^\-+|\-+$/g, '');

        // Add forward connection
        connections.push({
          from_location_id: location.id,
          to_location_id: otherLocation.id,
          status: 'active',
          template_type_id: templateType.id,
          template_url: cleanForwardUrl
        });

        // Add reverse connection
        connections.push({
          from_location_id: otherLocation.id,
          to_location_id: location.id,
          status: 'active',
          template_type_id: templateType.id,
          template_url: cleanReverseUrl
        });
      }

      // Insert connections in batches
      const BATCH_SIZE = 50;
      for (let i = 0; i < connections.length; i += BATCH_SIZE) {
        const batch = connections.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase
          .from('seo_location_connections')
          .upsert(batch, {
            onConflict: 'from_location_id,to_location_id'
          });

        if (insertError) throw insertError;
      }
    }

    // Update local state
    setLocations(prevLocations =>
      prevLocations.map(loc =>
        loc.id === location.id
          ? { ...updatedLocation, id: savedFormat.id }
          : loc
      )
    );
  } catch (err) {
    console.error('Error saving location format:', err);
    setError('Failed to save location format. Please try again.');
  } finally {
    setSaving(null);
  }
};

  // Called when user clicks on a cell (nga_format/per_format) to edit inline
  const handleCellClick = (
    location: Location,
    field: 'state' | 'nga_format' | 'per_format'
  ) => {
    // Don’t allow editing the state field for city-type records
    if (location.type === 'city' && field === 'state') return;

    // Use the DB ID if present, otherwise a fallback unique string
    const id = location.id || `${location.type}-${location.city}-${location.state}`;
    setEditingCell({ id, field });
    setEditValue(location[field] || '');
  };

  // Called when the inline edit input loses focus
  const handleCellBlur = async (location: Location) => {
    if (!editingCell) return;

    try {
      const savingId = location.type === 'city' ? location.city! : location.state;
      setSaving(savingId);
      setError(null);

      // Merge new field value into location
      const updatedLocation = {
        ...location,
        [editingCell.field]: editValue || null,
      };

      let savedFormat;

      // If we have an ID, do a direct UPDATE
      if (location.id) {
        const { data, error: updateError } = await supabase
          .from('seo_location_formats')
          .update({
            nga_format: updatedLocation.nga_format,
            per_format: updatedLocation.per_format,
            status: updatedLocation.status,
          })
          .eq('id', location.id)
          .select()
          .single();

        if (updateError) throw updateError;
        if (!data) throw new Error('Failed to update location format');
        savedFormat = data;
      } else {
        // Otherwise, insert
        const { data, error: insertError } = await supabase
          .from('seo_location_formats')
          .insert({
            type: updatedLocation.type,
            city: updatedLocation.city,
            state: updatedLocation.state,
            nga_format: updatedLocation.nga_format,
            per_format: updatedLocation.per_format,
            status: updatedLocation.status,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (!data) throw new Error('Failed to insert location format');
        savedFormat = data;
      }

      // Update local state
      setLocations((prev) =>
        prev.map((loc) =>
          loc.type === location.type &&
          ((loc.type === 'city' && loc.city === location.city) ||
            (loc.type === 'state' && loc.state === location.state))
            ? { ...updatedLocation, id: savedFormat.id }
            : loc
        )
      );

      // End editing mode
      setEditingCell(null);
    } catch (err) {
      console.error('Error saving location format:', err);
      setError('Failed to save location format. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  // Filtering + pagination
  const filteredLocations = locations.filter((location) => {
    const searchableText =
      location.type === 'city'
        ? `${location.city} ${location.state}`
        : location.state;

    const matchesSearch = searchableText
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || location.status === statusFilter;
    const matchesType = typeFilter === 'all' || location.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // -- RENDER --
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Locations Available
        </h3>
        <p className="text-gray-600">
          Please enable some states in the "Select States for SEO" tab first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search locations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="md:w-48">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as TypeFilter);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="state">States Only</option>
            <option value="city">Cities Only</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:w-64">
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="ready">✅ OK to be used</option>
              <option value="pending">⏳ Waiting for configuration</option>
              <option value="disabled">❌ Not needed</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Locations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nga Format
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Per Format
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedLocations.map((location) => {
              // Use the DB ID if present, else generate a fallback unique key
              const uniqueId =
                location.id ||
                `${location.type}-${location.city || ''}-${location.state}`;

              // Determine if this row is being edited or saved
              const isEditing = editingCell?.id === uniqueId;
              const isSaving =
                saving === (location.type === 'city' ? location.city : location.state);

              return (
                <tr key={uniqueId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-${
                        location.type === 'state' ? 'medium' : 'normal'
                      }`}
                    >
                      {location.type === 'city' ? location.city : location.state}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {location.type === 'state' ? 'State' : 'City'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {location.state}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:bg-gray-100"
                    onClick={() => handleCellClick(location, 'nga_format')}
                  >
                    {isEditing && editingCell?.field === 'nga_format' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellBlur(location)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-900">
                        {location.nga_format ||
                          `Nga ${
                            location.type === 'city' ? location.city : location.state
                          }`}
                      </span>
                    )}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:bg-gray-100"
                    onClick={() => handleCellClick(location, 'per_format')}
                  >
                    {isEditing && editingCell?.field === 'per_format' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleCellBlur(location)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-900">
                        {location.per_format ||
                          `per ${
                            location.type === 'city' ? location.city : location.state
                          }`}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={location.status}
                      onChange={(e) =>
                        handleStatusChange(location, e.target.value as Location['status'])
                      }
                      disabled={isSaving}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${
                          location.status === 'ready'
                            ? 'bg-green-100 text-green-800'
                            : location.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      `}
                    >
                      <option value="ready">✅ OK to be used</option>
                      <option value="pending">⏳ Waiting</option>
                      <option value="disabled">❌ Not needed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {location.template_created ? (
                      <a
                        href={location.template_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Template
                      </a>
                    ) : (
                      <span className="text-gray-500">Not Created</span>
                    )}
                  </td>
                </tr>
              );
            })}
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
                {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredLocations.length)}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredLocations.length)}
              </span>{' '}
              of <span className="font-medium">{filteredLocations.length}</span> locations
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
