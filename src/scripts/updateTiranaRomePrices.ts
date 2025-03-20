import { format, addMonths } from 'date-fns';
import { supabase } from '../lib/supabase';
import { fetchCalendarPrices } from '../lib/calendarPrices';

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
      months: [] as string[]
    };

    // Fetch prices for each month
    for (let i = 0; i < MONTHS_TO_FETCH; i++) {
      const currentDate = addMonths(startDate, i);
      const yearMonth = format(currentDate, 'yyyy-MM');

      try {
        console.log(`\nFetching prices for ${yearMonth}...`);
        
        const prices = await fetchCalendarPrices(ORIGIN, DESTINATION, yearMonth);
        
        if (prices) {
          console.log(`✅ Successfully updated prices for ${yearMonth}`);
          console.log(`   Last update: ${new Date(prices.lastUpdate).toLocaleString()}`);
          console.log(`   Days with prices: ${Object.keys(prices.priceGrid).length}`);
          
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