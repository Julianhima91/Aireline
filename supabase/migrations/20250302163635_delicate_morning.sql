-- Drop existing trigger and function
DROP TRIGGER IF EXISTS process_search_prices_trigger ON saved_searches;
DROP FUNCTION IF EXISTS process_search_prices();

-- Create improved function to process flight prices when a search is saved
CREATE OR REPLACE FUNCTION process_search_prices()
RETURNS trigger AS $$
DECLARE
  v_year_month text;
  v_flight_data record;
  v_best_flights jsonb;
  v_other_flights jsonb;
BEGIN
  -- Extract year-month from departure date
  v_year_month := to_char((NEW.search_params->>'departureDate')::date, 'YYYY-MM');

  -- Get best_flights and other_flights arrays
  v_best_flights := CASE 
    WHEN jsonb_typeof(NEW.results->'best_flights') = 'array' 
    THEN NEW.results->'best_flights'
    ELSE '[]'::jsonb
  END;
  
  v_other_flights := CASE 
    WHEN jsonb_typeof(NEW.results->'other_flights') = 'array' 
    THEN NEW.results->'other_flights'
    ELSE '[]'::jsonb
  END;

  -- Get the cheapest flight from both best_flights and other_flights
  WITH all_flights AS (
    SELECT 
      (flight->>'price')::numeric as price,
      -- Extract airline from the first flight segment
      (flight->'flights'->0->>'airline') as airline,
      flight->>'type' as flight_type,
      jsonb_array_length(flight->'flights') - 1 as stops,
      (flight->>'total_duration')::integer as duration
    FROM (
      SELECT jsonb_array_elements(v_best_flights) as flight
      UNION ALL
      SELECT jsonb_array_elements(v_other_flights) as flight
    ) flights
    WHERE (flight->>'price')::numeric > 0
  ),
  cheapest_flight AS (
    SELECT 
      MIN(price) as base_price,
      airline,
      flight_type,
      stops,
      duration
    FROM all_flights
    WHERE airline IS NOT NULL -- Ensure we have airline data
    GROUP BY airline, flight_type, stops, duration
    ORDER BY base_price
    LIMIT 1
  )
  SELECT * INTO v_flight_data FROM cheapest_flight;

  -- Log processing attempt
  RAISE NOTICE 'Processing flight data for % -> % (%), Data found: %, Airline: %', 
    NEW.search_params->>'fromCode',
    NEW.search_params->>'toCode',
    v_year_month,
    v_flight_data IS NOT NULL,
    v_flight_data.airline;

  -- Only proceed if we found valid flight data
  IF v_flight_data.base_price IS NOT NULL AND v_flight_data.airline IS NOT NULL THEN
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
      base_price = CASE 
        WHEN EXCLUDED.base_price < processed_flight_prices.base_price 
        THEN EXCLUDED.base_price 
        ELSE processed_flight_prices.base_price 
      END,
      total_price = CASE 
        WHEN EXCLUDED.base_price < processed_flight_prices.base_price 
        THEN EXCLUDED.base_price + 20
        ELSE processed_flight_prices.total_price
      END,
      airline = CASE 
        WHEN EXCLUDED.base_price < processed_flight_prices.base_price 
        THEN EXCLUDED.airline 
        ELSE processed_flight_prices.airline 
      END,
      flight_type = CASE 
        WHEN EXCLUDED.base_price < processed_flight_prices.base_price 
        THEN EXCLUDED.flight_type 
        ELSE processed_flight_prices.flight_type 
      END,
      stops = CASE 
        WHEN EXCLUDED.base_price < processed_flight_prices.base_price 
        THEN EXCLUDED.stops 
        ELSE processed_flight_prices.stops 
      END,
      duration = CASE 
        WHEN EXCLUDED.base_price < processed_flight_prices.base_price 
        THEN EXCLUDED.duration 
        ELSE processed_flight_prices.duration 
      END,
      updated_at = now();

    -- Log successful processing
    RAISE NOTICE 'Successfully processed flight price: % EUR (Total: % EUR) for airline: %',
      v_flight_data.base_price,
      v_flight_data.base_price + 20,
      v_flight_data.airline;
  ELSE
    -- Log when no valid flight data is found
    RAISE NOTICE 'No valid flight data found for % -> % (%) or missing airline information',
      NEW.search_params->>'fromCode',
      NEW.search_params->>'toCode',
      v_year_month;
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
'Processes flight prices from saved searches and updates processed_flight_prices table. 
Extracts airline name from the first flight segment and combines both best_flights and 
other_flights to find the cheapest option.';

COMMENT ON TRIGGER process_search_prices_trigger ON saved_searches IS 
'Automatically processes flight prices whenever a new search is saved or results are updated';