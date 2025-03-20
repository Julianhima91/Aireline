import React from 'react';
import { Plane, Hotel, ArrowRight } from 'lucide-react';

export function AdSidebar() {
  return (
    <div className="hidden lg:block w-64 bg-white rounded-lg shadow-sm p-6 h-fit sticky top-24">
      <div className="text-center">
        {/* HimaTrips Logo */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            <span className="text-red-600">Hima</span>
            <span className="text-blue-600">Trips</span>
            <span className="text-red-600">.com</span>
          </h2>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Plane className="w-6 h-6 text-red-600" />
          <span className="text-xl font-bold">+</span>
          <Hotel className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Bileta + Hotel</h3>
        <p className="text-sm text-gray-600 mb-6">
          Kap Ofertat me te mira sot!
        </p>
        
        {/* Price Example */}
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">Duke nisur nga</div>
          <div className="text-2xl font-bold text-red-600 mb-1">40%</div>
          <div className="text-xs text-gray-500">Zbritje ne Rezervime te hershme</div>
        </div>

        {/* Features */}
        <div className="space-y-3 text-left mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <ArrowRight className="w-4 h-4 text-blue-600" />
            Cmimet me te mira
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <ArrowRight className="w-4 h-4 text-blue-600" />
           Online 24/7
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <ArrowRight className="w-4 h-4 text-blue-600" />
            Garancia qe kerkoni
          </div>
        </div>

        {/* CTA Button */}
        <a 
          href="https://himatrips.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Perfito Tani
        </a>
      </div>
    </div>
  );
}