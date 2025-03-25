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
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Location } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: formats, error: formatsError } = await supabase
        .from('seo_location_formats')
        .select('*');

      if (formatsError) throw formatsError;
      setLocations(formats || []);
    } catch (err) {
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (location: Location, newStatus: Location['status']) => {
    setSaving(location.id || null);
    try {
      const { error } = await supabase
        .from('seo_location_formats')
        .update({ status: newStatus })
        .eq('id', location.id);

      if (error) throw error;

      setLocations(prev =>
        prev.map(loc =>
          loc.id === location.id ? { ...loc, status: newStatus } : loc
        )
      );
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Location Formats</h2>
      {loading ? (
        <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : error ? (
        <div className="text-red-500 flex items-center"><AlertCircle className="mr-2" /> {error}</div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>State</th>
              <th>City</th>
              <th>Status</th>
              <th>Template URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map(loc => (
              <tr key={loc.id} className="border-t">
                <td>{loc.state}</td>
                <td>{loc.city}</td>
                <td>{loc.status}</td>
                <td>{loc.template_url ? <a href={loc.template_url} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a> : '—'}</td>
                <td>
                  <button
                    className="text-sm text-blue-600 underline"
                    disabled={saving === loc.id}
                    onClick={() => handleStatusToggle(loc, loc.status === 'ready' ? 'pending' : 'ready')}
                  >
                    {loc.status === 'ready' ? 'Mark Pending' : 'Mark Ready'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
