import React, { useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { MobileDatePickerModal } from './MobileDatePickerModal';

interface DatePickersProps {
  tripType: 'roundTrip' | 'oneWay';
  departureDate: Date | null;
  returnDate: Date | null;
  onDepartureDateChange: (date: Date | null) => void;
  onReturnDateChange: (date: Date | null) => void;
  onTripTypeChange: (type: 'roundTrip' | 'oneWay') => void;
  fromCode?: string;
  toCode?: string;
}

export function DatePickers({
  tripType,
  departureDate,
  returnDate,
  onDepartureDateChange,
  onReturnDateChange,
  onTripTypeChange,
  fromCode,
  toCode
}: DatePickersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateClick = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleDateChange = useCallback((isReturn: boolean, date: Date | null) => {
    if (isReturn) {
      onReturnDateChange(date);
    } else {
      onDepartureDateChange(date);
    }
  }, [onDepartureDateChange, onReturnDateChange]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departure Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
            <button
              type="button"
              onClick={handleDateClick}
              className="w-full pl-10 pr-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {departureDate ? format(departureDate, 'dd MMM yyyy') : 'Select departure date'}
            </button>
          </div>
        </div>

        {tripType === 'roundTrip' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Return Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
              <button
                type="button"
                onClick={handleDateClick}
                className="w-full pl-10 pr-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {returnDate ? format(returnDate, 'dd MMM yyyy') : 'Select return date'}
              </button>
            </div>
          </div>
        )}
      </div>

      <MobileDatePickerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        tripType={tripType}
        departureDate={departureDate}
        returnDate={returnDate}
        onDepartureDateChange={handleDateChange}
        onReturnDateChange={handleDateChange}
        onTripTypeChange={onTripTypeChange}
        fromCode={fromCode}
        toCode={toCode}
      />
    </>
  );
}