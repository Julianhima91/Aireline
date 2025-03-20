import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Plane, Calendar, Filter } from 'lucide-react';
import { SearchParams } from '../../types/search';
import { SearchModal } from './SearchModal';
import { parseISODate } from '../../utils/format';

interface SearchHeaderProps {
  searchParams: SearchParams;
  onBack: () => void;
  onSearch: (params: SearchParams) => void;
  onToggleFilters?: () => void;
}

export function SearchHeader({ searchParams, onBack, onSearch, onToggleFilters }: SearchHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Calculate total passengers from searchParams
  const totalPassengers = React.useMemo(() => {
    const { adults = 0, children = 0, infantsInSeat = 0, infantsOnLap = 0 } = searchParams.passengers;
    return adults + children + infantsInSeat + infantsOnLap;
  }, [searchParams.passengers]);

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      // Only hide header after scrolling down at least 100px
      if (currentScrollY > 100) {
        setIsVisible(currentScrollY < lastScrollY);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          controlHeader();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastScrollY]);

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  // Parse dates correctly to preserve the selected day
  const departureDate = searchParams.departureDate ? parseISODate(searchParams.departureDate) : null;
  const returnDate = searchParams.returnDate ? parseISODate(searchParams.returnDate) : null;

  return (
    <>
      <div 
        className={`
          bg-white shadow-sm sticky top-0 z-20
          transform transition-transform duration-300 ease-in-out
          md:transform-none
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        `}
      >
        <div className="container mx-auto">
          {/* Back Button */}
          <div className="px-4 py-3 border-b border-gray-100">
            <button
              onClick={onBack}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Search
            </button>
          </div>

          {/* Flight Info */}
          <div className="px-4 py-4 md:py-6">
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex">
                {/* Left Column: Flight Info */}
                <div 
                  className="flex-1 pr-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                  onClick={handleEditClick}
                >
                  {/* Route */}
                  <div className="flex items-center mb-2">
                    <div className="text-xl font-bold text-gray-900">{searchParams.fromCode}</div>
                    <Plane className="w-4 h-4 mx-2 text-blue-600" />
                    <div className="text-xl font-bold text-gray-900">{searchParams.toCode}</div>
                  </div>

                  {/* Dates - Stacked */}
                  <div className="flex flex-col gap-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {departureDate ? format(departureDate, 'EEE, d MMM') : 'Select date'}
                    </div>
                    {searchParams.tripType === 'roundTrip' && returnDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {format(returnDate, 'EEE, d MMM')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-gray-200 mx-4" />

                {/* Right Column: Filter Button */}
                <button
                  onClick={onToggleFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 
                    rounded-lg font-medium transition-colors shadow-sm hover:shadow"
                >
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
              <div 
                className="flex items-center justify-between gap-4 mb-4 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors"
                onClick={handleEditClick}
              >
                {/* Route */}
                <div className="flex items-center">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold text-gray-900">{searchParams.fromCode}</div>
                    <Plane className="w-5 h-5 mx-3 text-blue-600" />
                    <div className="text-2xl font-bold text-gray-900">{searchParams.toCode}</div>
                  </div>
                  <div className="h-8 w-px bg-gray-200 mx-4" />
                  <div className="text-gray-500">
                    {searchParams.fromLocation} to {searchParams.toLocation}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>
                    {departureDate ? format(departureDate, 'EEE, d MMM yyyy') : ''}
                    {searchParams.tripType === 'roundTrip' && returnDate && (
                      <>
                        <span className="mx-2">→</span>
                        {format(returnDate, 'EEE, d MMM yyyy')}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Flight Details */}
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {getTravelClassName(searchParams.travelClass)}
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {totalPassengers} Passenger{totalPassengers > 1 ? 's' : ''}
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  {getStopsText(searchParams.stops)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        searchParams={searchParams}
        onSearch={onSearch}
      />
    </>
  );
}

function getTravelClassName(classCode: string) {
  switch (classCode) {
    case '1': return 'Economy';
    case '2': return 'Premium Economy';
    case '3': return 'Business';
    case '4': return 'First';
    default: return 'Economy';
  }
}

function getStopsText(stopsCode: string) {
  switch (stopsCode) {
    case '0': return 'Any stops';
    case '1': return 'Nonstop only';
    case '2': return '1 stop or fewer';
    case '3': return '2 stops or fewer';
    default: return 'Any stops';
  }
}