import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, AlertCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { RouteConnectionModal } from './RouteConnectionModal';

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

interface ExistingConnection {
  fromId: string;
  toId: string;
}

export function RouteConnections() {
  const [connections, setConnections] = useState<RouteConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<RouteConnection | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [existingConnections, setExistingConnections] = useState<Set<string>>(new Set());
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all connections with their details
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('seo_location_connections')
        .select(`
          *,
          from_location:from_location_id(
            id, type, city, state, status, nga_format
          ),
          to_location:to_location_id(
            id, type, city, state, status, per_format
          ),
          template_type:template_type_id(
            id, name, slug
          )
        `)
        .order('created_at', { ascending: false });

      if (connectionsError) throw connectionsError;

      // Build set of existing connections
      const existingSet = new Set<string>();
      connectionsData?.forEach(conn => {
        existingSet.add(`${conn.from_location_id}-${conn.to_location_id}`);
      });
      setExistingConnections(existingSet);

      // Process and set connections
      const processedConnections = await Promise.all((connectionsData || []).map(async (connection) => {
        if (!connection.template_type_id) return connection;

        const { data: templateData } = await supabase
          .from('seo_page_templates')
          .select('url_structure')
          .eq('template_type_id', connection.template_type_id)
          .single();

        if (templateData) {
          let url = templateData.url_structure;
          url = url.replace('{nga_city}', connection.from_location.nga_format || `nga-${connection.from_location.city}`);
          url = url.replace('{per_city}', connection.to_location.per_format || `per-${connection.to_location.city}`);
          url = url.replace('{nga_state}', connection.from_location.nga_format || `nga-${connection.from_location.state}`);
          url = url.replace('{per_state}', connection.to_location.per_format || `per-${connection.to_location.state}`);

          return {
            ...connection,
            template_url: url.toLowerCase().replace(/\s+/g, '-')
          };
        }

        return connection;
      }));

      setConnections(processedConnections);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError('Failed to load route connections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (connection: RouteConnection) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('seo_location_connections')
        .delete()
        .eq('id', connection.id);

      if (deleteError) throw deleteError;

      // Remove from existing connections set
      existingConnections.delete(`${connection.from_location_id}-${connection.to_location_id}`);
      setExistingConnections(new Set(existingConnections));

      await fetchConnections();
    } catch (err) {
      console.error('Error deleting connection:', err);
      setError('Failed to delete connection');
    }
  };

  const handleToggleStatus = async (connection: RouteConnection) => {
    try {
      const newStatus = connection.status === 'active' ? 'inactive' : 'active';
      
      const { error: updateError } = await supabase
        .from('seo_location_connections')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', connection.id);

      if (updateError) throw updateError;

      await fetchConnections();
    } catch (err) {
      console.error('Error updating connection status:', err);
      setError('Failed to update connection status');
    }
  };

  const handleSave = async (fromId: string, toId: string, templateTypeId: string) => {
    try {
      // Check if connection already exists
      const connectionKey = `${fromId}-${toId}`;
      if (existingConnections.has(connectionKey)) {
        throw new Error('This route connection already exists');
      }

      // Get template data
      const { data: template } = await supabase
        .from('seo_page_templates')
        .select('url_structure')
        .eq('template_type_id', templateTypeId)
        .single();

      if (!template) throw new Error('Template not found');

      // Get location data
      const [fromLocation, toLocation] = await Promise.all([
        supabase.from('seo_location_formats').select('*').eq('id', fromId).single(),
        supabase.from('seo_location_formats').select('*').eq('id', toId).single()
      ]);

      if (!fromLocation.data || !toLocation.data) {
        throw new Error('Location data not found');
      }

      // Generate URL
      let url = template.url_structure;
      url = url.replace('{nga_city}', fromLocation.data.nga_format || `nga-${fromLocation.data.city}`);
      url = url.replace('{per_city}', toLocation.data.per_format || `per-${toLocation.data.city}`);
      url = url.replace('{nga_state}', fromLocation.data.nga_format || `nga-${fromLocation.data.state}`);
      url = url.replace('{per_state}', toLocation.data.per_format || `per-${toLocation.data.state}`);

      // Create connection
      const { error: insertError } = await supabase
        .from('seo_location_connections')
        .insert([{
          from_location_id: fromId,
          to_location_id: toId,
          template_type_id: templateTypeId,
          status: 'active',
          template_url: url.toLowerCase().replace(/\s+/g, '-')
        }]);

      if (insertError) throw insertError;

      // Add to existing connections set
      setExistingConnections(prev => new Set(prev).add(connectionKey));

      await fetchConnections();
    } catch (err) {
      console.error('Error saving connection:', err);
      throw err;
    }
  };

  const filteredConnections = connections.filter(connection => {
    const fromLocation = connection.from_location.type === 'city' 
      ? connection.from_location.city 
      : connection.from_location.state;
    
    const toLocation = connection.to_location.type === 'city'
      ? connection.to_location.city
      : connection.to_location.state;

    const searchString = `${fromLocation} ${connection.from_location.state} ${toLocation} ${connection.to_location.state}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const paginatedConnections = filteredConnections.slice(
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search routes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setSelectedConnection(undefined);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Route
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Connections Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                From
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedConnections.map((connection) => (
              <tr key={connection.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {connection.from_location.type === 'city' 
                        ? connection.from_location.city 
                        : connection.from_location.state}
                    </span>
                    <span className="text-gray-500 ml-1">
                      ({connection.from_location.state})
                    </span>
                  </div>
                  {connection.from_location.nga_format && (
                    <div className="text-xs text-gray-500 mt-1">
                      Format: {connection.from_location.nga_format}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {connection.to_location.type === 'city' 
                        ? connection.to_location.city 
                        : connection.to_location.state}
                    </span>
                    <span className="text-gray-500 ml-1">
                      ({connection.to_location.state})
                    </span>
                  </div>
                  {connection.to_location.per_format && (
                    <div className="text-xs text-gray-500 mt-1">
                      Format: {connection.to_location.per_format}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {connection.template_type?.name || 'Not Set'}
                  </div>
                  {connection.template_url && (
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                      {connection.template_url}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(connection)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      connection.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {connection.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    {connection.template_url && (
                      <a
                        href={connection.template_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="Preview SEO Page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        setSelectedConnection(connection);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Connection"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(connection)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Connection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredConnections.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredConnections.length)}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredConnections.length)}
              </span>{' '}
              of <span className="font-medium">{filteredConnections.length}</span> connections
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
              onClick={() => setCurrentPage(page => 
                Math.min(Math.ceil(filteredConnections.length / ITEMS_PER_PAGE), page + 1)
              )}
              disabled={currentPage >= Math.ceil(filteredConnections.length / ITEMS_PER_PAGE)}
              className={`px-3 py-1 rounded ${
                currentPage >= Math.ceil(filteredConnections.length / ITEMS_PER_PAGE)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <RouteConnectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedConnection(undefined);
        }}
        connection={selectedConnection}
        onSave={fetchConnections}
        existingConnections={existingConnections}
      />
    </div>
  );
}