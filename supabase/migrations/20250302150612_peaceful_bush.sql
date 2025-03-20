-- Drop existing functions first
DROP FUNCTION IF EXISTS get_cheapest_prices(text, text, integer);
DROP FUNCTION IF EXISTS process_future_prices(text, text, integer);
DROP FUNCTION IF EXISTS process_monthly_prices(text, text, text);

-- Add new columns to processed_flight_prices
ALTER TABLE processed_flight_prices
ADD COLUMN IF NOT EXISTS airline text,
ADD COLUMN IF NOT EXISTS flight_type text,
ADD COLUMN IF NOT EXISTS stops integer,
ADD COLUMN IF NOT EXISTS duration integer;

-- Create index on new columns
CREATE INDEX IF NOT EXISTS idx_processed_prices_airline ON processed_flight_prices(airline);
CREATE INDEX IF NOT EXISTS idx_processed_prices_flight_type ON processed_flight_prices(flight_type);

-- Function to extract the cheapest flight from saved searches
CREATE OR REPLACE FUNCTION get_cheapest_flight_from_searches(
  p_origin text,
  p_destination text,
  p_year_month text
) RETURNS TABLE (
  base_price numeric,
  airline text,
  flight_type text,
  stops integer,
  duration integer
) AS $$
DECLARE
  v_start_date date;
  v_end_date date;
BEGIN
  -- Convert year_month to date range
  v_start_date := (p_year_month || '-01')::date;
  v_end_date := (v_start_date + interval '1 month')::date - interval '1 day';

  RETURN QUERY
  WITH flight_data AS (
    -- Extract flight info from saved_searches results
    SELECT 
      (flight->>'price')::numeric as price,
      flight->>'airline' as airline,
      flight->>'type' as flight_type,
      array_length(flight->'flights', 1) - 1 as stops,
      (flight->>'total_duration')::integer as duration,
      flight
    FROM saved_searches ss,
    jsonb_array_elements(
      CASE 
        WHEN jsonb_typeof(ss.results->'best_flights') = 'array' 
        THEN ss.results->'best_flights'
        ELSE '[]'::jsonb
      END
    ) as flight
    WHERE ss.search_params->>'fromCode' = p_origin
      AND ss.search_params->>'toCode' = p_destination
      AND (ss.search_params->>'departureDate')::date >= v_start_date
      AND (ss.search_params->>'departureDate')::date <= v_end_date
      AND ss.results IS NOT NULL
  )
  SELECT 
    MIN(price) as base_price,
    FIRST_VALUE(airline) OVER (ORDER BY price) as airline,
    FIRST_VALUE(flight_type) OVER (ORDER BY price) as flight_type,
    FIRST_VALUE(stops) OVER (ORDER BY price) as stops,
    FIRST_VALUE(duration) OVER (ORDER BY price) as duration
  FROM flight_data
  WHERE price > 0
  GROUP BY airline, flight_type, stops, duration
  ORDER BY base_price
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to process and store cheapest prices
CREATE OR REPLACE FUNCTION process_monthly_prices(
  p_origin text,
  p_destination text,
  p_year_month text
) RETURNS void AS $$
DECLARE
  v_flight_data record;
BEGIN
  -- Get the cheapest flight data
  SELECT * INTO v_flight_data
  FROM get_cheapest_flight_from_searches(p_origin, p_destination, p_year_month);

  -- Only proceed if we found a valid price
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
      p_origin,
      p_destination,
      p_year_month,
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
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to process prices for next N months
CREATE OR REPLACE FUNCTION process_future_prices(
  p_origin text,
  p_destination text,
  p_months integer DEFAULT 4
) RETURNS void AS $$
DECLARE
  v_current_month text;
  v_month text;
  v_counter integer := 0;
BEGIN
  -- Get current month in YYYY-MM format
  v_current_month := to_char(current_date, 'YYYY-MM');
  
  -- Process each month
  WHILE v_counter < p_months LOOP
    v_month := to_char(
      (date_trunc('month', current_date) + (v_counter || ' months')::interval)::date,
      'YYYY-MM'
    );
    
    -- Process prices for this month
    PERFORM process_monthly_prices(p_origin, p_destination, v_month);
    
    v_counter := v_counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get cheapest prices for a route
CREATE OR REPLACE FUNCTION get_cheapest_prices(
  p_origin text,
  p_destination text,
  p_months integer DEFAULT 4
) RETURNS TABLE (
  year_month text,
  base_price numeric,
  commission numeric,
  total_price numeric,
  airline text,
  flight_type text,
  stops integer,
  duration integer
) AS $$
BEGIN
  -- Process prices first
  PERFORM process_future_prices(p_origin, p_destination, p_months);
  
  -- Return processed prices
  RETURN QUERY
  SELECT 
    pp.year_month,
    pp.base_price,
    pp.commission,
    pp.total_price,
    pp.airline,
    pp.flight_type,
    pp.stops,
    pp.duration
  FROM processed_flight_prices pp
  WHERE pp.origin = p_origin
    AND pp.destination = p_destination
    AND pp.year_month >= to_char(current_date, 'YYYY-MM')
  ORDER BY pp.year_month
  LIMIT p_months;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_cheapest_flight_from_searches TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_monthly_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_future_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cheapest_prices TO anon, authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_cheapest_flight_from_searches IS 
'Extracts the cheapest flight data from saved searches for a given route and month';

COMMENT ON FUNCTION get_cheapest_prices IS 
'Returns the cheapest prices and flight details for a route over the next N months, including commission';