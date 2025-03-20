-- Create processed_flight_prices table
CREATE TABLE processed_flight_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  year_month text NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  base_price numeric NOT NULL,
  commission numeric NOT NULL DEFAULT 20,
  total_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processed_prices_route_month_key UNIQUE (origin, destination, year_month)
);

-- Create indexes for better performance
CREATE INDEX idx_processed_prices_route ON processed_flight_prices(origin, destination);
CREATE INDEX idx_processed_prices_month ON processed_flight_prices(year_month);

-- Enable RLS
ALTER TABLE processed_flight_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read processed prices"
  ON processed_flight_prices
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage processed prices"
  ON processed_flight_prices
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Create updated_at trigger
CREATE TRIGGER update_processed_prices_updated_at
  BEFORE UPDATE ON processed_flight_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to process and store cheapest prices
CREATE OR REPLACE FUNCTION process_monthly_prices(
  p_origin text,
  p_destination text,
  p_year_month text
) RETURNS void AS $$
DECLARE
  v_base_price numeric;
BEGIN
  -- Get the cheapest price for the month
  SELECT MIN((jsonb_each_text(price_grid)->>'value')::numeric)
  INTO v_base_price
  FROM calendar_prices
  WHERE origin = p_origin
    AND destination = p_destination
    AND year_month = p_year_month;

  -- Only proceed if we found a valid price
  IF v_base_price IS NOT NULL THEN
    -- Insert or update processed prices
    INSERT INTO processed_flight_prices (
      origin,
      destination,
      year_month,
      base_price,
      commission,
      total_price
    )
    VALUES (
      p_origin,
      p_destination,
      p_year_month,
      v_base_price,
      20, -- Fixed €20 commission
      v_base_price + 20
    )
    ON CONFLICT (origin, destination, year_month)
    DO UPDATE SET
      base_price = EXCLUDED.base_price,
      total_price = EXCLUDED.base_price + 20,
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
  total_price numeric
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
    pp.total_price
  FROM processed_flight_prices pp
  WHERE pp.origin = p_origin
    AND pp.destination = p_destination
    AND pp.year_month >= to_char(current_date, 'YYYY-MM')
  ORDER BY pp.year_month
  LIMIT p_months;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_monthly_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_future_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cheapest_prices TO anon, authenticated;

-- Add helpful comments
COMMENT ON TABLE processed_flight_prices IS 
'Stores pre-processed cheapest flight prices with commission for SEO pages';

COMMENT ON FUNCTION get_cheapest_prices IS 
'Returns the cheapest prices for a route over the next N months, including commission';