import React from 'react';
import { Plane, Hotel, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export function MobileAd() {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="lg:hidden bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      {/* Header - Always visible */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* HimaTrips Logo */}
          <h2 className="text-lg font-bold">
            <span className="text-red-600">Hima</span>
            <span className="text-blue-600">Trips</span>
          </h2>
          <div className="flex items-center">
            <Plane className="w-5 h-5 text-red-600" />
            <span className="mx-1 text-xl">+</span>
            <Hotel className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="p-4 pt-0">
          <h3 className="font-semibold text-gray-900 mb-2">Bileta + Hotel</h3>
          <p className="text-sm text-gray-600 mb-4">Kap Ofertat me te mira sot!</p>

          {/* Price Example */}
          <div className="bg-red-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-600">Duke nisur nga</div>
            <div className="text-xl font-bold text-red-600">40%</div>
            <div className="text-xs text-gray-500">Zbritje ne Rezervime te hershme</div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <ArrowRight className="w-4 h-4 text-blue-600" />
              Cmimet me te mira
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <ArrowRight className="w-4 h-4 text-blue-600" />
               Online 24/7
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <ArrowRight className="w-4 h-4 text-blue-600" />
             Garancia qe kerkoni
            </div>
          </div>

          {/* CTA Button */}
          <a 
            href="https://himatrips.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold text-center hover:bg-red-700 transition-colors"
          >
             Perfito Tani
          </a>
        </div>
      )}
    </div>
  );
}