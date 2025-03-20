import React from 'react';
import { Plane } from 'lucide-react';

interface AirlineFilterProps {
  airlines: string[];
  selectedAirlines: string[];
  onChange: (airlines: string[]) => void;
}

export function AirlineFilter({ airlines, selectedAirlines, onChange }: AirlineFilterProps) {
  const handleToggle = (airline: string) => {
    const newAirlines = selectedAirlines.includes(airline)
      ? selectedAirlines.filter(a => a !== airline)
      : [...selectedAirlines, airline];
    onChange(newAirlines);
  };

  const handleSelectAll = () => {
    onChange(airlines);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Airlines</span>
        </div>
        <div className="space-x-3">
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Select All
          </button>
          <button
            onClick={handleClearAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All
          </button>
        </div>
      </div>
      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
        {airlines.map(airline => (
          <label
            key={airline}
            className="flex items-center group cursor-pointer"
          >
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={selectedAirlines.includes(airline)}
                onChange={() => handleToggle(airline)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-gray-300 rounded transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-600 group-hover:border-blue-400">
                <svg 
                  className="w-3 h-3 mx-auto mt-0.5 text-white opacity-0 peer-checked:opacity-100"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="ml-3 text-sm text-gray-700">{airline}</span>
          </label>
        ))}
      </div>
    </div>
  );
}