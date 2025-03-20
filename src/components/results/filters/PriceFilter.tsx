import React from 'react';
import { Euro } from 'lucide-react';

interface PriceFilterProps {
  range: {
    min: number;
    max: number;
  };
  min: number;
  max: number;
  onChange: (range: { min: number; max: number }) => void;
}

export function PriceFilter({ range, min, max, onChange }: PriceFilterProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.max(min, Math.min(range.max, Number(e.target.value)));
    onChange({ ...range, min: newMin });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.min(max, Math.max(range.min, Number(e.target.value)));
    onChange({ ...range, max: newMax });
  };

  const getPercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Price Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min Price</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              min={min}
              max={range.max}
              value={range.min}
              onChange={handleMinChange}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max Price</label>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              min={range.min}
              max={max}
              value={range.max}
              onChange={handleMaxChange}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Range Slider */}
      <div className="relative pt-2">
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="absolute h-2 bg-blue-600 rounded-full"
            style={{
              left: `${getPercentage(range.min)}%`,
              right: `${100 - getPercentage(range.max)}%`
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={range.min}
          onChange={handleMinChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
          style={{
            WebkitAppearance: 'none',
            zIndex: 3
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={range.max}
          onChange={handleMaxChange}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none"
          style={{
            WebkitAppearance: 'none',
            zIndex: 4
          }}
        />
      </div>
    </div>
  );
}