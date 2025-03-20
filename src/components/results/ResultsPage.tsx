import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SearchParams } from '../types/search';
import { FlightOption } from '../types/flight';
import { SearchHeader } from '../components/results/SearchHeader';
import { FlightList } from '../components/results/FlightList';
import { LoadingState } from '../components/results/LoadingState';
import { ErrorState } from '../components/results/ErrorState';
import { FlightDetailModal } from '../components/results/FlightDetailModal';
import { FlightFilterPanel, FilterState } from '../components/results/filters/FlightFilterPanel';
import { SortingOptions } from '../components/results/SortingOptions';
import { ProgressBar } from '../components/results/ProgressBar';
import { ShowMoreButton } from '../components/results/ShowMoreButton';
import { applyFilters } from '../utils/flightFilters';
import { sortFlights, SortOption } from '../utils/flightScoring';
import { refreshFlightData } from '../utils/flightData';
import { AdSidebar } from '../components/results/AdSidebar';
import { MobileAd } from '../components/results/MobileAd';
import { parseISODate, formatDateForAPI } from '../utils/format';

function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batch_id');
  
  // Add guard flag ref
  const fetchCalledRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<{
    searchParams: SearchParams;
    searchResults: {
      best_flights: FlightOption[];
      other_flights: FlightOption[];
    } | null;
  } | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchProgress, setSearchProgress] = useState<{
    progress: number;
    message: string;
    isComplete: boolean;
    totalResults?: number;
  } | null>(null);

  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>({
    stops: [],
    departureTime: [],
    returnTime: [],
    airlines: [],
    priceRange: { min: 0, max: 10000 }
  });
  const [sortBy, setSortBy] = useState<SortOption>('best');
  const [processedFlights, setProcessedFlights] = useState<FlightOption[]>([]);
  const [isFiltersPanelOpen, setIsFiltersPanelOpen] = useState(false);
  
  // Show more functionality
  const [visibleFlights, setVisibleFlights] = useState(5);
  const FLIGHTS_PER_PAGE = 5;

  // Cleanup function
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Reset fetch guard on unmount
      fetchCalledRef.current = null;
    };
  }, []);

  // Process flights when filters, sort option, or search results change
  useEffect(() => {
    const processFlights = async () => {
      if (!searchData?.searchResults) {
        setProcessedFlights([]);
        return;
      }

      // Combine all flights
      const allFlights = [
        ...(searchData.searchResults.best_flights || []),
        ...(searchData.searchResults.other_flights || [])
      ];

      // Apply filters
      const filteredFlights = applyFilters(
        allFlights, 
        filters,
        searchData.searchParams.tripType === 'roundTrip'
      );

      // Apply sorting
      const sortedFlights = await sortFlights(filteredFlights, sortBy);
      setProcessedFlights(sortedFlights);
      
      // Reset visible flights when filters/sorting changes
      setVisibleFlights(FLIGHTS_PER_PAGE);
    };

    processFlights();
  }, [searchData?.searchResults, filters, sortBy, searchData?.searchParams.tripType]);

  // Main data fetching logic
  const fetchSearchData = useCallback(async () => {
    // Guard against duplicate fetches for the same batchId
    if (!batchId || fetchCalledRef.current === batchId) {
      return;
    }

    // Log fetch attempt
    console.log(`[${new Date().toISOString()}] Fetching data for batch: ${batchId}`);
    
    // Set guard flag
    fetchCalledRef.current = batchId;

    try {
      // Check system settings for API mode
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_name', 'use_incomplete_api')
        .single();

      const useIncompleteApi = settings?.setting_value ?? false;

      // Fetch search data
      const { data: searchData, error: searchError } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('batch_id', batchId)
        .maybeSingle();

      if (searchError) throw searchError;
      if (!searchData) {
        throw new Error('Search not found. Please try searching again.');
      }

      // Parse dates correctly
      if (searchData.search_params) {
        const params = searchData.search_params;
        if (params.departureDate) {
          const departureDate = parseISODate(params.departureDate);
          params.departureDate = formatDateForAPI(departureDate);
        }
        if (params.returnDate) {
          const returnDate = parseISODate(params.returnDate);
          params.returnDate = formatDateForAPI(returnDate);
        }
        searchData.search_params = params;
      }

      // Check if this is a direct access or from search flow
      const isDirectAccess = !sessionStorage.getItem(`search_${batchId}`);
      const shouldFetchFresh = !isDirectAccess || !searchData.results;

      // Set initial search parameters
      setSearchData({
        searchParams: searchData.search_params,
        searchResults: searchData.cached_results
      });

      // If we need fresh results and incomplete API is disabled, fetch once
      if (shouldFetchFresh && !useIncompleteApi) {
        setRefreshing(true);
        try {
          const refreshedResults = await refreshFlightData(
            searchData.search_params, 
            batchId,
            (progress) => {
              if (progress.isComplete) {
                setSearchData({
                  searchParams: searchData.search_params,
                  searchResults: progress.results
                });
                setLoading(false);
                setRefreshing(false);
                setSearchProgress(null);
              }
            }
          );

          if (refreshedResults) {
            setSearchData({
              searchParams: searchData.search_params,
              searchResults: refreshedResults
            });
          }
        } catch (refreshError) {
          console.error('Error refreshing flight data:', refreshError);
          
          if (searchData.cached_results) {
            setSearchData({
              searchParams: searchData.search_params,
              searchResults: searchData.cached_results
            });
          } else {
            throw refreshError;
          }
        }
      }
      // If incomplete API is enabled, use progressive loading
      else if (shouldFetchFresh && useIncompleteApi) {
        setRefreshing(true);
        try {
          const refreshedResults = await refreshFlightData(
            searchData.search_params, 
            batchId,
            (progress) => {
              setSearchProgress({
                progress: progress.progress,
                message: progress.isComplete 
                  ? 'Search complete!'
                  : `Found ${progress.results.best_flights.length + progress.results.other_flights.length} flights...`,
                isComplete: progress.isComplete,
                totalResults: progress.totalResults
              });

              // Update results as they come in
              if (progress.results.best_flights.length > 0 || progress.results.other_flights.length > 0) {
                setSearchData({
                  searchParams: searchData.search_params,
                  searchResults: progress.results
                });
                setLoading(false);
              }

              // Clear progress when complete
              if (progress.isComplete) {
                setSearchProgress(null);
                setRefreshing(false);
              }
            }
          );

          if (refreshedResults) {
            setSearchData({
              searchParams: searchData.search_params,
              searchResults: refreshedResults
            });
          }
        } catch (refreshError) {
          console.error('Error refreshing flight data:', refreshError);
          
          if (searchData.cached_results) {
            setSearchData({
              searchParams: searchData.search_params,
              searchResults: searchData.cached_results
            });
          } else {
            throw refreshError;
          }
        }
      }

      setLoading(false);
      
      // Clear the search flow flag
      sessionStorage.removeItem(`search_${batchId}`);

    } catch (err) {
      console.error('Error in fetchSearchData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load search results. Please try again.');
      setLoading(false);
      setRefreshing(false);
      setSearchProgress(null);
    }
  }, [batchId]);

  // Initial data fetch - only when batchId changes
  useEffect(() => {
    fetchSearchData();
  }, [fetchSearchData]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    navigate('/home');
  };

  const handleRetry = () => {
    // Reset guard flag to allow retry
    fetchCalledRef.current = null;
    setLoading(true);
    setError(null);
    fetchSearchData();
  };

  const handleToggleFilters = () => {
    setIsFiltersPanelOpen(!isFiltersPanelOpen);
  };

  const handleShowMore = () => {
    setVisibleFlights(prev => Math.min(prev + FLIGHTS_PER_PAGE, processedFlights.length));
  };

  // Only show loading state if we have no results yet
  if (loading && !searchData?.searchResults) {
    return <LoadingState />;
  }

  // Only show error if we have no results and there's an error
  if (error && !searchData?.searchResults) {
    return (
      <ErrorState 
        message={error} 
        onBack={handleBack}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <SearchHeader
        searchParams={searchData!.searchParams}
        onBack={handleBack}
        onToggleFilters={handleToggleFilters}
      />

      {/* Progress Bar */}
      {(refreshing || searchProgress) && (
        <ProgressBar 
          progress={searchProgress?.progress || 0}
          message={searchProgress?.message || 'Refreshing flight prices...'}
        />
      )}

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters - Desktop */}
          <div className="hidden lg:block w-64">
            <FlightFilterPanel
              flights={processedFlights}
              filters={filters}
              onFilterChange={setFilters}
              isRoundTrip={searchData!.searchParams.tripType === 'roundTrip'}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Ad */}
            <div className="lg:hidden">
              <MobileAd />
            </div>

            {/* Sorting Options */}
            <div className="mb-4 md:mb-6">
              <SortingOptions
                value={sortBy}
                onChange={setSortBy}
              />
            </div>

            {/* Flight List */}
            <div className="space-y-4">
              <FlightList
                flights={processedFlights.slice(0, visibleFlights)}
                searchParams={searchData!.searchParams}
                batchId={batchId || ''}
                onSelect={setSelectedFlight}
                onBack={handleBack}
                isSearchComplete={searchProgress?.isComplete}
              />

              {/* Show More Button */}
              {visibleFlights < processedFlights.length && (
                <ShowMoreButton
                  visibleCount={visibleFlights}
                  totalCount={processedFlights.length}
                  onClick={handleShowMore}
                />
              )}
            </div>
          </div>

          {/* Desktop Ad Sidebar */}
          <div className="hidden lg:block">
            <AdSidebar />
          </div>
        </div>
      </div>

      {/* Flight Detail Modal */}
      {selectedFlight && (
        <FlightDetailModal
          isOpen={!!selectedFlight}
          onClose={() => setSelectedFlight(null)}
          flightOption={selectedFlight}
          searchParams={searchData!.searchParams}
        />
      )}

      {/* Mobile Filter Panel */}
      <FlightFilterPanel
        flights={processedFlights}
        filters={filters}
        onFilterChange={setFilters}
        isRoundTrip={searchData!.searchParams.tripType === 'roundTrip'}
        className="lg:hidden fixed inset-0 z-50 bg-white transform transition-transform duration-300"
        isOpen={isFiltersPanelOpen}
        onClose={() => setIsFiltersPanelOpen(false)}
      />

      {/* Mobile Filter Button */}
      <button
        onClick={handleToggleFilters}
        className="lg:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Filter className="w-6 h-6" />
      </button>
    </div>
  );
}

export default ResultsPage;