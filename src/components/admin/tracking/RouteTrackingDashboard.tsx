import React, { useState } from 'react';
import { RoutePopularity } from './RoutePopularity';
import { UpdateFrequencySettings } from './UpdateFrequencySettings';

export function RouteTrackingDashboard() {
  const [activeTab, setActiveTab] = useState<'popularity' | 'frequency'>('popularity');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('popularity')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'popularity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Route Popularity
        </button>
        <button
          onClick={() => setActiveTab('frequency')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'frequency'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Update Frequency
        </button>
      </div>

      {/* Content */}
      {activeTab === 'popularity' ? (
        <RoutePopularity />
      ) : (
        <UpdateFrequencySettings />
      )}
    </div>
  );
}