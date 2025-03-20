-- Drop existing function and trigger
DROP TRIGGER IF EXISTS process_search_prices_trigger ON saved_searches;
DROP FUNCTION IF EXISTS process_search_prices();

-- Create function to process flight prices when a search is saved
CREATE OR REPLACE FUNCTION process_search_prices()
RETURNS trigger AS $$
DECLARE
  v_year_month text;
  v_flight_data record;
BEGIN
  -- Extract year-month from departure date
  v_year_month := to_char((NEW.search_params->>'departureDate')::date, 'YYYY-MM');

  -- Get the cheapest flight from the new search results
  WITH flight_data AS (
    SELECT 
      (flight->>'price')::numeric as price,
      flight->>'airline' as airline,
      flight->>'type' as flight_type,
      jsonb_array_length(flight->'flights') - 1 as stops,
      (flight->>'total_duration')::integer as duration
    FROM jsonb_array_elements(
      CASE 
        WHEN jsonb_typeof(NEW.results->'best_flights') = 'array' 
        THEN NEW.results->'best_flights'
        ELSE '[]'::jsonb
      END
    ) as flight
    WHERE (flight->>'price')::numeric > 0
  ),
  cheapest_flight AS (
    SELECT 
      MIN(price) as base_price,
      airline,
      flight_type,
      stops,
      duration
    FROM flight_data
    GROUP BY airline, flight_type, stops, duration
    ORDER BY base_price
    LIMIT 1
  )
  SELECT * INTO v_flight_data FROM cheapest_flight;

  -- Only proceed if we found valid flight data
  IF v_flight_data.base_price IS NOT NULL THEN
    -- Insert or update processed prices
    INSERT INTO processed_flight_prices (
      origin,
      destination,
      year_month,
      base_price,
      commission,
      total_price,
      airline,
      flight_type,
      stops,
      duration
    )
    VALUES (
      NEW.search_params->>'fromCode',
      NEW.search_params->>'toCode',
      v_year_month,
      v_flight_data.base_price,
      20, -- Fixed €20 commission
      v_flight_data.base_price + 20,
      v_flight_data.airline,
      v_flight_data.flight_type,
      v_flight_data.stops,
      v_flight_data.duration
    )
    ON CONFLICT (origin, destination, year_month)
    DO UPDATE SET
      base_price = EXCLUDED.base_price,
      total_price = EXCLUDED.base_price + 20,
      airline = EXCLUDED.airline,
      flight_type = EXCLUDED.flight_type,
      stops = EXCLUDED.stops,
      duration = EXCLUDED.duration,
      updated_at = now()
    WHERE 
      -- Only update if the new price is lower
      EXCLUDED.base_price < processed_flight_prices.base_price;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to process prices on search insert/update
CREATE TRIGGER process_search_prices_trigger
  AFTER INSERT OR UPDATE OF results ON saved_searches
  FOR EACH ROW
  WHEN (NEW.results IS NOT NULL)
  EXECUTE FUNCTION process_search_prices();

-- Add helpful comments
COMMENT ON FUNCTION process_search_prices IS 
'Processes flight prices from saved searches and updates processed_flight_prices table';

COMMENT ON TRIGGER process_search_prices_trigger ON saved_searches IS 
'Automatically processes flight prices whenever a new search is saved or results are updated';