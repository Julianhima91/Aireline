import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Loader2, Edit2 } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, isAfter } from 'date-fns';
import { getCalendarPrices } from '../../lib/calendarPrices';
import {createPortal} from 'react-dom';

interface MobileDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripType: 'roundTrip' | 'oneWay';
  departureDate: Date | null;
  returnDate: Date | null;
  onDepartureDateChange: (isReturn: boolean, date: Date | null) => void;
  onReturnDateChange: (isReturn: boolean, date: Date | null) => void;
  onTripTypeChange: (type: 'roundTrip' | 'oneWay') => void;
  fromCode?: string;
  toCode?: string;
}

interface CalendarPrice {
  price: number;
  isDirect: boolean;
}

export function MobileDatePickerModal({
  isOpen,
  onClose,
  tripType,
  departureDate,
  returnDate,
  onDepartureDateChange,
  onReturnDateChange,
  onTripTypeChange,
  fromCode,
  toCode
}: MobileDatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingReturn, setSelectingReturn] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [departurePrices, setDeparturePrices] = useState<Record<string, CalendarPrice>>({});
  const [returnPrices, setReturnPrices] = useState<Record<string, CalendarPrice>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setSelectingReturn(tripType === 'roundTrip' && departureDate !== null && returnDate === null);
      setCurrentMonth(departureDate || returnDate || new Date());
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, departureDate, returnDate, tripType]);

  // Fetch prices when month or trip type changes
  useEffect(() => {
    const fetchPrices = async () => {
      if (!fromCode || !toCode || !isOpen) return;

      setLoadingPrices(true);
      setPriceError(null);

      try {
        const yearMonth = format(currentMonth, 'yyyy-MM');
        
        // Fetch both departure and return prices
        const [departureData, returnData] = await Promise.all([
          getCalendarPrices(fromCode, toCode, yearMonth, tripType, false),
          tripType === 'roundTrip' 
            ? getCalendarPrices(toCode, fromCode, yearMonth, tripType, true)
            : null
        ]);

        if (departureData) {
          setDeparturePrices(departureData.priceGrid);
        }

        if (returnData) {
          setReturnPrices(returnData.priceGrid);
        }
      } catch (err) {
        console.error('Error fetching prices:', err);
        setPriceError('Failed to load prices');
      } finally {
        setLoadingPrices(false);
      }
    };

    if (isOpen && fromCode && toCode) {
      fetchPrices();
    }
  }, [currentMonth, fromCode, toCode, isOpen, tripType]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    const timer = setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  const handleDateSelect = (date: Date) => {
    if (isBefore(date, new Date()) || isAfter(date, addMonths(new Date(), 12))) return;

    if (!selectingReturn) {
      // Selecting departure date
      onDepartureDateChange(false, date);
      // Clear return date if it's before the new departure date
      if (returnDate && isBefore(returnDate, date)) {
        onReturnDateChange(true, null);
      }
      // Only switch to return selection if we don't have a return date yet
      if (!returnDate) {
        setSelectingReturn(true);
        setCurrentMonth(date);
      }
    } else {
      // Selecting return date - don't close modal automatically
      if (!departureDate || !isBefore(date, departureDate)) {
        onReturnDateChange(true, date);
      }
    }
  };

  const handleTripTypeChange = (type: 'roundTrip' | 'oneWay') => {
    onTripTypeChange(type);
    if (type === 'oneWay') {
      onReturnDateChange(true, null);
      setSelectingReturn(false);
    } else {
      // When switching to round trip, go to return selection if departure is set and return isn't
      setSelectingReturn(departureDate !== null && returnDate === null);
    }
  };

  const handleDateHeaderClick = (isReturn: boolean) => {
    if (tripType === 'roundTrip') {
      setSelectingReturn(isReturn);
      setCurrentMonth(isReturn ? (returnDate || departureDate || new Date()) : (departureDate || new Date()));
    }
  };

  const getPrice = (date: string): CalendarPrice | undefined => {
    return selectingReturn ? returnPrices[date] : departurePrices[date];
  };

  const getTotalPrice = () => {
    let total = 0;

    if (departureDate) {
      const departureDateStr = format(departureDate, 'yyyy-MM-dd');
      total += departurePrices[departureDateStr]?.price || 0;
    }

    if (tripType === 'roundTrip' && returnDate) {
      const returnDateStr = format(returnDate, 'yyyy-MM-dd');
      total += returnPrices[returnDateStr]?.price || 0;
    }

    return total || null;
  };

  const getCurrentPrice = () => {
    if (selectingReturn && returnDate) {
      const returnDateStr = format(returnDate, 'yyyy-MM-dd');
      return returnPrices[returnDateStr]?.price || null;
    } else if (!selectingReturn && departureDate) {
      const departureDateStr = format(departureDate, 'yyyy-MM-dd');
      return departurePrices[departureDateStr]?.price || null;
    }
    return null;
  };

  const handleClearDates = () => {
    onDepartureDateChange(false, null);
    onReturnDateChange(true, null);
    // When clearing dates, always go back to departure selection
    setSelectingReturn(false);
  };

  if (!isOpen) return null;

  const renderCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const emptyCells = Array(start.getDay()).fill(null);

    return (
      <>
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="h-10 md:h-14" />
        ))}
        {days.map((date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const priceData = getPrice(dateStr);
          const isSelectedDeparture = departureDate && isSameDay(date, departureDate);
          const isSelectedReturn = returnDate && isSameDay(date, returnDate);
          const isSelected = selectingReturn ? isSelectedReturn : isSelectedDeparture;
          
          const isDisabled = isBefore(date, new Date()) || 
                           isAfter(date, addMonths(new Date(), 12)) ||
                           (selectingReturn && departureDate && isBefore(date, departureDate));

          const isInRange = departureDate && returnDate &&
                          isAfter(date, departureDate) &&
                          isBefore(date, returnDate);

          return (
            <button
              key={dateStr}
              onClick={() => !isDisabled && handleDateSelect(date)}
              disabled={isDisabled}
              className={`
                relative h-10 md:h-14 rounded-lg transition-all duration-200
                ${isDisabled ? 'text-gray-300 cursor-not-allowed' :
                  isSelectedDeparture ? 'bg-blue-600 text-white shadow-md scale-105' :
                  isSelectedReturn ? 'bg-blue-600 text-white shadow-md scale-105' :
                  isInRange ? 'bg-blue-50' : 'hover:bg-gray-50 active:scale-95'}
              `}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-sm ${isToday(date) ? 'font-bold' : ''}`}>
                  {format(date, 'd')}
                </span>
                {loadingPrices ? (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                ) : priceData ? (
                  <div className='flex items-center'>
                    <div className={`w-2 h-2 rounded-full absolute left-[4.5px] bottom-4 sm:left-4 sm:bottom-4 md:left-4 md:bottom-6 mt-0.5 ${priceData.isDirect ? 'bg-green-500' : 'bg-orange-500'
                      }`} />
                    <div className="flex flex-col items-center">
                      <span className={`text-xs ${isSelected ? 'text-blue-100' :
                        isDisabled ? 'text-gray-300' : 'text-blue-600'
                        }`}>
                        {priceData.price}€
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">--</span>
                )}
              </div>
            </button>
          );
        })}
      </>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 modal-backdrop ${isClosing ? 'closing' : ''}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className={`
          relative w-full md:w-auto md:min-w-[600px] bg-white rounded-t-2xl md:rounded-xl shadow-xl
          flex flex-col h-[85vh] md:h-auto md:max-h-[85vh]
          modal-content ${isClosing ? 'closing' : ''}
        `}
      >
        {/* Header - Fixed */}
        <div className="flex-none px-4 pt-4 pb-2 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handleClose}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => handleTripTypeChange('roundTrip')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  tripType === 'roundTrip'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Round Trip
              </button>
              <button
                onClick={() => handleTripTypeChange('oneWay')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  tripType === 'oneWay'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                One Way
              </button>
            </div>
          </div>

          {/* Selected Dates */}
          <div className="space-y-2">
            <div 
              onClick={() => handleDateHeaderClick(false)}
              className={`w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg cursor-pointer ${!selectingReturn && 'ring-2 ring-blue-500'}`}
            >
              <div>
                <div className="text-sm text-gray-500">Departure date</div>
                <div className="font-medium flex items-center">
                  {departureDate ? format(departureDate, 'dd MMM yyyy') : 'Select date'}
                  <Edit2 className="w-4 h-4 ml-2 text-blue-600" />
                </div>
              </div>
              {departureDate && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearDates();
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </div>
              )}
            </div>
            {tripType === 'roundTrip' && (
              <div
                onClick={() => handleDateHeaderClick(true)}
                className={`w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg cursor-pointer ${selectingReturn && 'ring-2 ring-blue-500'}`}
              >
                <div>
                  <div className="text-sm text-gray-500">Return date</div>
                  <div className="font-medium flex items-center">
                    {returnDate ? format(returnDate, 'dd MMM yyyy') : 'Select date'}
                    <Edit2 className="w-4 h-4 ml-2 text-blue-600" />
                  </div>
                </div>
                {returnDate && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onReturnDateChange(true, null);
                      setSelectingReturn(true);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Calendar - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              disabled={isBefore(startOfMonth(currentMonth), startOfMonth(new Date()))}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              disabled={isAfter(startOfMonth(currentMonth), startOfMonth(addMonths(new Date(), 11)))}
              className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Direct Flight</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>With Stops</span>
            </div>
          </div>

          {priceError && (
            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
              {priceError}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex-none border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500">
                {tripType === 'roundTrip' && returnDate 
                  ? 'Total price' 
                  : selectingReturn 
                    ? 'Return flight'
                    : 'Departure flight'}
              </div>
              <div className="text-sm text-gray-500">price/person</div>
            </div>
            <div className="text-xl font-bold text-blue-600">
              {loadingPrices ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                selectingReturn ? (
                  getCurrentPrice() ? `${getCurrentPrice()}€` : '--'
                ) : (
                  getTotalPrice() ? `${getTotalPrice()}€` : '--'
                )
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

