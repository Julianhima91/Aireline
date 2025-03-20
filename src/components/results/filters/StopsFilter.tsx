import React from 'react';
import { Plane } from 'lucide-react';

interface StopsFilterProps {
  selectedStops: string[];
  onChange: (stops: string[]) => void;
  isRoundTrip?: boolean;
}

const STOP_OPTIONS = [
  { value: 'direct', label: 'Direct', roundTripLabel: 'Direct (both ways)' },
  { value: '1stop', label: '1 Stop', roundTripLabel: '1 Stop (per leg)' },
  { value: '2plus', label: '2+ Stops', roundTripLabel: '2+ Stops (any leg)' }
];

export function StopsFilter({ selectedStops, onChange, isRoundTrip = false }: StopsFilterProps) {
  const handleToggle = (value: string) => {
    const newStops = selectedStops.includes(value)
      ? selectedStops.filter(stop => stop !== value)
      : [...selectedStops, value];
    onChange(newStops);
  };

  return (
    <div className="space-y-3">
      {STOP_OPTIONS.map(option => (
        <label
          key={option.value}
          className="flex items-center group cursor-pointer"
        >
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={selectedStops.includes(option.value)}
              onChange={() => handleToggle(option.value)}
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
          <div className="ml-3 flex items-center">
            <Plane className={`w-4 h-4 mr-2 ${selectedStops.includes(option.value) ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-700">
              {isRoundTrip ? option.roundTripLabel : option.label}
            </span>
          </div>
        </label>
      ))}
    </div>
  );
}