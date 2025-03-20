import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Plus, Minus } from 'lucide-react';

interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

interface PassengerSelectorProps {
  passengers: PassengerCounts;
  onChange: (passengers: PassengerCounts) => void;
}

export function PassengerSelector({ passengers, onChange }: PassengerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTotalPassengers = () => {
    // Ensure all values are valid numbers
    const adults = Number(passengers.adults) || 0;
    const children = Number(passengers.children) || 0;
    const infants = Number(passengers.infants) || 0;
    return adults + children + infants;
  };

  const updatePassengers = (type: keyof PassengerCounts, delta: number) => {
    const newValue = Math.max(0, (Number(passengers[type]) || 0) + delta);
    
    // Ensure at least one adult
    if (type === 'adults' && newValue === 0) return;

    onChange({
      ...passengers,
      [type]: newValue
    });
  };

  const PassengerTypeControl = ({ 
    type, 
    label, 
    value, 
    minValue = 0 
  }: { 
    type: keyof PassengerCounts; 
    label: string; 
    value: number;
    minValue?: number;
  }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => updatePassengers(type, -1)}
          disabled={value <= minValue}
          className={`p-1 rounded-full ${
            value <= minValue
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-4 text-center text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => updatePassengers(type, 1)}
          className="p-1 rounded-full text-gray-600 hover:bg-gray-100"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
      >
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{getTotalPassengers()}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <PassengerTypeControl
            type="adults"
            label="Adults"
            value={Number(passengers.adults) || 0}
            minValue={1}
          />
          <PassengerTypeControl
            type="children"
            label="Children (2-11)"
            value={Number(passengers.children) || 0}
          />
          <PassengerTypeControl
            type="infants"
            label="Infants (0-2)"
            value={Number(passengers.infants) || 0}
          />
        </div>
      )}
    </div>
  );
}