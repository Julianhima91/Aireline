import React from 'react';
import { MapPin, Plane } from 'lucide-react';
import { CityInput } from '../CityInput';
import { City } from '../../types/search';

interface LocationInputsProps {
  fromCity: City | null;
  setFromCity: (city: City | null) => void;
  toCity: City | null;
  setToCity: (city: City | null) => void;
}

export function LocationInputs({
  fromCity,
  setFromCity,
  toCity,
  setToCity
}: LocationInputsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CityInput
        value={fromCity?.name || ''}
        onChange={(city) => {
          setFromCity(city);
          // Ensure the same city is removed from destination
          if (toCity?.code === city.code) {
            setToCity(null);
          }
        }}
        placeholder="From where?"
        icon={MapPin}
        label="From"
      />
      <CityInput
        value={toCity?.name || ''}
        onChange={(city) => setToCity(city)}
        placeholder="Where to?"
        icon={Plane}
        label="To"
        excludeCity={fromCity} // Pass the selected departure city for filtering
      />
    </div>
  );
}
