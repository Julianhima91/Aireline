import React from 'react';
import { Database, Table, Key, Lock, Shield, Code } from 'lucide-react';

const TABLES = [
  {
    name: 'saved_searches',
    description: 'Stores user search parameters and results with caching support',
    columns: [
      { name: 'batch_id', type: 'uuid', description: 'Primary key, unique identifier for the search' },
      { name: 'user_id', type: 'uuid', description: 'Foreign key to auth.users, nullable for anonymous searches' },
      { name: 'search_params', type: 'jsonb', description: 'Search parameters including dates, locations, passengers' },
      { name: 'results', type: 'jsonb', description: 'Latest search results' },
      { name: 'cached_results', type: 'jsonb', description: 'Cached results for faster retrieval' },
      { name: 'cached_until', type: 'timestamptz', description: 'Cache expiration timestamp' },
      { name: 'price_stability_level', type: 'text', description: 'HIGH, MEDIUM, or LOW based on date proximity' },
      { name: 'created_at', type: 'timestamptz', description: 'Record creation timestamp' },
      { name: 'updated_at', type: 'timestamptz', description: 'Last update timestamp' }
    ],
    policies: [
      'Anyone can create searches',
      'Anyone can read searches by batch_id',
      'Users can update their searches'
    ]
  },
  {
    name: 'calendar_prices',
    description: 'Monthly price data for routes with caching and tracking',
    columns: [
      { name: 'id', type: 'uuid', description: 'Primary key' },
      { name: 'origin', type: 'text', description: 'Origin airport code' },
      { name: 'destination', type: 'text', description: 'Destination airport code' },
      { name: 'year_month', type: 'text', description: 'Month in YYYY-MM format' },
      { name: 'price_grid', type: 'jsonb', description: 'Daily prices in grid format' },
      { name: 'last_update', type: 'timestamptz', description: 'Last price update timestamp' },
      { name: 'created_at', type: 'timestamptz', description: 'Record creation timestamp' },
      { name: 'updated_at', type: 'timestamptz', description: 'Last modification timestamp' }
    ],
    policies: [
      'Public read access to prices',
      'Admin can manage prices'
    ]
  },
  {
    name: 'route_update_settings',
    description: 'Configuration for route price update frequency and tracking',
    columns: [
      { name: 'id', type: 'uuid', description: 'Primary key' },
      { name: 'origin', type: 'text', description: 'Origin airport code' },
      { name: 'destination', type: 'text', description: 'Destination airport code' },
      { name: 'update_interval', type: 'integer', description: 'Hours between updates (3, 6, 12, or 24)' },
      { name: 'is_ignored', type: 'boolean', description: 'Flag to skip updates for this route' },
      { name: 'search_count', type: 'integer', description: 'Total number of searches for this route' },
      { name: 'last_update', type: 'timestamptz', description: 'Last successful update timestamp' }
    ],
    policies: [
      'Public read access',
      'Admin can manage settings'
    ]
  },
  {
    name: 'scoring_settings',
    description: 'Configuration for flight scoring and ranking algorithm',
    columns: [
      { name: 'id', type: 'text', description: 'Primary key, defaults to "default"' },
      { name: 'settings', type: 'jsonb', description: 'Scoring parameters and weights' },
      { name: 'updated_by', type: 'uuid', description: 'Admin who last updated settings' },
      { name: 'updated_at', type: 'timestamptz', description: 'Last update timestamp' }
    ],
    policies: [
      'Public read access',
      'Admin only write access'
    ]
  },
  {
    name: 'sales_agents',
    description: 'Sales agent profiles and commission tracking',
    columns: [
      { name: 'id', type: 'uuid', description: 'Primary key, references auth.users' },
      { name: 'name', type: 'text', description: 'Agent full name' },
      { name: 'email', type: 'text', description: 'Agent email address' },
      { name: 'phone_number', type: 'text', description: 'Contact number' },
      { name: 'is_active', type: 'boolean', description: 'Account status' },
      { name: 'created_at', type: 'timestamptz', description: 'Account creation date' }
    ],
    policies: [
      'Agents can read own profile',
      'Agents can update own non-sensitive data',
      'Admin has full access'
    ]
  }
];

const TRIGGERS = [
  {
    name: 'update_updated_at',
    description: 'Automatically updates the updated_at timestamp on record changes',
    tables: ['saved_searches', 'calendar_prices', 'route_update_settings', 'scoring_settings']
  },
  {
    name: 'sync_route_demand_trigger',
    description: 'Updates route demand tracking when search patterns change',
    tables: ['search_route_tracking']
  }
];

const FUNCTIONS = [
  {
    name: 'calculate_route_demand',
    description: 'Calculates demand level based on search volume',
    returnType: 'text',
    returns: 'HIGH, MEDIUM, or LOW'
  },
  {
    name: 'get_calendar_commission',
    description: 'Calculates commission for flight prices',
    returnType: 'numeric',
    returns: 'Commission amount in EUR'
  }
];

export function DatabaseDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Structure</h3>
        <p className="text-gray-600 mb-4">
          The system uses Supabase (PostgreSQL) for data storage, with Row Level Security
          (RLS) policies ensuring data access control. The database is designed for
          performance and scalability, with built-in caching and tracking mechanisms.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="flex items-center text-blue-800 font-medium mb-2">
            <Shield className="w-5 h-5 mr-2" />
            Security Features
          </h4>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
              Row Level Security (RLS) on all tables
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
              Role-based access control (admin, agent, user)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
              Automatic timestamps for auditing
            </li>
          </ul>
        </div>
      </div>

      {/* Tables */}
      <div className="space-y-6">
        <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          Tables
        </h4>
        
        {TABLES.map((table, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Table className="w-5 h-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-gray-900">{table.name}</h4>
              </div>
              <p className="text-gray-600 mt-1">{table.description}</p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">RLS Policies</h5>
                <ul className="space-y-1">
                  {table.policies.map((policy, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <Lock className="w-4 h-4 mr-2 text-green-600" />
                      {policy}
                    </li>
                  ))}
                </ul>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm font-medium text-gray-500">
                    <th className="pb-3">Column</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {table.columns.map((column, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="py-3 font-medium text-gray-900">{column.name}</td>
                      <td className="py-3 text-gray-600">{column.type}</td>
                      <td className="py-3 text-gray-600">{column.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Triggers */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          Triggers
        </h4>
        
        {TRIGGERS.map((trigger, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <h5 className="font-medium text-gray-900 mb-2">{trigger.name}</h5>
            <p className="text-gray-600 text-sm mb-2">{trigger.description}</p>
            <div className="text-sm text-gray-500">
              Applied to: {trigger.tables.join(', ')}
            </div>
          </div>
        ))}
      </div>

      {/* Functions */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          Functions
        </h4>
        
        {FUNCTIONS.map((func, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
            <h5 className="font-medium text-gray-900 mb-2">{func.name}</h5>
            <p className="text-gray-600 text-sm mb-2">{func.description}</p>
            <div className="text-sm text-gray-500">
              Returns: <span className="font-mono">{func.returnType}</span> ({func.returns})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}