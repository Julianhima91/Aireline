import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { FlightOption } from '../../../types/flight';
import { StopsFilter } from './StopsFilter';
import { TimeRangeFilter } from './TimeRangeFilter';
import { AirlineFilter } from './AirlineFilter';
import { PriceFilter } from './PriceFilter';

export interface FilterState {
  stops: string[];
  departureTime: string[];
  returnTime: string[];
  airlines: string[];
  priceRange: {
    min: number;
    max: number;
  };
}

interface FlightFilterPanelProps {
  flights: FlightOption[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  isRoundTrip: boolean;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface FilterSection {
  id: string;
  title: string;
  component: React.ReactNode;
  defaultExpanded?: boolean;
}

export function FlightFilterPanel({ 
  flights, 
  filters, 
  onFilterChange,
  isRoundTrip,
  className = '',
  isOpen = false,
  onClose
}: FlightFilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['stops', 'price']));

  // Get unique airlines from flights
  const airlines = React.useMemo(() => {
    const uniqueAirlines = new Set<string>();
    flights.forEach(flight => {
      flight.flights.forEach(segment => {
        uniqueAirlines.add(segment.airline);
      });
    });
    return Array.from(uniqueAirlines).sort();
  }, [flights]);

  // Get price range from flights
  const priceRange = React.useMemo(() => {
    if (!flights.length) return { min: 0, max: 1000 };
    const prices = flights.map(f => f.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [flights]);

  const handleReset = () => {
    onFilterChange({
      stops: [],
      departureTime: [],
      returnTime: [],
      airlines: [],
      priceRange: {
        min: priceRange.min,
        max: priceRange.max
      }
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const filterSections: FilterSection[] = [
    {
      id: 'stops',
      title: 'Stops',
      component: (
        <StopsFilter
          selectedStops={filters.stops}
          onChange={(stops) => onFilterChange({ ...filters, stops })}
          isRoundTrip={isRoundTrip}
        />
      ),
      defaultExpanded: true
    },
    {
      id: 'departure',
      title: 'Departure Time',
      component: (
        <TimeRangeFilter
          title="Departure Time"
          selectedRanges={filters.departureTime}
          onChange={(ranges) => onFilterChange({ ...filters, departureTime: ranges })}
        />
      )
    },
    ...(isRoundTrip ? [{
      id: 'return',
      title: 'Return Time',
      component: (
        <TimeRangeFilter
          title="Return Time"
          selectedRanges={filters.returnTime}
          onChange={(ranges) => onFilterChange({ ...filters, returnTime: ranges })}
        />
      )
    }] : []),
    {
      id: 'airlines',
      title: 'Airlines',
      component: (
        <AirlineFilter
          airlines={airlines}
          selectedAirlines={filters.airlines}
          onChange={(airlines) => onFilterChange({ ...filters, airlines })}
        />
      )
    },
    {
      id: 'price',
      title: 'Price Range',
      component: (
        <PriceFilter
          range={filters.priceRange}
          min={priceRange.min}
          max={priceRange.max}
          onChange={(range) => onFilterChange({ ...filters, priceRange: range })}
        />
      ),
      defaultExpanded: true
    }
  ];

  const hasActiveFilters = 
    filters.stops.length > 0 ||
    filters.departureTime.length > 0 ||
    filters.returnTime.length > 0 ||
    filters.airlines.length > 0 ||
    filters.priceRange.min > priceRange.min ||
    filters.priceRange.max < priceRange.max;

  return (
    <>
      {/* Mobile Filter Panel */}
      <div 
        className={`
          fixed lg:relative inset-0 lg:inset-auto z-30 lg:z-auto
          bg-white lg:bg-transparent
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${className}
        `}
      >
        <div className="h-full lg:h-auto overflow-y-auto lg:overflow-visible p-6 lg:p-0">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Reset Filters */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Filter Sections */}
            <div className="space-y-4">
              {filterSections.map(section => (
                <div
                  key={section.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedSections.has(section.id) && (
                    <div className="p-4 border-t border-gray-100">
                      {section.component}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}