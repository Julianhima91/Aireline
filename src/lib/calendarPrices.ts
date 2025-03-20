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

    // Check if we need to update prices
    const { data: shouldUpdate } = await supabase
      .rpc('should_update_calendar_prices', {
        p_origin: origin,
        p_destination: destination,
        p_year_month: yearMonth
      });

    if (!shouldUpdate && data) {
      // Convert complex price grid to simple price map for commission calculation
      const simplePriceGrid: Record<string, number> = {};
      for (const [date, priceData] of Object.entries(data.price_grid)) {
        if (typeof priceData === 'object' && 'price' in priceData) {
          simplePriceGrid[date] = priceData.price;
        }
      }

      // Get commission-adjusted prices
      const { data: adjustedPrices } = await supabase
        .rpc('get_calendar_final_prices', {
          p_base_prices: simplePriceGrid,
          p_trip_type: tripType,
          p_is_return: isReturn
        });

      // Convert back to full price grid format
      const finalPriceGrid: Record<string, { price: number; isDirect: boolean }> = {};
      for (const [date, price] of Object.entries(adjustedPrices || {})) {
        finalPriceGrid[date] = {
          price: Number(price),
          isDirect: data.price_grid[date]?.isDirect || false
        };
      }

      return {
        origin: data.origin,
        destination: data.destination,
        yearMonth: data.year_month,
        priceGrid: finalPriceGrid,
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

    // Convert to simple price map for commission calculation
    const simplePriceGrid: Record<string, number> = {};
    for (const [date, priceData] of Object.entries(priceGrid)) {
      simplePriceGrid[date] = priceData.price;
    }

    // Get commission-adjusted prices
    const { data: adjustedPrices } = await supabase
      .rpc('get_calendar_final_prices', {
        p_base_prices: simplePriceGrid,
        p_trip_type: tripType,
        p_is_return: isReturn
      });

    // Convert back to full price grid format
    const finalPriceGrid: Record<string, { price: number; isDirect: boolean }> = {};
    for (const [date, price] of Object.entries(adjustedPrices || {})) {
      finalPriceGrid[date] = {
        price: Number(price),
        isDirect: priceGrid[date]?.isDirect || false
      };
    }

    // Save base prices to database
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
      priceGrid: finalPriceGrid,
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
      }
      // Check for indirect flights with Direct price
      else if (dayData.Direct && 
               typeof dayData.Direct.Price === 'number' &&
               dayData.Direct.Price > 0) {
        priceGrid[date] = {
          price: dayData.Direct.Price,
          isDirect: false
        };
      }
      // Check for indirect flights with Indirect price
      else if (dayData.Indirect && 
               typeof dayData.Indirect.Price === 'number' &&
               dayData.Indirect.Price > 0) {
        priceGrid[date] = {
          price: dayData.Indirect.Price,
          isDirect: false
        };
      }
    } catch (err) {
      console.warn(`Error processing price for ${date}:`, err);
    }
  });

  return { priceGrid, hasDirectFlight };
}