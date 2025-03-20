import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, Calendar, MapPin, Plane, Clock, Tag, ExternalLink, ChevronLeft, ChevronRight, User, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface SavedSearch {
  batch_id: string;
  user_id: string | null;
  search_params: {
    fromLocation: string;
    toLocation: string;
    fromCode: string;
    toCode: string;
    departureDate: string;
    returnDate: string | null;
    tripType: 'roundTrip' | 'oneWay';
    passengers: {
      adults: number;
      children: number;
      infantsInSeat: number;
      infantsOnLap: number;
    };
    travelClass: string;
    stops: string;
  };
  price_stability_level: 'HIGH' | 'MEDIUM' | 'LOW';
  cached_until: string | null;
  created_at: string;
}

const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;
const ITEMS_PER_PAGE = 10;

export function AdminClientSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [lastCursor, setLastCursor] = useState<string | null>(null);
  const [cursors, setCursors] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  // Fetch total count from materialized view
  const fetchTotalCount = useCallback(async () => {
    const { data, error } = await supabase
      .from('saved_searches_stats')
      .select('total_count')
      .single();

    if (error) {
      console.error('Error fetching total count:', error);
      return 0;
    }

    return data?.total_count || 0;
  }, []);

  // Optimized fetch function using cursor pagination
  const fetchSearches = useCallback(async (cursor?: string | null) => {
    try {
      setLoading(true);
      setError(null);

      // Get total count from materialized view
      const totalCount = await fetchTotalCount();
      setTotalCount(totalCount);

      // Build query with cursor pagination
      let query = supabase
        .from('saved_searches')
        .select(`
          batch_id,
          user_id,
          search_params,
          price_stability_level,
          cached_until,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(ITEMS_PER_PAGE);

      // Add cursor if provided
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Update data and cursor
      if (data && data.length > 0) {
        setSearches(data);
        const newCursor = data[data.length - 1].created_at;
        setLastCursor(newCursor);
        setCursors(prev => ({ ...prev, [currentPage]: newCursor }));
      }
    } catch (err) {
      console.error('Error fetching searches:', err);
      setError('Failed to load searches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, fetchTotalCount]);

  // Initial load and page changes
  useEffect(() => {
    const cursor = cursors[currentPage - 1];
    fetchSearches(cursor);
  }, [currentPage, fetchSearches]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  const handleRetry = useCallback(() => {
    const cursor = cursors[currentPage - 1];
    fetchSearches(cursor);
  }, [currentPage, fetchSearches]);

  const getStabilityColor = useCallback((level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const handleViewResults = useCallback((batchId: string) => {
    navigate(`/results?batch_id=${batchId}`);
  }, [navigate]);

  const formatUserId = useCallback((userId: string | null) => {
    if (!userId) return 'Anonymous';
    return `${userId.slice(0, 8)}...`;
  }, []);

  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid Date';
    }
  }, []);

  const formatDateTime = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'dd MMM yyyy HH:mm');
    } catch (err) {
      console.error('Error formatting datetime:', err);
      return 'Invalid Date';
    }
  }, []);

  const Pagination = useMemo(() => {
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    
    return (
      <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)}
              </span>{' '}
              of <span className="font-medium">{totalCount}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  }, [currentPage, totalCount, handlePageChange]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        <div className="relative mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading searches...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Searches</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Client Searches</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing page {currentPage} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route & Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Search ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price Stability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cache Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searches.map((search) => (
                  <tr key={search.batch_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          {search.search_params.fromCode}
                          <Plane className="w-4 h-4 text-blue-500 mx-2" />
                          {search.search_params.toCode}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDate(search.search_params.departureDate)}
                        {search.search_params.returnDate && (
                          <>
                            {' → '}
                            {formatDate(search.search_params.returnDate)}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-mono">
                        {search.batch_id.substring(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {formatUserId(search.user_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStabilityColor(search.price_stability_level)}`}>
                        <Tag className="w-3 h-3 mr-1" />
                        {search.price_stability_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {search.cached_until ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {new Date(search.cached_until) > new Date() ? (
                              <span className="text-green-600">Valid until</span>
                            ) : (
                              <span className="text-red-600">Expired at</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {formatDateTime(search.cached_until)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not cached</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(search.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => handleViewResults(search.batch_id)}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Results
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Pagination}
        </div>
      </div>
    </div>
  );
}