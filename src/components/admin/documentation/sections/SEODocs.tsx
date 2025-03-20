import React from 'react';
import { Globe, Database, Code, Layout, Share2, Settings, ArrowRight } from 'lucide-react';

const DATABASE_TABLES = [
  {
    name: 'seo_enabled_states',
    description: 'Stores which states have SEO features enabled',
    key_columns: [
      { name: 'state_name', description: 'Name of the state/country' },
      { name: 'status', description: 'Whether SEO features are enabled for this state' }
    ]
  },
  {
    name: 'seo_location_formats',
    description: 'Stores custom "Nga" and "Për" formats for cities and states',
    key_columns: [
      { name: 'type', description: 'Location type (city or state)' },
      { name: 'city', description: 'City name (for city type)' },
      { name: 'state', description: 'State name' },
      { name: 'nga_format', description: 'Custom "Nga" format' },
      { name: 'per_format', description: 'Custom "Për" format' },
      { name: 'status', description: 'ready/pending/disabled' }
    ]
  },
  {
    name: 'seo_location_connections',
    description: 'Defines valid route connections between locations',
    key_columns: [
      { name: 'from_location_id', description: 'Source location ID' },
      { name: 'to_location_id', description: 'Destination location ID' },
      { name: 'status', description: 'active/inactive' }
    ]
  },
  {
    name: 'seo_template_types',
    description: 'Defines different types of SEO templates',
    key_columns: [
      { name: 'name', description: 'Template type name' },
      { name: 'slug', description: 'URL-friendly identifier' },
      { name: 'status', description: 'active/inactive' }
    ]
  },
  {
    name: 'seo_page_templates',
    description: 'Stores template configurations for each type',
    key_columns: [
      { name: 'template_type_id', description: 'Reference to template type' },
      { name: 'url_structure', description: 'URL pattern with placeholders' },
      { name: 'seo_title', description: 'Title pattern with placeholders' },
      { name: 'meta_description', description: 'Description pattern with placeholders' }
    ]
  },
  {
    name: 'seo_template_components',
    description: 'Configures components used in each template',
    key_columns: [
      { name: 'template_id', description: 'Reference to page template' },
      { name: 'component_name', description: 'React component name' },
      { name: 'display_order', description: 'Component rendering order' },
      { name: 'status', description: 'active/inactive' }
    ]
  }
];

const TEMPLATE_TYPES = [
  {
    name: 'City → City',
    slug: 'city-city',
    example: 'Tirana → Rome',
    url_pattern: '/bileta-avioni-{nga_city}-ne-{per_city}/'
  },
  {
    name: 'State → State',
    slug: 'state-state',
    example: 'Albania → Italy',
    url_pattern: '/fluturime-{nga_state}-ne-{per_state}/'
  }
];

const COMPONENTS = [
  {
    name: 'HeaderComponent',
    description: 'Page title and subtitle with location placeholders',
    placeholders: ['{nga_city}', '{per_city}', '{nga_state}', '{per_state}']
  },
  {
    name: 'FlightSearchComponent',
    description: 'Search form pre-filled with route details',
    features: ['Date selection', 'Passenger count', 'Direct flight toggle']
  },
  {
    name: 'PricingTableComponent',
    description: 'Shows cheapest flights for the route',
    features: ['Monthly price overview', 'Airline information', 'Direct vs. connecting flights']
  },
  {
    name: 'RouteInfoComponent',
    description: 'Detailed information about the route',
    features: ['Flight duration', 'Operating airlines', 'Route frequency']
  },
  {
    name: 'FAQComponent',
    description: 'Common questions about the route',
    features: ['Dynamic pricing FAQs', 'Route-specific information', 'Booking guidance']
  },
  {
    name: 'RelatedDestinationsComponent',
    description: 'Suggests similar routes',
    features: ['Popular alternatives', 'Nearby destinations', 'Price comparisons']
  }
];

