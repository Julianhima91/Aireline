import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';

export function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/home')}
            className="flex justify-center items-center"
          >
            <img 
              alt="logo" 
              src="https://himatravel.com/wp-content/uploads/2020/11/logo-768x277.png" 
              className="h-10 w-auto object-contain"
            />
          </button>

          {/* Call Now Button */}
          <a
            href="tel:+3550695161381"
            className="group flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-green-600 to-green-500 
              text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-300
              transform hover:scale-[1.02] hover:shadow-md active:scale-[0.98] active:shadow-sm"
          >
            {/* Phone Icon with Ring Animation */}
            <div className="relative">
              <Phone className="w-4 h-4" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-white"></div>
            </div>

            {/* Phone Number */}
            <span className="font-medium tracking-wide group-hover:tracking-wider transition-all duration-300 text-sm">
              +355 069 516 1381
            </span>
          </a>
        </div>
      </div>
    </nav>
  );
}