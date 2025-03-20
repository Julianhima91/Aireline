import { supabase } from './supabase';
import { City } from '../types/search';

export async function searchAirports(query: string, currentAirport?: string): Promise<City[]> {
  try {
    // Use the new function that includes demand prioritization
    const { data, error } = await supabase
      .rpc('search_airports_with_demand', {
        search_query: query,
        current_airport: currentAirport
      });

    if (error) throw error;

    // Map results to City type
    return (data || []).map(airport => ({
      name: `${airport.name} (${airport.iata_code})`,
      code: airport.iata_code,
      country: airport.state
    }));
  } catch (err) {
    console.error('Error searching airports:', err);
    return [];
  }
}

export async function getPopularAirports(currentAirport?: string): Promise<City[]> {
  try {
    // Get top 10 most searched routes from route_demand_tracking
    const { data, error } = await supabase
      .from('route_demand_tracking')
      .select(`
        origin,
        destination,
        search_count,
        airports!route_demand_tracking_origin_fkey (
          name,
          city,
          state,
          iata_code
        ),
        destination_airport:airports!route_demand_tracking_destination_fkey (
          name,
          city,
          state,
          iata_code
        )
      `)
      .order('search_count', { ascending: false })
      .limit(10);

    if (error) throw error;

    // If we have a current airport, filter and sort based on it
    if (currentAirport) {
      const relevantRoutes = data
        .filter(route => 
          route.origin === currentAirport || 
          route.destination === currentAirport
        )
        .map(route => {
          // Return the opposite end of the route
          const airport = route.origin === currentAirport 
            ? route.destination_airport 
            : route.airports;
          return {
            name: `${airport.name} (${airport.iata_code})`,
            code: airport.iata_code,
            country: airport.state
          };
        });

      return relevantRoutes;
    }

    // Otherwise, return unique airports from both origins and destinations
    const uniqueAirports = new Map<string, City>();
    
    data.forEach(route => {
      // Add origin airport if not already added
      if (!uniqueAirports.has(route.origin)) {
        uniqueAirports.set(route.origin, {
          name: `${route.airports.name} (${route.airports.iata_code})`,
          code: route.airports.iata_code,
          country: route.airports.state
        });
      }
      
      // Add destination airport if not already added
      if (!uniqueAirports.has(route.destination)) {
        uniqueAirports.set(route.destination, {
          name: `${route.destination_airport.name} (${route.destination_airport.iata_code})`,
          code: route.destination_airport.iata_code,
          country: route.destination_airport.state
        });
      }
    });

    return Array.from(uniqueAirports.values());
  } catch (err) {
    console.error('Error fetching popular airports:', err);
    return [];
  }
}

export async function getAirportByCode(code: string): Promise<City | null> {
  try {
    const { data, error } = await supabase
      .from('airports')
      .select('name, city, state, iata_code')
      .eq('iata_code', code)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      name: `${data.name} (${data.iata_code})`,
      code: data.iata_code,
      country: data.state
    };
  } catch (err) {
    console.error('Error fetching airport:', err);
    return null;
  }
}