const WORKFLOW = [
  {
    step: 1,
    title: 'State Selection',
    description: 'Enable SEO features for specific states/countries',
    details: [
      'Select states where SEO pages should be generated',
      'Only cities within enabled states can have SEO pages',
      'State enablement triggers city discovery'
    ]
  },
  {
    step: 2,
    title: 'Location Configuration',
    description: 'Configure formats for cities and states',
    details: [
      'Set custom "Nga" and "Për" formats',
      'Mark locations as ready when configured',
      'Status controls template generation'
    ]
  },
  {
    step: 3,
    title: 'Route Connections',
    description: 'Define valid routes between locations',
    details: [
      'Automatically generated for ready locations',
      'Manual connection management available',
      'Prevents invalid connections (same city/state)'
    ]
  },
  {
    step: 4,
    title: 'Template Generation',
    description: 'Automatic creation of SEO pages',
    details: [
      'Templates created for valid connections',
      'Components ordered by configuration',
      'Dynamic content based on route data'
    ]
  }
];

export function SEODocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO System Documentation</h3>
        <p className="text-gray-600">
          Comprehensive guide to the SEO page generation system, including database structure,
          template configuration, and automated workflows.
        </p>
      </div>

      {/* Database Structure */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-medium text-gray-900">Database Structure</h4>
        </div>
        <div className="space-y-6">
          {DATABASE_TABLES.map((table, index) => (
            <div key={index} className="border-t border-gray-100 pt-4 first:border-0 first:pt-0">
              <h5 className="font-medium text-gray-800 mb-2">{table.name}</h5>
              <p className="text-sm text-gray-600 mb-3">{table.description}</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {table.key_columns.map((col, idx) => (
                    <div key={idx}>
                      <span className="font-mono text-blue-600">{col.name}</span>
                      <span className="text-gray-600 block">{col.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Types */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-medium text-gray-900">Template Types</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TEMPLATE_TYPES.map((type, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-800 mb-2">{type.name}</h5>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">Example: {type.example}</p>
                <p>
                  <span className="text-gray-500">URL Pattern: </span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                    {type.url_pattern}
                  </code>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Components */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-medium text-gray-900">Template Components</h4>
        </div>
        <div className="grid gap-6">
          {COMPONENTS.map((component, index) => (
            <div key={index} className="border-t border-gray-100 pt-4 first:border-0 first:pt-0">
              <h5 className="font-medium text-gray-800 mb-2">{component.name}</h5>
              <p className="text-sm text-gray-600 mb-3">{component.description}</p>
              <div className="space-y-2">
                {component.placeholders && (
                  <div className="flex gap-2 flex-wrap">
                    {component.placeholders.map((placeholder, idx) => (
                      <code key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm">
                        {placeholder}
                      </code>
                    ))}
                  </div>
                )}
                {component.features && (
                  <ul className="grid grid-cols-2 gap-2">
                    {component.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-medium text-gray-900">Configuration Workflow</h4>
        </div>
        <div className="space-y-6">
          {WORKFLOW.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">{step.step}</span>
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-gray-800 mb-2">{step.title}</h5>
                <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                <ul className="space-y-1">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <ArrowRight className="w-4 h-4 text-blue-600 mr-2" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Connections */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-medium text-gray-900">Route Connections</h4>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Route connections define valid paths between locations for which SEO pages should be generated.
            The system automatically manages these connections based on location status and prevents invalid
            combinations.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <h5 className="font-medium text-yellow-800 mb-2">Invalid Connections</h5>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2" />
                Same city to itself (e.g., Tirana → Tirana)
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2" />
                City to its own state (e.g., Tirana → Albania)
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2" />
                Connections involving disabled or pending locations
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">Automatic Management</h5>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                Connections auto-generated when locations marked as ready
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                Bi-directional connections created automatically
              </li>
              <li className="flex items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                Templates generated only for active connections
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}