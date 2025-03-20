import React from 'react';
import { MessageCircle } from 'lucide-react';
import { FlightOption } from '../../types/flight';
import { SearchParams } from '../../types/search';
import { formatFlightMessage } from '../../utils/formatFlightMessage';

interface WhatsAppButtonProps {
  flight: FlightOption;
  searchParams: SearchParams;
  batchId: string;
  className?: string;
}

export function WhatsAppButton({ flight, searchParams, batchId, className = '' }: WhatsAppButtonProps) {
  const WHATSAPP_PHONE = '355695161381';

  const handleClick = async () => {
    try {
      const message = await formatFlightMessage(flight, searchParams, batchId);
      const whatsappUrl = `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('Error generating WhatsApp message:', err);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition duration-200 ${className}`}
    >
      <MessageCircle className="w-5 h-5 mr-2" />
      Kontakto Tani
    </button>
  );
}