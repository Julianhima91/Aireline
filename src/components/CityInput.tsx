import React, { useState, useRef, useEffect } from 'react';
import { DivideIcon as LucideIcon, TrendingUp } from 'lucide-react';
import { City } from '../types/search';
import { searchAirports, getPopularAirports } from '../lib/airports';

interface CityInputProps {
  value: string;
  onChange: (city: City) => void;
  placeholder: string;
  icon: LucideIcon;
  label: string;
  otherAirport?: string;
  excludeCity?: City | null;
}

export function CityInput({
  value,
  onChange,
  placeholder,
  icon: Icon,
  label,
  otherAirport,
  excludeCity
}: CityInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPopularRoutes = async () => {
    if (!isSearching) {
      setLoading(true);
      try {
        let popularCities = await getPopularAirports(otherAirport);
        if (excludeCity) {
          popularCities = popularCities.filter(city => city.code !== excludeCity.code);
        }
        setCities(popularCities);
      } catch (err) {
        console.error('Error loading popular routes:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 2) {
        setLoading(true);
        setIsSearching(true);
        try {
          let results = await searchAirports(
            inputValue.includes('(')
              ? inputValue.slice(0, inputValue.indexOf('(') - 1)
              : inputValue,
            otherAirport
          );

          if (excludeCity) {
            results = results.filter(city => city.code !== excludeCity.code);
          }

          setCities(results);
          if (!inputValue.includes('(')) setIsOpen(true);
          else setIsOpen(false);
        } catch (err) {
          console.error('Error searching airports:', err);
          setCities([]);
        } finally {
          setLoading(false);
          setIsSearching(false);
        }
      } else if (inputValue.length === 0) {
        setIsSearching(false);
        loadPopularRoutes();
      } else {
        setCities([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, otherAirport]);

  const handleInputFocus = () => {
    if (inputValue.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(true);
      loadPopularRoutes();
    }
  };

  const handleCitySelect = (city: City) => {
    setInputValue(`${city.name}`);
    onChange(city);
    setIsOpen(false);
    setCities([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length < 2) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {isOpen && cities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {!isSearching && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>Destinacionet më të kërkuara</span>
              </div>
            </div>
          )}
          {cities.map((city) => (
            <button
              key={city.code}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
              onClick={() => handleCitySelect(city)}
            >
              <div>
                <span className="font-medium">{city.name}</span>
              </div>
              <span className="text-gray-400 text-sm">{city.country}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && !loading && cities.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Nuk u gjetën aeroporte
        </div>
      )}
    </div>
  );
}