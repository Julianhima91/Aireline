import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface Airport {
  id: string;
  name: string;
  city: string;
  state: string;
  iata_code: string;
}

interface AirportModalProps {
  isOpen: boolean;
  onClose: () => void;
  airport: Airport | null;
  onSave: () => void;
}

export function AirportModal({ isOpen, onClose, airport, onSave }: AirportModalProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [iataCode, setIataCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (airport) {
      setName(airport.name);
      setCity(airport.city);
      setState(airport.state);
      setIataCode(airport.iata_code);
    } else {
      setName('');
      setCity('');
      setState('');
      setIataCode('');
    }
  }, [airport]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (airport) {
        // Update existing airport
        const { error: updateError } = await supabase
          .from('airports')
          .update({
            name,
            city,
            state,
            iata_code: iataCode.toUpperCase()
          })
          .eq('id', airport.id);

        if (updateError) throw updateError;
      } else {
        // Create new airport
        const { error: createError } = await supabase
          .from('airports')
          .insert([{
            name,
            city,
            state,
            iata_code: iataCode.toUpperCase()
          }]);

        if (createError) throw createError;
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving airport:', err);
      setError(err instanceof Error ? err.message : 'Failed to save airport');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {airport ? 'Edit Airport' : 'Add New Airport'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Airport Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Country
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IATA Code
              </label>
              <input
                type="text"
                value={iataCode}
                onChange={(e) => setIataCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                maxLength={3}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                3-letter IATA airport code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold text-white ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : airport ? 'Save Changes' : 'Add Airport'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}