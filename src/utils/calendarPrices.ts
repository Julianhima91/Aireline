import { supabase } from './supabase';

interface CalendarPrices {
  origin: string;
  destination: string;
  yearMonth: string;
  priceGrid: Record<string, {
    price: number;
    isDirect: boolean;
  }>;
  lastUpdate: string;
  hasDirectFlight: boolean;
}

interface PriceGridDay {
  DirectOutboundAvailable: boolean;
  DirectOutbound?: {
    Price: number;
  };
  Direct?: {
    Price: number;
  };
  Indirect?: {
    Price: number;
  };
}

export async function getCalendarPrices(
  origin: string,
  destination: string,
  yearMonth: string,
  tripType: 'oneWay' | 'roundTrip' = 'oneWay',
  isReturn: boolean = false
): Promise<CalendarPrices | null> {
  try {
    // Check if we have valid cached prices
    const { data, error } = await supabase
      .from('calendar_prices')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .eq('year_month', yearMonth)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Check if we need to update prices
    const { data: shouldUpdate } = await supabase
      .rpc('should_update_calendar_prices', {
        p_origin: origin,
        p_destination: destination,
        p_year_month: yearMonth
      });

    if (!shouldUpdate && data) {
      // Apply commission to cached prices
      const priceGridWithCommission = await applyCommissionToPriceGrid(
        data.price_grid,
        tripType,
        isReturn
      );

      return {
        origin: data.origin,
        destination: data.destination,
        yearMonth: data.year_month,
        priceGrid: priceGridWithCommission,
        lastUpdate: data.last_update,
        hasDirectFlight: data.has_direct_flight
      };
    }

    // Fetch new prices from API
    const response = await fetch(
      `https://sky-scanner3.p.rapidapi.com/flights/price-calendar-web?fromEntityId=${origin}&toEntityId=${destination}&yearMonth=${yearMonth}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'sky-scanner3.p.rapidapi.com',
          'x-rapidapi-key': 'eff37b01a1msh6090de6dea39514p108435jsnf7c09e43a0a5'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const responseData = await response.json();

    // Validate response structure
    if (!responseData.status || !responseData.data) {
      throw new Error('Invalid API response format: Missing status or data');
    }

    if (!responseData.data.PriceGrids?.Grid) {
      throw new Error('Invalid API response format: Missing price grid data');
    }

    // Process the price grid data
    const { priceGrid, hasDirectFlight } = processGridData(responseData.data.PriceGrids.Grid, yearMonth);

    // Apply commission to new prices
    const priceGridWithCommission = await applyCommissionToPriceGrid(
      priceGrid,
      tripType,
      isReturn
    );

    // Save to database
    const { error: upsertError } = await supabase
      .from('calendar_prices')
      .upsert({
        origin,
        destination,
        year_month: yearMonth,
        price_grid: priceGrid,
        has_direct_flight: hasDirectFlight,
        last_update: new Date().toISOString()
      }, {
        onConflict: 'origin,destination,year_month'
      });

    if (upsertError) {
      console.error('Error saving prices:', upsertError);
      return null;
    }

    return {
      origin,
      destination,
      yearMonth,
      priceGrid: priceGridWithCommission,
      lastUpdate: new Date().toISOString(),
      hasDirectFlight
    };
  } catch (error) {
    console.error('Error fetching calendar prices:', error);
    return null;
  }
}

// Export fetchCalendarPrices as an alias of getCalendarPrices
export const fetchCalendarPrices = getCalendarPrices;

interface ProcessedGridData {
  priceGrid: Record<string, {
    price: number;
    isDirect: boolean;
  }>;
  hasDirectFlight: boolean;
}

function processGridData(grid: PriceGridDay[][], yearMonth: string): ProcessedGridData {
  const priceGrid: Record<string, { price: number; isDirect: boolean }> = {};
  let hasDirectFlight = false;
  
  // Validate grid structure
  if (!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0])) {
    console.warn('Invalid grid format received');
    return { priceGrid, hasDirectFlight };
  }

  // Process each day's data
  grid[0].forEach((dayData, index) => {
    // Skip if no data for this day
    if (!dayData) return;

    const day = (index + 1).toString().padStart(2, '0');
    const date = `${yearMonth}-${day}`;

    try {
      // Check for direct flights first
      if (dayData.DirectOutboundAvailable === true && 
          dayData.DirectOutbound && 
          typeof dayData.DirectOutbound.Price === 'number' &&
          dayData.DirectOutbound.Price > 0) {
        hasDirectFlight = true;
        priceGrid[date] = {
          price: dayData.DirectOutbound.Price,
          isDirect: true
        };
        console.log(`Found direct flight for ${date}:`, dayData.DirectOutbound.Price);
      }
      // Check for indirect flights with Direct price
      else if (dayData.Direct && 
               typeof dayData.Direct.Price === 'number' &&
               dayData.Direct.Price > 0) {
        priceGrid[date] = {
          price: dayData.Direct.Price,
          isDirect: false
        };
        console.log(`Found indirect flight (Direct) for ${date}:`, dayData.Direct.Price);
      }
      // Check for indirect flights with Indirect price
      else if (dayData.Indirect && 
               typeof dayData.Indirect.Price === 'number' &&
               dayData.Indirect.Price > 0) {
        priceGrid[date] = {
          price: dayData.Indirect.Price,
          isDirect: false
        };
        console.log(`Found indirect flight (Indirect) for ${date}:`, dayData.Indirect.Price);
      }
    } catch (err) {
      console.warn(`Error processing price for ${date}:`, err);
    }
  });

  // Log summary
  console.log('Processed grid data:', {
    totalDays: Object.keys(priceGrid).length,
    directFlights: Object.values(priceGrid).filter(p => p.isDirect).length,
    indirectFlights: Object.values(priceGrid).filter(p => !p.isDirect).length,
    hasDirectFlight
  });

  return { priceGrid, hasDirectFlight };
}

async function applyCommissionToPriceGrid(
  priceGrid: Record<string, { price: number; isDirect: boolean }>,
  tripType: 'oneWay' | 'roundTrip',
  isReturn: boolean
): Promise<Record<string, { price: number; isDirect: boolean }>> {
  try {
    // Get commission amount from Supabase function
    const { data: commission } = await supabase
      .rpc('get_calendar_commission', {
        p_trip_type: tripType,
        p_is_return: isReturn
      });

    // If commission calculation failed, return original prices
    if (!commission) {
      console.warn('Failed to get commission amount, using original prices');
      return priceGrid;
    }

    // Apply commission to each price
    const result: Record<string, { price: number; isDirect: boolean }> = {};
    for (const [date, priceData] of Object.entries(priceGrid)) {
      result[date] = {
        price: priceData.price + commission,
        isDirect: priceData.isDirect
      };
    }

    return result;
  } catch (err) {
    console.error('Error applying commission:', err);
    return priceGrid; // Return original prices on error
  }
}