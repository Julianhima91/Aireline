import React, { useState, useEffect } from 'react';
import { Plane, Upload, Plus, Edit2, Trash2, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AirportModal } from './AirportModal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import Papa from 'papaparse';

interface Airport {
  id: string;
  name: string;
  city: string;
  state: string;
  iata_code: string;
}

export function AirportsManagement() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [airportToDelete, setAirportToDelete] = useState<Airport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    try {
      const { data, error } = await supabase
        .from('airports')
        .select('*')
        .order('iata_code');

      if (error) throw error;
      setAirports(data || []);
    } catch (err) {
      console.error('Error fetching airports:', err);
      setError('Failed to load airports');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const airports = results.data.map((row: any) => ({
              name: row['Airport Name'] || row.name,
              city: row.City || row.city,
              state: row.State || row.state,
              iata_code: row['IATA Code'] || row.iata_code
            }));

            const { error: importError } = await supabase
              .from('airports')
              .upsert(airports, {
                onConflict: 'iata_code'
              });

            if (importError) throw importError;

            await fetchAirports();
          } catch (err) {
            console.error('Error importing airports:', err);
            setError('Failed to import airports');
          } finally {
            setImporting(false);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setError('Failed to parse CSV file');
          setImporting(false);
        }
      });
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read file');
      setImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!airportToDelete) return;

    try {
      const { error } = await supabase
        .from('airports')
        .delete()
        .eq('id', airportToDelete.id);

      if (error) throw error;

      setAirports(airports.filter(airport => airport.id !== airportToDelete.id));
      setIsDeleteDialogOpen(false);
      setAirportToDelete(null);
    } catch (err) {
      console.error('Error deleting airport:', err);
      setError('Failed to delete airport');
    }
  };

  const filteredAirports = airports.filter(airport => 
    airport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.iata_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Plane className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-800">Airports</h2>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
              <Upload className="w-5 h-5 mr-2" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>
            <button
              onClick={() => {
                setSelectedAirport(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Airport
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {importing && (
        <div className="m-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center text-blue-700">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Importing airports...
        </div>
      )}

      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search airports..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Airports Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IATA Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Airport Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State/Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAirports.map((airport) => (
                <tr key={airport.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {airport.iata_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {airport.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {airport.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {airport.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedAirport(airport);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit airport"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setAirportToDelete(airport);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Delete airport"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AirportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAirport(null);
        }}
        airport={selectedAirport}
        onSave={fetchAirports}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Airport"
        message={`Are you sure you want to delete ${airportToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}