import React, { useState } from 'react';
import { X, Plane, Calendar, Users } from 'lucide-react';
import { SearchParams } from '../../types/search';
import { CityInput } from '../CityInput';
import { DatePickers } from '../home/DatePickers';
import { PassengerSelector } from '../home/PassengerSelector';
import { formatDateForAPI, parseISODate } from '../../utils/format';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchParams: SearchParams;
  onSearch: (params: SearchParams) => void;
}

export function SearchModal({ isOpen, onClose, searchParams, onSearch }: SearchModalProps) {
  // Parse dates correctly to preserve the selected day
  const initialDepartureDate = searchParams.departureDate ? parseISODate(searchParams.departureDate) : null;
  const initialReturnDate = searchParams.returnDate ? parseISODate(searchParams.returnDate) : null;

  const [localParams, setLocalParams] = useState<SearchParams>({
    ...searchParams,
    departureDate: searchParams.departureDate,
    returnDate: searchParams.returnDate
  });
  const [departureDate, setDepartureDate] = useState<Date | null>(initialDepartureDate);
  const [returnDate, setReturnDate] = useState<Date | null>(initialReturnDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!localParams.fromCode || !localParams.toCode) {
        throw new Error('Please select departure and arrival cities');
      }
      if (!departureDate) {
        throw new Error('Please select a departure date');
      }
      if (localParams.tripType === 'roundTrip' && !returnDate) {
        throw new Error('Please select a return date');
      }

      // Update dates with proper timezone handling
      const updatedParams = {
        ...localParams,
        departureDate: departureDate ? formatDateForAPI(departureDate) : '',
        returnDate: returnDate ? formatDateForAPI(returnDate) : null
      };

      onSearch(updatedParams);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Modify Search</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {/* Trip Type */}
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="roundTrip"
                checked={localParams.tripType === 'roundTrip'}
                onChange={(e) => setLocalParams({ ...localParams, tripType: 'roundTrip' })}
                className="mr-2"
              />
              Round Trip
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="oneWay"
                checked={localParams.tripType === 'oneWay'}
                onChange={(e) => setLocalParams({ ...localParams, tripType: 'oneWay' })}
                className="mr-2"
              />
              One Way
            </label>
          </div>

          {/* Cities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <CityInput
                value={localParams.fromLocation}
                onChange={(city) => setLocalParams({
                  ...localParams,
                  fromLocation: city.name,
                  fromCode: city.code
                })}
                placeholder="From where?"
                icon={Plane}
                label="From"
              />
            </div>
            <div>
              <CityInput
                value={localParams.toLocation}
                onChange={(city) => setLocalParams({
                  ...localParams,
                  toLocation: city.name,
                  toCode: city.code
                })}
                placeholder="Where to?"
                icon={Plane}
                label="To"
              />
            </div>
          </div>

          {/* Dates */}
          <DatePickers
            tripType={localParams.tripType}
            departureDate={departureDate}
            returnDate={returnDate}
            onDepartureDateChange={setDepartureDate}
            onReturnDateChange={setReturnDate}
            onTripTypeChange={(type) => setLocalParams({
              ...localParams,
              tripType: type,
              returnDate: type === 'oneWay' ? null : localParams.returnDate
            })}
          />

          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Passengers
              </div>
            </label>
            <PassengerSelector
              passengers={localParams.passengers}
              onChange={(passengers) => setLocalParams({ ...localParams, passengers })}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 rounded-lg font-semibold text-white
              ${loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {loading ? 'Searching...' : 'Search Flights'}
          </button>
        </form>
      </div>
    </div>
  );
}