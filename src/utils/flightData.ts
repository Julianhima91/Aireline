import { supabase } from './supabase';
import { SearchParams } from '../types/search';
import { searchFlights } from './flightSearch';
import { formatErrorMessage, makeCloneable } from './format';

// Track ongoing refreshes to prevent duplicates
const ongoingRefreshes = new Map<string, Promise<any>>();

// Helper function to calculate price stability level
function calculatePriceStability(departureDate: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const daysUntilDeparture = Math.ceil(
    (new Date(departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDeparture > 60) return 'HIGH';
  if (daysUntilDeparture > 30) return 'MEDIUM';
  return 'LOW';
}

// Function to update route tracking
async function updateRouteTracking(params: SearchParams) {
  try {
    // Convert dates to Date objects
    const departureDate = new Date(params.departureDate);
    const returnDate = params.returnDate ? new Date(params.returnDate) : null;

    // Get month in YYYY-MM format
    const departureMonth = departureDate.toISOString().slice(0, 7);
    const returnMonth = returnDate ? returnDate.toISOString().slice(0, 7) : null;

    // Call RPC function to update route tracking
    const { error: rpcError } = await supabase.rpc('update_route_tracking', {
      p_origin: params.fromCode,
      p_destination: params.toCode,
      p_departure_date: departureDate.toISOString().split('T')[0],
      p_return_date: returnDate?.toISOString().split('T')[0] || null,
      p_user_id: null // Pass null for anonymous users
    });

    if (rpcError) {
      console.error('Error in update_route_tracking RPC:', rpcError);
      throw rpcError;
    }

    // Log successful tracking
    console.log('Route tracking updated successfully:', {
      outbound: `${params.fromCode} → ${params.toCode} (${departureMonth})`,
      return: returnDate ? `${params.toCode} → ${params.fromCode} (${returnMonth})` : 'N/A'
    });

  } catch (err) {
    console.error('Error updating route tracking:', err);
    // Continue execution even if tracking fails
  }
}

export async function refreshFlightData(
  searchParams: SearchParams, 
  batchId: string,
  onProgress?: (progress: any) => void
) {
  const searchKey = `${searchParams.fromCode}-${searchParams.toCode}-${searchParams.departureDate}-${searchParams.returnDate || 'oneway'}`;

  if (ongoingRefreshes.has(searchKey)) {
    return ongoingRefreshes.get(searchKey)!;
  }

  const searchPromise = (async () => {
    try {
      // Validate search parameters
      if (!searchParams.fromCode || !searchParams.toCode) {
        throw new Error('Please select both departure and arrival airports.');
      }
      if (!searchParams.departureDate) {
        throw new Error('Please select a departure date.');
      }
      if (searchParams.tripType === 'roundTrip' && !searchParams.returnDate) {
        throw new Error('Please select a return date for round-trip flights.');
      }

      // Update route tracking first
      await updateRouteTracking(searchParams);

      // Calculate price stability level
      const priceStability = calculatePriceStability(searchParams.departureDate);

      // Check system settings for API mode
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_name', 'use_incomplete_api')
        .single();

      const useIncompleteApi = settings?.setting_value ?? false;

      // Search for flights
      const response = await searchFlights(searchParams, async (progress) => {
        if (!progress.results) return;

        // Calculate prices for each flight
        const processedResults = {
          best_flights: await Promise.all(progress.results.best_flights.map(async (flight) => {
            const { data: pricing } = await supabase.rpc('calculate_flight_price', {
              p_base_price: flight.price,
              p_passengers: searchParams.passengers,
              p_trip_type: searchParams.tripType
            });
            return { ...flight, price: pricing.total_price, price_breakdown: pricing };
          })),
          other_flights: await Promise.all(progress.results.other_flights.map(async (flight) => {
            const { data: pricing } = await supabase.rpc('calculate_flight_price', {
              p_base_price: flight.price,
              p_passengers: searchParams.passengers,
              p_trip_type: searchParams.tripType
            });
            return { ...flight, price: pricing.total_price, price_breakdown: pricing };
          }))
        };

        // Log the processed results
        console.log('Processed flight results:', {
          bestFlights: processedResults.best_flights.length,
          otherFlights: processedResults.other_flights.length,
          totalFlights: processedResults.best_flights.length + processedResults.other_flights.length
        });

        // Ensure data is serializable before storing
        const serializedResults = makeCloneable(processedResults);

        // Update the search record with results
        const { error: updateError } = await supabase
          .from('saved_searches')
          .update({
            results: serializedResults,
            cached_results: serializedResults,
            cached_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours cache
            last_error: null,
            error_timestamp: null
          })
          .eq('batch_id', batchId);

        if (updateError) {
          console.error('Error updating search results:', updateError);
          throw new Error('Failed to save search results');
        }

        // Notify progress
        if (onProgress) {
          onProgress({
            ...progress,
            results: serializedResults
          });
        }
      });

      if (!response || (!response.best_flights?.length && !response.other_flights?.length)) {
        // Instead of throwing an error, return empty results
        return {
          best_flights: [],
          other_flights: []
        };
      }

      // Process final results with backend price calculation
      const processedResults = {
        best_flights: await Promise.all(response.best_flights.map(async (flight) => {
          const { data: pricing } = await supabase.rpc('calculate_flight_price', {
            p_base_price: flight.price,
            p_passengers: searchParams.passengers,
            p_trip_type: searchParams.tripType
          });
          return { ...flight, price: pricing.total_price, price_breakdown: pricing };
        })),
        other_flights: await Promise.all(response.other_flights.map(async (flight) => {
          const { data: pricing } = await supabase.rpc('calculate_flight_price', {
            p_base_price: flight.price,
            p_passengers: searchParams.passengers,
            p_trip_type: searchParams.tripType
          });
          return { ...flight, price: pricing.total_price, price_breakdown: pricing };
        }))
      };

      // Log the final processed results
      console.log('Final processed results:', {
        bestFlights: processedResults.best_flights.length,
        otherFlights: processedResults.other_flights.length,
        totalFlights: processedResults.best_flights.length + processedResults.other_flights.length
      });

      // Ensure data is serializable
      const serializedResults = makeCloneable(processedResults);

      // Calculate cache expiration (2 hours from now)
      const cacheExpiration = new Date();
      cacheExpiration.setHours(cacheExpiration.getHours() + 2);

      // Update the search record with final data
      const { error: updateError } = await supabase
        .from('saved_searches')
        .update({
          results: serializedResults,
          cached_results: serializedResults,
          cached_until: cacheExpiration.toISOString(),
          price_stability_level: priceStability,
          last_error: null,
          error_timestamp: null
        })
        .eq('batch_id', batchId);

      if (updateError) {
        console.error('Error updating search results:', updateError);
        throw new Error('Failed to save search results');
      }

      return serializedResults;
    } catch (error) {
      // Format error message for user display
      const errorMessage = formatErrorMessage(error);
      console.error('Flight search error:', errorMessage);
      
      // Update the search record with error information
      await supabase
        .from('saved_searches')
        .update({
          last_error: errorMessage,
          error_timestamp: new Date().toISOString()
        })
        .eq('batch_id', batchId);

      // Return empty results instead of throwing
      return {
        best_flights: [],
        other_flights: []
      };
    } finally {
      // Remove this refresh from ongoing refreshes
      ongoingRefreshes.delete(searchKey);
    }
  })();

  // Store the promise
  ongoingRefreshes.set(searchKey, searchPromise);

  // Return the promise
  return searchPromise;
}

export function shouldRefreshCache(cachedUntil: string | null): boolean {
  if (!cachedUntil) return true;
  return new Date() > new Date(cachedUntil);
}

export function shouldUseCache(departureDate: string): boolean {
  const departure = new Date(departureDate);
  const now = new Date();
  const daysUntilDeparture = Math.ceil((departure.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilDeparture <= 7;
}