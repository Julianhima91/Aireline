import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../lib/supabase';
import { CityInput } from '../../CityInput';
import { City } from '../../../types/search';
import { formatDateForAPI } from '../../../utils/format';
import { MapPin, Plane, Calendar, Search, ArrowRight } from 'lucide-react';

interface FlightSearchProps {
  fromCity: string;
  toCity: string;
  className?: string;
}

export function FlightSearchComponent({ fromCity, toCity, className = '' }: FlightSearchProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFromCity, setSelectedFromCity] = useState<City | null>(null);
  const [selectedToCity, setSelectedToCity] = useState<City | null>(null);
  const [selectedDates, setSelectedDates] = useState({
    departure: '',
    return: ''
  });
  const [tripType, setTripType] = useState<'roundTrip' | 'oneWay'>('roundTrip');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!selectedFromCity || !selectedToCity) {
        throw new Error('Ju lutem zgjidhni qytetin e nisjes dhe destinacionit');
      }
      if (!selectedDates.departure) {
        throw new Error('Ju lutem zgjidhni datën e nisjes');
      }
      if (tripType === 'roundTrip' && !selectedDates.return) {
        throw new Error('Ju lutem zgjidhni datën e kthimit');
      }

      const batchId = uuidv4();
      const searchParams = {
        fromLocation: selectedFromCity.name,
        toLocation: selectedToCity.name,
        fromCode: selectedFromCity.code,
        toCode: selectedToCity.code,
        departureDate: formatDateForAPI(new Date(selectedDates.departure)),
        returnDate: selectedDates.return ? formatDateForAPI(new Date(selectedDates.return)) : null,
        tripType,
        travelClass: '1',
        stops: '0',
        passengers: {
          adults: 1,
          children: 0,
          infantsInSeat: 0,
          infantsOnLap: 0
        }
      };

      const { error: saveError } = await supabase
        .from('saved_searches')
        .insert([{
          batch_id: batchId,
          user_id: null,
          search_params: searchParams,
          results: null,
          cached_results: null,
          cached_until: null,
          price_stability_level: 'MEDIUM'
        }]);

      if (saveError) throw saveError;

      sessionStorage.setItem(`search_${batchId}`, 'true');
      navigate(`/results?batch_id=${batchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ndodhi një gabim gjatë kërkimit të fluturimeve');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg duration-300 ${className}`}>
      {/* Mobile View - Collapsed State */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 bg-white flex items-center justify-between border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-[#3182CE]" />
            <div className="flex items-center gap-2">
              <span className="text-[#2D3748] font-medium">{fromCity}</span>
              <ArrowRight className="w-4 h-4 text-[#4A5568]" />
              <span className="text-[#2D3748] font-medium">{toCity}</span>
            </div>
          </div>
          <span className="text-sm font-medium text-[#3182CE]">
            {isExpanded ? 'Mbyll' : 'Kërko Fluturime'}
          </span>
        </button>

        {/* Mobile Expanded Form */}
        {isExpanded && (
          <form onSubmit={handleSearch} className="p-6 space-y-6 bg-white">
            {/* Trip Type Selection */}
            <div className="flex gap-4 p-1 bg-gray-50 rounded-lg">
              <label className="flex-1">
                <input
                  type="radio"
                  className="sr-only peer"
                  checked={tripType === 'roundTrip'}
                  onChange={() => setTripType('roundTrip')}
                />
                <div className="w-full py-2 text-center text-sm font-medium rounded-md cursor-pointer transition-colors peer-checked:bg-white peer-checked:text-[#3182CE] peer-checked:shadow-sm text-gray-600">
                  Vajtje-Ardhje
                </div>
              </label>
              <label className="flex-1">
                <input
                  type="radio"
                  className="sr-only peer"
                  checked={tripType === 'oneWay'}
                  onChange={() => setTripType('oneWay')}
                />
                <div className="w-full py-2 text-center text-sm font-medium rounded-md cursor-pointer transition-colors peer-checked:bg-white peer-checked:text-[#3182CE] peer-checked:shadow-sm text-gray-600">
                  Vetem Vajtje
                </div>
              </label>
            </div>

            {/* From City */}
            <CityInput
              value={selectedFromCity?.name || ''}
              onChange={setSelectedFromCity}
              placeholder="Nga ku?"
              icon={MapPin}
              label="Nga"
            />

            {/* To City */}
            <CityInput
              value={selectedToCity?.name || ''}
              onChange={setSelectedToCity}
              placeholder="Për ku?"
              icon={Plane}
              label="Për"
            />

            {/* Dates */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2D3748] mb-1">
                  Data e Nisjes
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]" size={20} />
                  <input
                    type="date"
                    value={selectedDates.departure}
                    onChange={(e) => setSelectedDates({ ...selectedDates, departure: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3182CE] focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {tripType === 'roundTrip' && (
                <div>
                  <label className="block text-sm font-medium text-[#2D3748] mb-1">
                    Data e Kthimit
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]" size={20} />
                    <input
                      type="date"
                      value={selectedDates.return}
                      onChange={(e) => setSelectedDates({ ...selectedDates, return: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3182CE] focus:border-transparent"
                      min={selectedDates.departure}
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-4 rounded-lg font-medium text-white text-base
                transition-all duration-300 transform
                ${loading 
                  ? 'bg-[#63B3ED] cursor-not-allowed'
                  : 'bg-[#3182CE] hover:bg-[#2C5282] active:scale-[0.98]'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Duke kerkuar...
                </div>
              ) : (
                'Kërko Fluturime'
              )}
            </button>
          </form>
        )}
      </div>

      {/* Desktop View */}
      <form onSubmit={handleSearch} className="hidden lg:block p-8">
        <div className="flex items-center gap-8 mb-8">
          {/* Trip Type Selection */}
          <div className="flex gap-6 p-1 bg-gray-50 rounded-lg">
            <label className="relative">
              <input
                type="radio"
                className="sr-only peer"
                checked={tripType === 'roundTrip'}
                onChange={() => setTripType('roundTrip')}
              />
              <div className="px-6 py-2 rounded-md cursor-pointer transition-all duration-200 peer-checked:bg-white peer-checked:text-[#3182CE] peer-checked:shadow-sm text-gray-600">
                Vajtje-Ardhje
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                className="sr-only peer"
                checked={tripType === 'oneWay'}
                onChange={() => setTripType('oneWay')}
              />
              <div className="px-6 py-2 rounded-md cursor-pointer transition-all duration-200 peer-checked:bg-white peer-checked:text-[#3182CE] peer-checked:shadow-sm text-gray-600">
                Vetem Vajtje
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* From City */}
          <CityInput
            value={selectedFromCity?.name || ''}
            onChange={setSelectedFromCity}
            placeholder="Nga ku?"
            icon={MapPin}
            label="Nga"
          />

          {/* To City */}
          <CityInput
            value={selectedToCity?.name || ''}
            onChange={setSelectedToCity}
            placeholder="Për ku?"
            icon={Plane}
            label="Për"
          />

          {/* Departure Date */}
          <div>
            <label className="block text-sm font-medium text-[#2D3748] mb-1">
              Data e Nisjes
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]" size={20} />
              <input
                type="date"
                value={selectedDates.departure}
                onChange={(e) => setSelectedDates({ ...selectedDates, departure: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3182CE] focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Return Date or Search Button */}
          {tripType === 'roundTrip' ? (
            <div>
              <label className="block text-sm font-medium text-[#2D3748] mb-1">
                Data e Kthimit
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]" size={20} />
                <input
                  type="date"
                  value={selectedDates.return}
                  onChange={(e) => setSelectedDates({ ...selectedDates, return: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3182CE] focus:border-transparent"
                  min={selectedDates.departure}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full py-2 rounded-lg font-medium text-white text-base
                  transition-all duration-300 transform
                  ${loading 
                    ? 'bg-[#63B3ED] cursor-not-allowed'
                    : 'bg-[#3182CE] hover:bg-[#2C5282] active:scale-[0.98]'
                  }
                `}
              >
                {loading ? 'Duke kërkuar...' : 'Kërko Fluturime'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {tripType === 'roundTrip' && (
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-4 rounded-lg font-medium text-white text-base
                transition-all duration-300 transform
                ${loading 
                  ? 'bg-[#63B3ED] cursor-not-allowed'
                  : 'bg-[#3182CE] hover:bg-[#2C5282] active:scale-[0.98]'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Duke kerkuar...
                </div>
              ) : (
                'Kërko Fluturime'
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}