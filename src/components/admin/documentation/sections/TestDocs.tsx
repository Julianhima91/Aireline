import React from 'react';
import { Beaker as TestingBeaker, Bug, CheckCircle, AlertTriangle } from 'lucide-react';

const IMPLEMENTED_TESTS = [
  {
    title: 'Frontend Component Tests',
    description: 'Tests for React components using Vitest and React Testing Library',
    suites: [
      {
        name: 'FlightCard Tests',
        file: 'FlightCard.test.tsx',
        cases: [
          'Renders flight details correctly',
          'Handles click events properly',
          'Displays correct duration',
          'Shows route summary'
        ]
      },
      {
        name: 'FlightFilterPanel Tests',
        file: 'FlightFilterPanel.test.tsx',
        cases: [
          'Renders all filter sections',
          'Shows return time filter only for round trips',
          'Handles filter changes correctly',
          'Shows reset button when filters are active'
        ]
      },
      {
        name: 'FlightList Tests',
        file: 'FlightList.test.tsx',
        cases: [
          'Renders flight cards correctly',
          'Shows empty state when no flights',
          'Handles back button click'
        ]
      }
    ]
  },
  {
    title: 'Business Logic Tests',
    description: 'Tests for core business logic and data processing',
    suites: [
      {
        name: 'Flight Filters Tests',
        file: 'flightFilters.test.ts',
        cases: [
          'Filters by stops correctly',
          'Filters by departure time correctly',
          'Filters by airline correctly',
          'Filters by price range correctly',
          'Combines multiple filters correctly'
        ]
      },
      {
        name: 'Flight Scoring Tests',
        file: 'flightScoring.test.ts',
        cases: [
          'Sorts by price correctly',
          'Sorts by duration correctly',
          'Sorts by best score correctly',
          'Provides detailed score description'
        ]
      }
    ]
  },
  {
    title: 'Settings & Configuration Tests',
    description: 'Tests for system settings and configuration components',
    suites: [
      {
        name: 'FlightScoringSettings Tests',
        file: 'FlightScoringSettings.test.tsx',
        cases: [
          'Loads settings correctly',
          'Handles input changes',
          'Shows success message on save',
          'Resets to default values'
        ]
      },
      {
        name: 'SortingOptions Tests',
        file: 'SortingOptions.test.tsx',
        cases: [
          'Renders all sorting options',
          'Highlights selected option',
          'Calls onChange when option clicked',
          'Shows tooltips with descriptions'
        ]
      }
    ]
  }
];

const FUTURE_TESTS = [
  {
    title: 'Authentication & Authorization',
    icon: Bug,
    tests: [
      'User registration flow validation',
      'Role-based access control tests',
      'Session management and token refresh',
      'Password reset functionality',
      'Agent account activation process'
    ]
  },
  {
    title: 'Commission Management',
    icon: CheckCircle,
    tests: [
      'Commission calculation for different passenger types',
      'Group booking discount application',
      'Round-trip commission rules',
      'Commission history tracking',
      'Agent performance metrics calculation'
    ]
  },
  {
    title: 'Error Handling & Recovery',
    icon: AlertTriangle,
    tests: [
      'API failure recovery scenarios',
      'Cache invalidation and refresh',
      'Network timeout handling',
      'Rate limit handling',
      'Fallback behavior testing'
    ]
  }
];

export function TestDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Cases & Future Testing Ideas</h3>
        <p className="text-gray-600 mb-4">
          Comprehensive overview of implemented test cases and planned future test coverage
          to ensure system reliability and functionality.
        </p>
      </div>

      {/* Implemented Tests */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">Implemented Test Cases</h4>
        {IMPLEMENTED_TESTS.map((category, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <h5 className="font-medium text-gray-800 mb-2">{category.title}</h5>
            <p className="text-sm text-gray-600 mb-4">{category.description}</p>
            <div className="space-y-6">
              {category.suites.map((suite, idx) => (
                <div key={idx} className="border-t border-gray-100 pt-4 first:border-0 first:pt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <TestingBeaker className="w-5 h-5 text-blue-600" />
                    <h6 className="font-medium text-gray-700">{suite.name}</h6>
                    <span className="text-sm text-gray-500">({suite.file})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {suite.cases.map((testCase, caseIdx) => (
                      <div key={caseIdx} className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-3" />
                        {testCase}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Future Test Ideas */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">Future Testing Ideas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FUTURE_TESTS.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h5 className="font-medium text-gray-800">{category.title}</h5>
                </div>
                <div className="space-y-2">
                  {category.tests.map((test, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                      {test}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Testing Tools & Best Practices */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Testing Tools & Best Practices</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-800 mb-3">Testing Stack</h5>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                <span>Vitest for test runner and assertions</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                <span>React Testing Library for component testing</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                <span>JSDOM for browser environment simulation</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                <span>MSW for API mocking</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-3">Best Practices</h5>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                <span>Write tests before implementing features (TDD)</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                <span>Focus on user behavior over implementation</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                <span>Maintain test isolation and independence</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                <span>Keep coverage above 80% for critical paths</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}