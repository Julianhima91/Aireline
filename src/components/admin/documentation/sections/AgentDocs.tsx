import React from 'react';
import { Users, Calculator, MessageCircle, BarChart as ChartBar } from 'lucide-react';

const AGENT_FEATURES = [
  {
    title: 'Commission Management',
    icon: Calculator,
    description: 'Comprehensive commission calculation and tracking system',
    features: [
      'Automatic commission calculation based on passenger types',
      'Group booking discounts',
      'Commission history tracking',
      'Real-time commission preview'
    ]
  },
  {
    title: 'WhatsApp Integration',
    icon: MessageCircle,
    description: 'Direct communication with clients through WhatsApp',
    features: [
      'One-click message generation',
      'Flight details formatting',
      'Automated pricing updates',
      'Booking reference tracking'
    ]
  },
  {
    title: 'Performance Analytics',
    icon: ChartBar,
    description: 'Detailed insights into agent performance and earnings',
    features: [
      'Monthly earnings overview',
      'Booking conversion rates',
      'Client retention metrics',
      'Route performance analysis'
    ]
  }
];

const COMMISSION_RULES = [
  {
    type: 'Standard Rates',
    rules: [
      { passenger: 'Adult', rate: '€20 per passenger' },
      { passenger: 'Child (2-11)', rate: '€10 per passenger' },
      { passenger: 'Infant (seat)', rate: '€10 per passenger' },
      { passenger: 'Infant (lap)', rate: '€0 per passenger' }
    ]
  },
  {
    type: 'Group Discounts',
    rules: [
      { passengers: '2-3 adults', rate: '€15 per passenger' },
      { passengers: '4-5 adults', rate: '€13.33 per passenger' },
      { passengers: '6+ adults', rate: '€12 per passenger' }
    ]
  },
  {
    type: 'Round-Trip Discounts',
    rules: [
      { description: 'One-way flights', rate: '€20 commission' },
      { description: 'Round-trip flights', rate: '€10 per leg (€20 total)' }
    ]
  }
];

export function AgentDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Tools & Commission</h3>
        <p className="text-gray-600 mb-4">
          Comprehensive suite of tools for sales agents to manage bookings, track commissions,
          and communicate with clients efficiently.
        </p>
      </div>

      {/* Agent Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {AGENT_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">{feature.title}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
              <div className="space-y-2">
                {feature.features.map((item, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Commission Structure */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Commission Structure</h4>
        <div className="grid md:grid-cols-3 gap-6">
          {COMMISSION_RULES.map((section, index) => (
            <div key={index}>
              <h5 className="font-medium text-gray-800 mb-4">{section.type}</h5>
              <div className="space-y-3">
                {section.rules.map((rule, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      {rule.passenger || rule.passengers || rule.description}
                    </span>
                    <span className="font-medium text-gray-900">{rule.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission Calculation Example */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Commission Calculation Example</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-800 mb-3">Family Booking (One-way)</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 2 Adults: 2 × €15 = €30 (group rate)</p>
              <p>• 1 Child: 1 × €10 = €10</p>
              <p>• 1 Infant (seat): 1 × €10 = €10</p>
              <p className="mt-4 font-medium text-gray-900">Total Commission: €50</p>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-3">Group Booking (Round-trip)</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 4 Adults: 4 × €13.33 × 2 = €106.64</p>
              <p>• Round-trip discount applied</p>
              <p>• Per-leg commission: €53.32</p>
              <p className="mt-4 font-medium text-gray-900">Total Commission: €106.64</p>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Integration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Integration</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Message Format</h5>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
              <pre className="whitespace-pre-wrap">
                {`🛫 Flight Details
From: [Origin] ([Code])
To: [Destination] ([Code])
Date: [Departure Date & Time]
Duration: [Total Duration]
Stops: [Number of Stops]
Price: [Total Price] EUR
Booking Reference: [ID]`}
              </pre>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Features</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span>Automatic price updates</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span>Real-time availability check</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span>Booking tracking integration</span>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Best Practices</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span>Verify prices before sending</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span>Include booking reference</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                  <span>Follow up within 24 hours</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}