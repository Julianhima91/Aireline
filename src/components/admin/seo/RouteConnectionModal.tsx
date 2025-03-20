import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Location {
  id: string;
  type: 'city' | 'state';
  city: string | null;
  state: string;
  status: 'ready' | 'pending' | 'disabled';
  nga_format: string | null;
  per_format: string | null;
}

interface RouteConnection {
  id: string;
  from_location_id: string;
  to_location_id: string;
  status: 'active' | 'inactive';
  template_type_id: string;
  from_location: Location;
  to_location: Location;
  template_type?: {
    id: string;
    name: string;
    slug: string;
  };
  template_url?: string;
}

interface RouteConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection?: RouteConnection;
  onSave: () => void;
}

export function RouteConnectionModal({ isOpen, onClose, connection, onSave }: RouteConnectionModalProps) {
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      if (connection) {
        setFromLocation(connection.from_location_id);
        setToLocation(connection.to_location_id);
        setStatus(connection.status);
      } else {
        setFromLocation('');
        setToLocation('');
        setStatus('active');
      }
    }
  }, [isOpen, connection]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_location_formats')
        .select('*')
        .eq('status', 'ready')
        .order('state, city');

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations');
    }
  };

  const generateTemplateUrl = (fromLoc: Location, toLoc: Location): string => {
    // Determine base URL based on location types
    const baseUrl = fromLoc.type === 'city' && toLoc.type === 'city' 
      ? 'bileta-avioni'
      : 'fluturime';

    // Use nga_format and per_format if available, otherwise generate from city/state
    const fromPart = fromLoc.nga_format || `nga ${fromLoc.type === 'city' ? fromLoc.city : fromLoc.state}`;
    const toPart = toLoc.per_format || `per ${toLoc.type === 'city' ? toLoc.city : toLoc.state}`;

    // Create URL-safe template_url
    return `/${baseUrl}/${fromPart}-${toPart}/`
      .toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with hyphens
      .replace(/[^\w\-\/]+/g, '')  // Remove special characters except hyphens and slashes
      .replace(/\-+/g, '-')        // Replace multiple hyphens with single
      .replace(/^\-+|\-+$/g, '');  // Remove leading/trailing hyphens
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (fromLocation === toLocation) {
        throw new Error('Cannot connect a location to itself');
      }

      // Get locations
      const fromLoc = locations.find(l => l.id === fromLocation);
      const toLoc = locations.find(l => l.id === toLocation);

      if (!fromLoc || !toLoc) {
        throw new Error('Invalid locations selected');
      }

      // Get template type ID
      const { data: templateType } = await supabase
        .from('seo_template_types')
        .select('id')
        .eq('slug', `${fromLoc.type}-${toLoc.type}`)
        .eq('status', 'active')
        .single();

      if (!templateType) {
        throw new Error('No template type found for this connection');
      }

      // Generate template URL
      const template_url = generateTemplateUrl(fromLoc, toLoc);

      if (connection?.id) {
        const { error: updateError } = await supabase
          .from('seo_location_connections')
          .update({
            status,
            template_type_id: templateType.id,
            template_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', connection.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('seo_location_connections')
          .insert([{
            from_location_id: fromLocation,
            to_location_id: toLocation,
            status,
            template_type_id: templateType.id,
            template_url
          }]);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to save connection');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {connection ? 'Edit Route Connection' : 'Add Route Connection'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Location
              </label>
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                disabled={!!connection}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nga_format || `nga ${loc.type === 'city' ? loc.city : loc.state}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Location
              </label>
              <select
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                disabled={!!connection}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select location</option>
                {locations
                  .filter(loc => loc.id !== fromLocation)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.per_format || `per ${loc.type === 'city' ? loc.city : loc.state}`}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Saving...' : connection ? 'Save Changes' : 'Add Connection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}