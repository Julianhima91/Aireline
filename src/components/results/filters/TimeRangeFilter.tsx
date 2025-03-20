import React from 'react';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

interface TimeRangeFilterProps {
  title: string;
  selectedRanges: string[];
  onChange: (ranges: string[]) => void;
}

const TIME_RANGES = [
  { value: 'morning', label: 'Morning (06:00 - 11:59)', icon: Sunrise },
  { value: 'afternoon', label: 'Afternoon (12:00 - 17:59)', icon: Sun },
  { value: 'evening', label: 'Evening (18:00 - 23:59)', icon: Sunset },
  { value: 'night', label: 'Night (00:00 - 05:59)', icon: Moon }
];

export function TimeRangeFilter({ selectedRanges, onChange }: TimeRangeFilterProps) {
  const handleToggle = (value: string) => {
    const newRanges = selectedRanges.includes(value)
      ? selectedRanges.filter(range => range !== value)
      : [...selectedRanges, value];
    onChange(newRanges);
  };

  return (
    <div className="space-y-3">
      {TIME_RANGES.map(range => {
        const Icon = range.icon;
        const isSelected = selectedRanges.includes(range.value);
        
        return (
          <label
            key={range.value}
            className="flex items-center group cursor-pointer"
          >
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(range.value)}
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
              <Icon className={`w-4 h-4 mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-700">{range.label}</span>
            </div>
          </label>
        );
      })}
    </div>
  );
}