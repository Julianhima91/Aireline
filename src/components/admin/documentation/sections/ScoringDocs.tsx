import React from 'react';
import { Star, Clock, Plane, Sun } from 'lucide-react';

const SCORING_FACTORS = [
  {
    title: 'Direct Flight Bonus',
    icon: Plane,
    description: 'Direct flights receive a significant bonus to prioritize convenience',
    points: [
      '+10 points for direct one-way flights',
      '+20 points for direct round-trip flights (both legs must be direct)'
    ]
  },
  {
    title: 'Time-based Bonuses',
    icon: Clock,
    description: 'Flights at preferred times receive additional points',
    points: [
      '+5 points for early morning arrival (6-10 AM)',
      '+3 points for morning arrival (10 AM-3 PM)',
      '+3 points for afternoon departure (2-6 PM)',
      '+5 points for evening departure (6 PM-12 AM)'
    ]
  },
  {
    title: 'Stop Penalties',
    icon: Plane,
    description: 'Penalties applied based on number of stops',
    points: [
      '-8 points for one stop',
      '-15 points for two or more stops',
      'For round-trips, penalties are applied per leg'
    ]
  },
  {
    title: 'Duration Penalties',
    icon: Clock,
    description: 'Longer flights receive penalties based on duration',
    points: [
      '-2 points for medium duration (4-6 hours)',
      '-4 points for long duration (6-8 hours)',
      '-6 points for very long duration (8+ hours)'
    ]
  }
];

const SCORING_EXAMPLES = [
  {
    title: 'One-Way Direct Flight Example',
    description: 'TIA → FCO, Direct Morning Flight',
    calculation: [
      'Direct flight bonus: +10',
      'Morning arrival (9 AM): +5',
      'Afternoon departure (2 PM): +3',
      'Duration 2 hours: No penalty',
      'Total Score: 18 points'
    ]
  },
  {
    title: 'Round-Trip Direct Flight Example',
    description: 'TIA → FCO → TIA, Both Direct',
    calculation: [
      'Direct flight bonus (both legs): +20',
      'Outbound morning arrival: +5',
      'Outbound afternoon departure: +3',
      'Return evening arrival: +5',
      'Return morning departure: +3',
      'Total duration 5 hours: -2',
      'Total Score: 34 points'
    ]
  }
];

export function ScoringDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Flight Scoring System</h3>
        <p className="text-gray-600">
          The flight scoring system uses multiple factors to rank flights based on
          convenience, duration, and timing. This helps provide the most relevant
          results to users when sorting by "Best" option.
        </p>
      </div>

      {/* Scoring Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SCORING_FACTORS.map((factor, index) => {
          const Icon = factor.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{factor.title}</h4>
              </div>
              <p className="text-gray-600 mb-4">{factor.description}</p>
              <div className="space-y-2">
                {Array.isArray(factor.points) ? (
                  factor.points.map((point, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                      {point}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    {factor.points}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Flight Type Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">One-Way vs Round-Trip Scoring</h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* One-Way Flights */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-800">One-Way Flights</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Direct flight bonus (+10) applied when flight has exactly one segment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Time bonuses calculated based on single departure and arrival</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Stop penalties based on total segments minus one</span>
              </li>
            </ul>
          </div>

          {/* Round-Trip Flights */}
          <div className="space-y-4">
            <h5 className="font-medium text-gray-800">Round-Trip Flights</h5>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Double direct flight bonus (+20) if both legs are direct</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Time bonuses applied separately to outbound and return legs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                <span>Stop penalties calculated independently for each leg</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scoring Examples */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900">Scoring Examples</h4>
        
        <div className="grid md:grid-cols-2 gap-6">
          {SCORING_EXAMPLES.map((example, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <h5 className="font-medium text-gray-800 mb-2">{example.title}</h5>
              <p className="text-sm text-gray-600 mb-4">{example.description}</p>
              <div className="space-y-2">
                {example.calculation.map((step, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}