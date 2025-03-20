import React from 'react';
import { Calendar, Plane, ArrowRight } from 'lucide-react';
import { format, parse } from 'date-fns';
import { supabase } from '../../../lib/supabase';

interface Price {
  airline: string;
  date: string;
  price: number;
}

interface MonthlyPrice {
  month: string;
  airline: string;
  date: string;
  price: number;
}

interface PricingTableProps {
  fromCity: string;
  toCity: string;
  prices: Price[];
  title?: string;
  className?: string;
}

export function PricingTableComponent({ fromCity, toCity, prices, title, className = '' }: PricingTableProps) {
  // Group prices by month and find lowest price for each month
  const monthlyPrices = React.useMemo(() => {
    const pricesByMonth = prices.reduce((acc, price) => {
      const month = format(new Date(price.date), 'yyyy-MM');
      if (!acc[month] || price.price < acc[month].price) {
        acc[month] = {
          month,
          airline: price.airline,
          date: price.date,
          price: price.price
        };
      }
      return acc;
    }, {} as Record<string, MonthlyPrice>);

    // Convert to array and sort by date
    return Object.values(pricesByMonth)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4); // Limit to 4 months
  }, [prices]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const generateWhatsAppMessage = (price: MonthlyPrice) => {
    const message = [
      'Pershendetje, Me intereson te di per bileta avioni',
      '',
      `${title}`,
      `Data: ${formatDate(price.date)}`,
      `Cmimi: ${price.price}€`,
    ].join('\n');

    return encodeURIComponent(message);
  };

  const handleBooking = (price: MonthlyPrice) => {
    const message = generateWhatsAppMessage(price);
    window.open(`https://api.whatsapp.com/send/?phone=355695161381&text=${message}`, '_blank');
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <h3 className="text-xl font-semibold text-[#2D3748]">
          Biletat me te lira {title}
        </h3>
        <p className="text-[#4A5568] mt-2">
          Çmimet dhe disponueshmeria mund te ndryshojne
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-8 py-4 text-left text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Linjat
              </th>
              <th className="px-8 py-4 text-left text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Data
              </th>
              <th className="px-8 py-4 text-left text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Cmimi
              </th>
              <th className="px-8 py-4 text-right text-sm font-medium text-[#4A5568] uppercase tracking-wider">
                Kontakto
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthlyPrices.map((price, index) => (
              <tr key={index} className="group hover:bg-blue-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <Plane className="w-5 h-5 text-[#3182CE] mr-3" />
                    <span className="text-[#2D3748] font-medium">{price.airline}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center text-[#4A5568]">
                    <Calendar className="w-4 h-4 mr-2 text-[#4A5568]" />
                    {formatDate(price.date)}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-lg font-semibold text-[#2D3748]">
                    {price.price}€
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    onClick={() => handleBooking(price)}
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium group-hover:shadow-md"
                  >
                    Kontakto Tani
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-100">
        {monthlyPrices.map((price, index) => (
          <div key={index} className="p-6 hover:bg-blue-50/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <Plane className="w-5 h-5 text-[#3182CE] mr-2" />
                <span className="text-[#2D3748] font-medium">
                  {price.airline}
                </span>
              </div>
              <span className="text-xl font-bold text-[#3182CE]">
                {price.price}€
              </span>
            </div>
            <div className="flex items-center text-[#4A5568] text-sm mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(price.date)}
            </div>
            <button
              onClick={() => handleBooking(price)}
              className="w-full py-3 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
            >
              Kontakto Tani
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}