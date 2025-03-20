import React from 'react';
import { Search, Filter, Clock, Star, Users, Settings } from 'lucide-react';

const MODULES = [
  {
    title: 'Core Search',
    icon: Search,
    features: [
      'Location selection with autocomplete',
      'Date picker with price calendar',
      'Passenger management',
      'Trip type selection'
    ]
  },
  {
    title: 'Results Display',
    icon: Filter,
    features: [
      'Progressive loading',
      'Detailed flight cards',
      'Interactive modals',
      'Price breakdown'
    ]
  },
  {
    title: 'Filtering System',
    icon: Clock,
    features: [
      'Stop count filtering',
      'Time range selection',
      'Airline filtering',
      'Price range filtering'
    ]
  },
  {
    title: 'Sorting Module',
    icon: Star,
    features: [
      'Best (custom scoring)',
      'Cheapest (price-based)',
      'Fastest (duration-based)'
    ]
  },
  {
    title: 'Admin Panel',
    icon: Settings,
    features: [
      'Search monitoring',
      'User management',
      'System settings',
      'Route tracking'
    ]
  },
  {
    title: 'Agent Tools',
    icon: Users,
    features: [
      'Commission tracking',
      'Booking tools',
      'Route analysis',
      'Performance metrics'
    ]
  }
];

export function ModuleOverview() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">System Overview</h3>
        <p className="text-gray-600 mb-4">
          The flight search and booking system is built with a modular architecture,
          focusing on performance, scalability, and user experience. Each module is
          designed to handle specific functionality while maintaining loose coupling
          with other components.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map((module, index) => {
          const Icon = module.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{module.title}</h4>
              </div>
              <ul className="space-y-2">
                {module.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}