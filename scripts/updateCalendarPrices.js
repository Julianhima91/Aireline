import { format, addMonths } from 'date-fns';
import { supabase } from '../lib/supabase';
import { fetchCalendarPrices } from '../lib/calendarPrices';

async function updateCalendarPrices() {
  try {
    console.log('🔄 Starting calendar price updates...');

    // Get routes that need updates based on demand and interval
    const { data: routes, error: routesError } = await supabase
      .from('route_update_settings')
      .select(`
        origin,
        destination,
        update_interval,
        last_update,
        search_count,
        is_ignored
      `)
      .eq('is_ignored', false)
      .order('search_count', { ascending: false });

    if (routesError) throw routesError;

    console.log(`Found ${routes?.length || 0} routes to check`);

    // Process each route
    for (const route of routes || []) {
      try {
        // Check if update is needed based on interval
        const lastUpdate = new Date(route.last_update);
        const hoursElapsed = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursElapsed < route.update_interval) {
          console.log(`Skipping ${route.origin} → ${route.destination}: Next update in ${(route.update_interval - hoursElapsed).toFixed(1)}h`);
          continue;
        }

        console.log(`\nProcessing ${route.origin} → ${route.destination}`);
        console.log(`Last updated: ${lastUpdate.toLocaleString()}`);
        console.log(`Search count: ${route.search_count}`);

        // Get current date and next few months
        const startDate = new Date();
        startDate.setDate(1); // Set to first day of month
        
        const results = {
          success: 0,
          failed: 0,
          months: [] as string[]
        };

        // Update prices for next few months
        for (let i = 0; i < 6; i++) {
          const currentDate = addMonths(startDate, i);
          const yearMonth = format(currentDate, 'yyyy-MM');

          try {
            console.log(`\nFetching prices for ${yearMonth}...`);
            
            const prices = await fetchCalendarPrices(route.origin, route.destination, yearMonth);
            
            if (prices) {
              const priceValues = Object.values(prices.priceGrid);
              const directFlights = priceValues.filter(p => p.isDirect).length;
              const indirectFlights = priceValues.filter(p => !p.isDirect).length;

              console.log(`✅ Successfully updated prices for ${yearMonth}`);
              console.log(`   Last update: ${new Date(prices.lastUpdate).toLocaleString()}`);
              console.log(`   Direct flights: ${directFlights}`);
              console.log(`   Indirect flights: ${indirectFlights}`);
              console.log(`   Total days with prices: ${priceValues.length}`);
              
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

        // Update route settings with new last_update
        const { error: updateError } = await supabase
          .from('route_update_settings')
          .update({
            last_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('origin', route.origin)
          .eq('destination', route.destination);

        if (updateError) {
          console.error('Error updating route settings:', updateError);
        }

        // Print summary for this route
        console.log('\n📊 Route Update Summary:');
        console.log(`✅ Successfully updated: ${results.success} months`);
        console.log(`❌ Failed updates: ${results.failed} months`);
        console.log('\nUpdated months:');
        results.months.forEach(month => console.log(`- ${month}`));

      } catch (routeError) {
        console.error(`Error processing route ${route.origin} → ${route.destination}:`, routeError);
      }

      // Add delay between routes
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

  } catch (error) {
    console.error('Error in price update process:', error);
    process.exit(1);
  }
}

// Run the update
updateCalendarPrices()
  .then(() => {
    console.log('\n✨ Price update process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });