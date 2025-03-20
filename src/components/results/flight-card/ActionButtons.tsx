import React from 'react';
import { FlightOption } from '../../../types/flight';
import { SearchParams } from '../../../types/search';
import { WhatsAppButton } from '../../common/WhatsAppButton';
import { CopyButton } from '../../common/CopyButton';

interface ActionButtonsProps {
  onViewDetails: () => void;
  flight: FlightOption;
  searchParams: SearchParams;
  batchId: string;
}

export function ActionButtons({ onViewDetails, flight, searchParams, batchId }: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <button 
        onClick={onViewDetails}
        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition duration-200"
      >
        View Details
      </button>
      <WhatsAppButton
        flight={flight}
        searchParams={searchParams}
        batchId={batchId}
      />
      <CopyButton
        flight={flight}
        searchParams={searchParams}
        batchId={batchId}
      />
    </div>
  );
}