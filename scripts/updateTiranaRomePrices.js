import { format, addMonths } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  'https://aoagsticdrptxxrldast.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYWdzdGljZHJwdHh4cmxkYXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NzY0NjgsImV4cCI6MjA1NTU1MjQ2OH0.rFqjJnrEGbwWL0Hv7pL3daMBsE5w4bCy4q6RoDfN_WY'
);

const API_HOST = 'sky-scanner3.p.rapidapi.com';
const API_KEY = 'eff37b01a1msh6090de6dea39514p108435jsnf7c09e43a0a5';

function processGridData(grid, yearMonth) {
  const priceGrid = {};
  
  // Validate grid structure
  if (!Array.isArray(grid) || grid.length === 0 || !Array.isArray(grid[0])) {
    console.warn('Invalid grid format received');
    return priceGrid;
  }

  // Process each day's data
  grid[0].forEach((dayData, index) => {
    // Skip if no data for this day
    if (!dayData) return;

    const day = (index + 1).toString().padStart(2, '0');
    const date = `${yearMonth}-${day}`;
    let lowestPrice = null;

    try {
      // Get price from DirectOutbound if available
      if (dayData.DirectOutboundAvailable === true && 
          dayData.DirectOutbound && 
          typeof dayData.DirectOutbound.Price === 'number' &&
          dayData.DirectOutbound.Price > 0) {
        lowestPrice = dayData.DirectOutbound.Price;
      }

      // Compare with Direct price if available
      if (dayData.Direct && 
          typeof dayData.Direct.Price === 'number' &&
          dayData.Direct.Price > 0 &&
          (lowestPrice === null || dayData.Direct.Price < lowestPrice)) {
        lowestPrice = dayData.Direct.Price;
      }

      // Only add valid prices
      if (lowestPrice !== null) {
        priceGrid[date] = lowestPrice;
      }
    } catch (err) {
      console.warn(`Error processing price for ${date}:`, err);
    }
  });

  return priceGrid;
}

async function fetchCalendarPrices(origin, destination, yearMonth) {
  try {
    // Check if we have valid cached prices
    const { data: existingData, error: fetchError } = await supabase
      .from('calendar_prices')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .eq('year_month', yearMonth)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching cached prices:', fetchError);
      return null;
    }

    // Check if we need to update prices
    const { data: shouldUpdate } = await supabase
      .rpc('should_update_calendar_prices', {
        p_origin: origin,
        p_destination: destination,
        p_year_month: yearMonth
      });

    if (!shouldUpdate && existingData) {
      return {
        origin: existingData.origin,
        destination: existingData.destination,
        yearMonth: existingData.year_month,
        priceGrid: existingData.price_grid,
        lastUpdate: existingData.last_update
      };
    }

    // Fetch new prices from API
    const response = await fetch(
      `https://${API_HOST}/flights/price-calendar-web?fromEntityId=${origin}&toEntityId=${destination}&yearMonth=${yearMonth}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
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
    const priceGrid = processGridData(responseData.data.PriceGrids.Grid, yearMonth);

    // Validate processed data
    if (Object.keys(priceGrid).length === 0) {
      throw new Error('No valid prices found in the response');
    }

    // Save to database
    const { error: upsertError } = await supabase
      .from('calendar_prices')
      .upsert({
        origin,
        destination,
        year_month: yearMonth,
        price_grid: priceGrid,
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
      priceGrid,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching calendar prices:', error);
    return null;
  }
}

async function updateTiranaRomePrices() {
  const ORIGIN = 'TIA';
  const DESTINATION = 'FCO';
  const MONTHS_TO_FETCH = 10;

  console.log(`🔄 Updating prices for ${ORIGIN} → ${DESTINATION} for the next ${MONTHS_TO_FETCH} months...`);

  try {
    // Get current date and format it
    const startDate = new Date();
    startDate.setDate(1); // Set to first day of month
    
    // Track success and failures
    const results = {
      success: 0,
      failed: 0,
      months: []
    };

    // Fetch prices for each month
    for (let i = 0; i < MONTHS_TO_FETCH; i++) {
      const currentDate = addMonths(startDate, i);
      const yearMonth = format(currentDate, 'yyyy-MM');

      try {
        console.log(`\nFetching prices for ${yearMonth}...`);
        
        const prices = await fetchCalendarPrices(ORIGIN, DESTINATION, yearMonth);
        
        if (prices && Object.keys(prices.priceGrid).length > 0) {
          const priceValues = Object.values(prices.priceGrid);
          console.log(`✅ Successfully updated prices for ${yearMonth}`);
          console.log(`   Last update: ${new Date(prices.lastUpdate).toLocaleString()}`);
          console.log(`   Days with prices: ${priceValues.length}`);
          console.log(`   Price range: ${Math.min(...priceValues)}€ - ${Math.max(...priceValues)}€`);
          
          results.success++;
          results.months.push(yearMonth);
        } else {
          console.log(`❌ Failed to fetch prices for ${yearMonth}`);
          results.failed++;
        }

        // Add a delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`Error processing ${yearMonth}:`, err);
        results.failed++;
      }
    }

    // Update route settings to track this update
    const { error: settingsError } = await supabase
      .from('route_update_settings')
      .upsert({
        origin: ORIGIN,
        destination: DESTINATION,
        last_update: new Date().toISOString(),
        update_interval: 6, // 6 hours default interval
        is_ignored: false
      }, {
        onConflict: 'origin,destination'
      });

    if (settingsError) {
      console.error('Error updating route settings:', settingsError);
    }

    // Print summary
    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${results.success} months`);
    console.log(`❌ Failed updates: ${results.failed} months`);
    console.log('\nUpdated months:');
    results.months.forEach(month => console.log(`- ${month}`));

  } catch (error) {
    console.error('Error in price update process:', error);
    process.exit(1);
  }
}

// Run the update
updateTiranaRomePrices()
  .then(() => {
    console.log('\n✨ Price update process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });