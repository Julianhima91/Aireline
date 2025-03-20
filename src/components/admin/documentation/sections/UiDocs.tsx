import React from 'react';
import { Layout, Search, Filter, List } from 'lucide-react';

const UI_COMPONENTS = [
  {
    title: 'Search Module',
    icon: Search,
    description: 'Main search interface with location and date selection',
    features: [
      'City autocomplete with airport codes',
      'Date picker with price calendar',
      'Passenger selection dropdown',
      'Trip type toggle'
    ]
  },
  {
    title: 'Filter Panel',
    icon: Filter,
    description: 'Comprehensive filtering options for search results',
    features: [
      'Stop count filter',
      'Time range selection',
      'Airline filter',
      'Price range slider'
    ]
  },
  {
    title: 'Flight Cards',
    icon: List,
    description: 'Displays flight information in an easy-to-read format',
    features: [
      'Flight times and duration',
      'Airline information',
      'Stop details',
      'Price breakdown'
    ]
  },
  {
    title: 'Layout Components',
    icon: Layout,
    description: 'Core layout components used throughout the application',
    features: [
      'Responsive navigation',
      'Modal dialogs',
      'Loading states',
      'Error boundaries'
    ]
  }
];

export function UiDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">UI Components</h3>
        <p className="text-gray-600">
          The application uses a component-based architecture with Tailwind CSS for styling.
          Below are the main UI components and their features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {UI_COMPONENTS.map((component, index) => {
          const Icon = component.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{component.title}</h4>
              </div>
              <p className="text-gray-600 mb-4">{component.description}</p>
              <div className="space-y-2">
                {component.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Design System */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Design System</h4>
        
        {/* Colors */}
        <div className="mb-8">
          <h5 className="font-medium text-gray-800 mb-4">Color Palette</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-12 bg-blue-600 rounded-lg"></div>
              <p className="text-sm text-gray-600">Primary Blue</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 bg-gray-100 rounded-lg"></div>
              <p className="text-sm text-gray-600">Background Gray</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 bg-green-500 rounded-lg"></div>
              <p className="text-sm text-gray-600">Success Green</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 bg-red-600 rounded-lg"></div>
              <p className="text-sm text-gray-600">Error Red</p>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="mb-8">
          <h5 className="font-medium text-gray-800 mb-4">Typography</h5>
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Heading 1</h1>
              <p className="text-sm text-gray-500">2xl / Bold / Gray-900</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Heading 2</h2>
              <p className="text-sm text-gray-500">xl / Semibold / Gray-800</p>
            </div>
            <div>
              <p className="text-base text-gray-600">Body Text</p>
              <p className="text-sm text-gray-500">base / Regular / Gray-600</p>
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div>
          <h5 className="font-medium text-gray-800 mb-4">Spacing System</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-4 bg-blue-200 rounded"></div>
              <p className="text-sm text-gray-600">4 - Tight</p>
            </div>
            <div className="space-y-2">
              <div className="h-6 w-6 bg-blue-200 rounded"></div>
              <p className="text-sm text-gray-600">6 - Default</p>
            </div>
            <div className="space-y-2">
              <div className="h-8 w-8 bg-blue-200 rounded"></div>
              <p className="text-sm text-gray-600">8 - Relaxed</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-12 bg-blue-200 rounded"></div>
              <p className="text-sm text-gray-600">12 - Loose</p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Behavior */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Responsive Design</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Mobile First</h5>
            <p className="text-sm text-gray-600">
              All components are designed with a mobile-first approach, using Tailwind's responsive prefixes (sm:, md:, lg:) to enhance layouts at larger breakpoints.
            </p>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Breakpoints</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>sm: 640px - Tablet portrait</p>
              <p>md: 768px - Tablet landscape</p>
              <p>lg: 1024px - Desktop</p>
              <p>xl: 1280px - Large desktop</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Best Practices</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Component Guidelines</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                <span>Keep components focused and single-purpose</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                <span>Use TypeScript for prop type safety</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                <span>Implement error boundaries for stability</span>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Future Improvements</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                <span>Component testing with React Testing Library</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                <span>Storybook documentation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                <span>Accessibility improvements</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}