import React from 'react';
import { GitBranch, ArrowRight, Search, Database, RefreshCw, Filter, Star } from 'lucide-react';

const DATA_FLOWS = [
  {
    title: 'Search Initiation',
    icon: Search,
    steps: [
      'User submits search form with flight parameters',
      'Search parameters validated and normalized',
      'Unique batch ID generated for tracking',
      'Search parameters and batch ID stored in saved_searches table',
      'User redirected to results page with batch ID'
    ],
    code: `// Search parameters validation and storage
const batchId = uuidv4();
await supabase.from('saved_searches').insert([{
  batch_id: batchId,
  user_id: user?.id || null,
  search_params: searchParams,
  price_stability_level: 'MEDIUM'
}]);`
  },
  {
    title: 'Results Fetching',
    icon: Database,
    steps: [
      'Check for cached results using batch ID',
      'If cache valid, return cached results immediately',
      'Otherwise, initiate API search with SkyScanner',
      'Process incoming results progressively',
      'Update route tracking statistics',
      'Cache results for future use'
    ],
    code: `// Progressive results loading
const refreshedResults = await refreshFlightData(
  searchParams, 
  batchId,
  (progress) => {
    setSearchProgress({
      progress: progress.progress,
      message: progress.isComplete 
        ? 'Search complete!'
        : \`Found \${progress.results.length} flights...\`
    });
    // Update UI with partial results
    setSearchData({
      searchParams,
      searchResults: progress.results
    });
  }
);`
  },
  {
    title: 'Data Processing Pipeline',
    icon: RefreshCw,
    steps: [
      'Raw API response parsed into internal flight model',
      'Flights split into outbound/return segments',
      'Price calculations with commission',
      'Flight scoring based on multiple factors',
      'Results cached with expiration time'
    ],
    code: `// Flight data processing
const processedResults = {
  best_flights: parseSkyResponse(data).map(flight => ({
    ...flight,
    type: searchParams.tripType,
    score: calculateFlightScore(flight)
  })),
  cached_until: new Date(Date.now() + 2 * 60 * 60 * 1000)
};`
  },
  {
    title: 'Filtering & Sorting',
    icon: Filter,
    steps: [
      'Apply user-selected filters (stops, time, airlines)',
      'Sort results based on selected criteria',
      'Calculate flight scores for "Best" sorting',
      'Apply price range filtering',
      'Update UI with filtered results'
    ],
    code: `// Apply filters and sorting
const filteredFlights = applyFilters(
  allFlights, 
  filters,
  searchParams.tripType === 'roundTrip'
);
const sortedFlights = await sortFlights(filteredFlights, sortBy);`
  },
  {
    title: 'Caching Strategy',
    icon: Database,
    steps: [
      'Check route demand level from tracking data',
      'Set cache duration based on demand (3-24 hours)',
      'Store results in calendar_prices for reuse',
      'Update route_update_settings with new interval',
      'Handle cache invalidation on price changes'
    ],
    code: `// Cache management
const shouldUpdate = await supabase.rpc(
  'should_update_calendar_prices',
  { origin, destination, year_month }
);
if (shouldUpdate) {
  await updateCalendarPrices(origin, destination);
}`
  },
  {
    title: 'Scoring System',
    icon: Star,
    steps: [
      'Load scoring settings from database',
      'Apply direct flight bonus (+10 points)',
      'Calculate time-based bonuses',
      'Apply stop and duration penalties',
      'Sort results by final score'
    ],
    code: `// Flight scoring
const score = await calculateFlightScore(flight);
// Example factors:
// - Direct flight: +10
// - Morning arrival: +5
// - One stop: -8
// - Long duration: -4`
  }
];

export function DataFlowDocs() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Flow</h3>
        <p className="text-gray-600 mb-4">
          The flight search system uses a multi-stage data flow with progressive loading,
          caching, and real-time updates. This documentation outlines the complete journey
          of data through the system, from search initiation to final display.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="flex items-center text-blue-800 font-medium mb-2">
            <GitBranch className="w-5 h-5 mr-2" />
            Key Components
          </h4>
          <ul className="space-y-2 text-blue-700">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
              Progressive loading with real-time updates
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
              Multi-level caching system
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
              Demand-based update intervals
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        {DATA_FLOWS.map((flow, index) => {
          const Icon = flow.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-semibold text-gray-900">{flow.title}</h4>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Process Steps */}
                  <div className="space-y-4">
                    {flow.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{idx + 1}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="text-gray-600">{step}</div>
                      </div>
                    ))}
                  </div>

                  {/* Code Example */}
                  <div className="mt-4">
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-gray-700">
                        <div className="text-sm text-gray-300">Example Code</div>
                      </div>
                      <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
                        <code>{flow.code}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}