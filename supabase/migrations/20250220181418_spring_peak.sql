-- Create or replace the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to calendar prices" ON calendar_prices;
DROP POLICY IF EXISTS "Admin can manage calendar prices" ON calendar_prices;
DROP POLICY IF EXISTS "Allow public insert to calendar prices" ON calendar_prices;
DROP POLICY IF EXISTS "Allow public update to calendar prices" ON calendar_prices;

-- Create or update policies
CREATE POLICY "Allow public read access to calendar prices"
  ON calendar_prices
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to calendar prices"
  ON calendar_prices
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to calendar prices"
  ON calendar_prices
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create or replace the function to check if prices need update
CREATE OR REPLACE FUNCTION should_update_calendar_prices(
  p_origin text,
  p_destination text,
  p_year_month text
) RETURNS boolean AS $$
DECLARE
  v_last_update timestamptz;
  v_update_interval integer;
BEGIN
  -- Get the last update time and update interval for this route
  SELECT 
    cp.last_update,
    COALESCE(rus.update_interval, 6) -- Default to 6 hours if no setting
  INTO v_last_update, v_update_interval
  FROM calendar_prices cp
  LEFT JOIN route_update_settings rus 
    ON rus.origin = cp.origin 
    AND rus.destination = cp.destination
  WHERE cp.origin = p_origin 
    AND cp.destination = p_destination
    AND cp.year_month = p_year_month;

  -- If no record exists or route is not ignored, return true
  IF v_last_update IS NULL THEN
    RETURN true;
  END IF;

  -- Check if enough time has passed since last update
  RETURN (now() - v_last_update) > (v_update_interval || ' hours')::interval;
END;
$$ LANGUAGE plpgsql;

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'calendar_prices' AND indexname = 'idx_calendar_prices_route'
  ) THEN
    CREATE INDEX idx_calendar_prices_route ON calendar_prices(origin, destination);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'calendar_prices' AND indexname = 'idx_calendar_prices_month'
  ) THEN
    CREATE INDEX idx_calendar_prices_month ON calendar_prices(year_month);
  END IF;
END $$;