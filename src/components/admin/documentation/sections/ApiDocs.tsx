import React from 'react';
import { Code, ArrowRight, Shield, Clock, RefreshCw } from 'lucide-react';

const API_ENDPOINTS = [
  {
    method: 'GET',
    path: '/flights/search-one-way',
    description: 'Search for one-way flights with real-time pricing',
    params: [
      { name: 'fromEntityId', type: 'string', required: true, description: 'Origin airport code (e.g., TIA)' },
      { name: 'toEntityId', type: 'string', required: true, description: 'Destination airport code (e.g., FCO)' },
      { name: 'departDate', type: 'string', required: true, description: 'Departure date (YYYY-MM-DD)' },
      { name: 'currency', type: 'string', required: true, description: 'Price currency (EUR)' },
      { name: 'stops', type: 'string', required: false, description: 'Stop preferences (direct,1stop,2stops)' },
      { name: 'adults', type: 'string', required: true, description: 'Number of adult passengers' },
      { name: 'children', type: 'string', required: false, description: 'Number of child passengers' },
      { name: 'infants', type: 'string', required: false, description: 'Number of infant passengers' },
      { name: 'cabinClass', type: 'string', required: false, description: 'Cabin class (economy, premium_economy, business, first)' }
    ]
  },
  {
    method: 'GET',
    path: '/flights/search-roundtrip',
    description: 'Search for round-trip flights with real-time pricing',
    params: [
      { name: 'fromEntityId', type: 'string', required: true, description: 'Origin airport code (e.g., TIA)' },
      { name: 'toEntityId', type: 'string', required: true, description: 'Destination airport code (e.g., FCO)' },
      { name: 'departDate', type: 'string', required: true, description: 'Departure date (YYYY-MM-DD)' },
      { name: 'returnDate', type: 'string', required: true, description: 'Return date (YYYY-MM-DD)' },
      { name: 'currency', type: 'string', required: true, description: 'Price currency (EUR)' },
      { name: 'stops', type: 'string', required: false, description: 'Stop preferences (direct,1stop,2stops)' },
      { name: 'adults', type: 'string', required: true, description: 'Number of adult passengers' },
      { name: 'children', type: 'string', required: false, description: 'Number of child passengers' },
      { name: 'infants', type: 'string', required: false, description: 'Number of infant passengers' },
      { name: 'cabinClass', type: 'string', required: false, description: 'Cabin class (economy, premium_economy, business, first)' }
    ]
  },
  {
    method: 'GET',
    path: '/flights/search-incomplete',
    description: 'Get partial search results for progressive loading',
    params: [
      { name: 'sessionId', type: 'string', required: true, description: 'Search session ID from initial search' },
      { name: 'currency', type: 'string', required: true, description: 'Price currency (EUR)' }
    ]
  },
  {
    method: 'GET',
    path: '/flights/price-calendar-web',
    description: 'Get monthly price calendar for a route',
    params: [
      { name: 'fromEntityId', type: 'string', required: true, description: 'Origin airport code' },
      { name: 'toEntityId', type: 'string', required: true, description: 'Destination airport code' },
      { name: 'yearMonth', type: 'string', required: true, description: 'Month to fetch (YYYY-MM)' }
    ]
  }
];

const FEATURES = [
  {
    title: 'Progressive Loading',
    description: 'Results are loaded incrementally for better user experience',
    details: [
      'Initial results returned quickly',
      'Background polling for additional results',
      'Real-time updates as new flights are found',
      'Configurable polling interval and timeout'
    ]
  },
  {
    title: 'Caching Strategy',
    description: 'Multi-level caching system for optimal performance',
    details: [
      'Route-based price caching',
      'Demand-based cache invalidation',
      'Configurable cache duration',
      'Fallback to cached results on API errors'
    ]
  },
  {
    title: 'Error Handling',
    description: 'Robust error handling and retry mechanisms',
    details: [
      'Automatic retries for transient errors',
      'Rate limit handling',
      'Graceful degradation',
      'Detailed error logging'
    ]
  }
];

export function ApiDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">API Integration</h3>
        <p className="text-gray-600 mb-4">
          The system integrates with the SkyScanner API for real-time flight searches,
          with additional caching and progressive loading features for optimal performance.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="flex items-center text-blue-800 font-medium mb-2">
            <Shield className="w-5 h-5 mr-2" />
            Authentication
          </h4>
          <p className="text-blue-700 mb-2">
            All API requests require authentication using RapidAPI headers:
          </p>
          <div className="bg-white rounded p-3 font-mono text-sm text-blue-800">
            <div>X-RapidAPI-Host: sky-scanner3.p.rapidapi.com</div>
            <div>X-RapidAPI-Key: [your-api-key]</div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {FEATURES.map((feature, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h4>
            <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
            <ul className="space-y-2">
              {feature.details.map((detail, idx) => (
                <li key={idx} className="flex items-center text-sm text-gray-600">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* API Endpoints */}
      <div className="space-y-6">
        <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          Endpoints
        </h4>
        
        {API_ENDPOINTS.map((endpoint, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-mono">
                  {endpoint.method}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-gray-700">{endpoint.path}</span>
              </div>
              <p className="text-gray-600 mt-2">{endpoint.description}</p>
            </div>
            
            <div className="p-6">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Parameters</h5>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm font-medium text-gray-500">
                      <th className="pb-3 pr-6">Parameter</th>
                      <th className="pb-3 pr-6">Type</th>
                      <th className="pb-3 pr-6">Required</th>
                      <th className="pb-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {endpoint.params.map((param, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="py-3 pr-6 font-mono text-gray-900">{param.name}</td>
                        <td className="py-3 pr-6 text-gray-600">{param.type}</td>
                        <td className="py-3 pr-6">
                          {param.required ? (
                            <span className="text-red-600">Required</span>
                          ) : (
                            <span className="text-gray-500">Optional</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-600">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Limiting */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="flex items-center text-yellow-800 font-medium mb-3">
          <Clock className="w-5 h-5 mr-2" />
          Rate Limiting
        </h4>
        <p className="text-yellow-700 mb-4">
          The API has rate limiting in place to ensure fair usage. When limits are reached:
        </p>
        <ul className="space-y-2">
          <li className="flex items-center text-yellow-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Automatic retry with exponential backoff
          </li>
          <li className="flex items-center text-yellow-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Fallback to cached results when available
          </li>
          <li className="flex items-center text-yellow-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            User-friendly error messages
          </li>
        </ul>
      </div>
    </div>
  );
}