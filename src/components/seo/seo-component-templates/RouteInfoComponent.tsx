import React from 'react';
import { Plane, Clock, CheckCircle, XCircle } from 'lucide-react';

interface RouteInfoProps {
  fromCity: string;
  toCity: string;
  airlines: string[];
  duration: string;

  isDirect: boolean;
  title?: string;
  className?: string;
}

export function RouteInfoComponent({
  fromCity,
  toCity,
  airlines,
  duration,
  isDirect,
  title,
  className = ''
}: RouteInfoProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl ${className}`}>
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100/50">
        <h3 className="text-xl font-semibold text-[#2D3748]">
          Informacion per fluturimin {title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Airlines Section */}
            <div>
              <h4 className="text-sm font-medium text-[#4A5568] mb-4">
                Kompanite Ajrore
              </h4>
              <div className="space-y-3">
                {airlines.map((airline, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-gray-50 p-4 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Plane className="w-5 h-5 text-[#3182CE] mr-3" />
                    <span className="text-[#2D3748] font-medium">{airline}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration Section */}
            <div>
              <h4 className="text-sm font-medium text-[#4A5568] mb-4">
                Kohezgjatja e Fluturimit
              </h4>
              <div className="flex items-center bg-gray-50 p-4 rounded-xl">
                <Clock className="w-5 h-5 text-[#3182CE] mr-3" />
                <span className="text-[#2D3748] font-medium">{duration}</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Flight Type Section */}
            <div>
              <h4 className="text-sm font-medium text-[#4A5568] mb-4">
                Lloji i Fluturimit
              </h4>
              <div className={`flex items-center p-6 rounded-xl ${
                isDirect ? 'bg-green-50' : 'bg-amber-50'
              }`}>
                <div className="p-3 bg-white rounded-lg shadow-sm mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">
                    Fluturim Direkt ose me ndalese
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Merrni ofertat me te mira duke kontaktuar tani.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info Box */}
            <div className="mt-8 bg-blue-50 rounded-xl p-6">
              <h4 className="font-medium text-[#2D3748] mb-4">
                Informacion i Rendesishëm
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center text-[#4A5568]">
                  <span className="w-1.5 h-1.5 bg-[#3182CE] rounded-full mr-3" />
                  Çmimet mund te ndryshojne bazuar në daten e zgjedhur
                </li>
                <li className="flex items-center text-[#4A5568]">
                  <span className="w-1.5 h-1.5 bg-[#3182CE] rounded-full mr-3" />
                  Disponueshmeria varet nga sezoni
                </li>
                <li className="flex items-center text-[#4A5568]">
                  <span className="w-1.5 h-1.5 bg-[#3182CE] rounded-full mr-3" />
                  Rekomandohet rezervimi i hershem
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}