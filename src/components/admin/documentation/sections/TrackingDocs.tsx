import React from 'react';
import { TrendingUp, BarChart, Clock, Calendar, Plane, RefreshCw } from 'lucide-react';

const TRACKING_FEATURES = [
  {
    title: 'Route Demand Analysis',
    icon: TrendingUp,
    description: 'Track and analyze route popularity and search patterns',
    features: [
      'Real-time search volume tracking',
      'Popular dates identification',
      'Seasonal trend analysis',
      'Demand-based pricing insights'
    ]
  },
  {
    title: 'Performance Metrics',
    icon: BarChart,
    description: 'Comprehensive analytics for route performance',
    features: [
      'Conversion rate tracking',
      'Price fluctuation analysis',
      'Search-to-booking ratio',
      'Route profitability metrics'
    ]
  },
  {
    title: 'Update Management',
    icon: RefreshCw,
    description: 'Intelligent price update scheduling system',
    features: [
      'Demand-based update intervals',
      'Automated price refresh',
      'Cache management',
      'Update history tracking'
    ]
  }
];

const UPDATE_INTERVALS = [
  {
    level: 'HIGH',
    interval: '3 hours',
    criteria: 'Routes with 30+ searches per day',
    features: [
      'Frequent price updates',
      'Real-time availability checks',
      'Priority cache refresh',
      'Immediate price alerts'
    ]
  },
  {
    level: 'MEDIUM',
    interval: '6 hours',
    criteria: '10-29 searches per day',
    features: [
      'Regular price updates',
      'Standard availability checks',
      'Normal cache duration',
      'Daily price alerts'
    ]
  },
  {
    level: 'LOW',
    interval: '12 hours',
    criteria: 'Less than 10 searches per day',
    features: [
      'Less frequent updates',
      'Extended cache duration',
      'Background processing',
      'Weekly price alerts'
    ]
  }
];

const TRACKING_METRICS = [
  {
    name: 'Search Volume',
    description: 'Number of searches per route per day',
    calculation: 'Total daily searches / route',
    thresholds: [
      'High: >30 searches',
      'Medium: 10-29 searches',
      'Low: <10 searches'
    ]
  },
  {
    name: 'Price Stability',
    description: 'Measure of price fluctuation over time',
    calculation: 'Standard deviation of prices over 7 days',
    thresholds: [
      'High: <5% variation',
      'Medium: 5-15% variation',
      'Low: >15% variation'
    ]
  },
  {
    name: 'Cache Efficiency',
    description: 'Effectiveness of price caching system',
    calculation: 'Cache hits / total requests × 100',
    thresholds: [
      'High: >90% hit rate',
      'Medium: 70-90% hit rate',
      'Low: <70% hit rate'
    ]
  }
];

export function TrackingDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Route Tracking & Analytics</h3>
        <p className="text-gray-600 mb-4">
          Comprehensive system for monitoring route performance, analyzing search patterns,
          and optimizing price update intervals based on demand.
        </p>
      </div>

      {/* Tracking Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TRACKING_FEATURES.map((feature, index) => {
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

      {/* Update Intervals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Update Intervals</h4>
        <div className="grid md:grid-cols-3 gap-6">
          {UPDATE_INTERVALS.map((interval, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h5 className="font-medium text-gray-800">{interval.level} Demand</h5>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-blue-600 font-medium">Every {interval.interval}</p>
                <p className="text-gray-600">{interval.criteria}</p>
              </div>
              <div className="space-y-2">
                {interval.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-6">Tracking Metrics</h4>
        <div className="space-y-6">
          {TRACKING_METRICS.map((metric, index) => (
            <div key={index} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-3">
                <BarChart className="w-5 h-5 text-blue-600" />
                <h5 className="font-medium text-gray-800">{metric.name}</h5>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Description</h6>
                  <p className="text-sm text-gray-600">{metric.description}</p>
                </div>
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Calculation</h6>
                  <p className="text-sm text-gray-600">{metric.calculation}</p>
                </div>
                <div>
                  <h6 className="text-sm font-medium text-gray-700 mb-2">Thresholds</h6>
                  <div className="space-y-1">
                    {metric.thresholds.map((threshold, idx) => (
                      <p key={idx} className="text-sm text-gray-600">{threshold}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Flow */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Data Flow & Processing</h4>
        <div className="space-y-6">
          <div>
            <h5 className="font-medium text-gray-800 mb-3">Search Tracking</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. User performs flight search</p>
              <p>2. Search parameters recorded in tracking system</p>
              <p>3. Route demand level calculated</p>
              <p>4. Update interval adjusted based on demand</p>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-3">Price Updates</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. Check route demand level</p>
              <p>2. Determine update interval</p>
              <p>3. Queue price refresh if needed</p>
              <p>4. Update cache and notify systems</p>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-800 mb-3">Analytics Processing</h5>
            <div className="space-y-2 text-sm text-gray-600">
              <p>1. Aggregate search data hourly</p>
              <p>2. Calculate performance metrics</p>
              <p>3. Generate trend reports</p>
              <p>4. Update dashboards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}