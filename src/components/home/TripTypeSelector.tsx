import React from 'react';

interface TripTypeSelectorProps {
  tripType: 'roundTrip' | 'oneWay';
  onTripTypeChange: (type: 'roundTrip' | 'oneWay') => void;
}

export function TripTypeSelector({ tripType, onTripTypeChange }: TripTypeSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white">
      <button
        className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
          tripType === 'roundTrip'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
        }`}
        onClick={() => onTripTypeChange('roundTrip')}
      >
        Vajtje Ardhje
      </button>
      <button
        className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
          tripType === 'oneWay'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
        }`}
        onClick={() => onTripTypeChange('oneWay')}
      >
        Vajtje
      </button>
    </div>
  );
}
