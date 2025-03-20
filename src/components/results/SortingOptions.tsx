import React from 'react';
import { ArrowDownAZ, Clock, Star } from 'lucide-react';
import { SortOption } from '../../utils/flightScoring';

interface SortingOptionsProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

const SORT_OPTIONS: Array<{
  value: SortOption;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    value: 'best',
    label: 'Best',
    icon: <Star className="w-4 h-4 md:w-5 md:h-5" />,
    description: 'Balanced score based on price, duration, and convenience'
  },
  {
    value: 'cheapest',
    label: 'Cheapest',
    icon: <ArrowDownAZ className="w-4 h-4 md:w-5 md:h-5" />,
    description: 'Lowest price first'
  },
  {
    value: 'fastest',
    label: 'Fastest',
    icon: <Clock className="w-4 h-4 md:w-5 md:h-5" />,
    description: 'Shortest duration first'
  }
];

export function SortingOptions({ value, onChange }: SortingOptionsProps) {
  return (
    <div className="bg-white shadow-sm border border-gray-100">
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        {SORT_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            title={option.description}
            className={`
              flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-6 py-2.5 md:py-3
              font-medium text-sm md:text-base transition-all duration-200
              ${value === option.value
                ? 'bg-blue-600 text-white shadow-sm transform scale-[1.02]'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }
            `}
          >
            {option.icon}
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}