-- Create route_demand_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS route_demand_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  year_month text NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  search_count integer NOT NULL DEFAULT 0,
  demand_level text NOT NULL CHECK (demand_level IN ('HIGH', 'MEDIUM', 'LOW')),
  last_analysis timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  update_interval integer NOT NULL DEFAULT 6 CHECK (update_interval IN (3, 6, 12, 24)),
  is_ignored boolean NOT NULL DEFAULT false,
  last_price_update timestamptz,
  CONSTRAINT unique_route_month_demand UNIQUE (origin, destination, year_month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_route_tracking_composite 
ON route_demand_tracking(origin, destination, year_month);

CREATE INDEX IF NOT EXISTS idx_route_tracking_demand 
ON route_demand_tracking(demand_level);

CREATE INDEX IF NOT EXISTS idx_route_tracking_last_update
ON route_demand_tracking(last_price_update)
WHERE NOT is_ignored;

-- Create function to check if prices need update
CREATE OR REPLACE FUNCTION should_update_calendar_prices(
  p_origin text,
  p_destination text,
  p_year_month text
) RETURNS boolean AS $$
DECLARE
  v_last_update timestamptz;
  v_update_interval integer;
  v_is_ignored boolean;
BEGIN
  -- Get the last update time and update interval from route_demand_tracking
  SELECT 
    cp.last_update,
    rd.update_interval,
    rd.is_ignored
  INTO v_last_update, v_update_interval, v_is_ignored
  FROM calendar_prices cp
  LEFT JOIN route_demand_tracking rd 
    ON rd.origin = cp.origin 
    AND rd.destination = cp.destination
    AND rd.year_month = cp.year_month
  WHERE cp.origin = p_origin 
    AND cp.destination = p_destination
    AND cp.year_month = p_year_month;

  -- If route is ignored, don't update
  IF v_is_ignored THEN
    RETURN false;
  END IF;

  -- If no record exists or route is not ignored, return true
  IF v_last_update IS NULL THEN
    RETURN true;
  END IF;

  -- Use default 6 hour interval if not set
  v_update_interval := COALESCE(v_update_interval, 6);

  -- Check if enough time has passed since last update
  RETURN (now() - v_last_update) > (v_update_interval || ' hours')::interval;
END;
$$ LANGUAGE plpgsql;

-- Create function to update route tracking
CREATE OR REPLACE FUNCTION update_route_tracking(
  p_origin text,
  p_destination text,
  p_departure_date date,
  p_return_date date,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_outbound_month text;
  v_return_month text;
  v_last_search timestamptz;
BEGIN
  -- Extract month for outbound flight
  v_outbound_month := to_char(p_departure_date, 'YYYY-MM');
  
  -- Check if user has searched this route recently (within 30 minutes)
  IF p_user_id IS NOT NULL THEN
    SELECT last_search_at 
    INTO v_last_search
    FROM search_route_tracking
    WHERE origin = p_origin 
    AND destination = p_destination
    AND month = v_outbound_month
    AND departure_date = p_departure_date
    AND last_search_at > (now() - interval '30 minutes');
    
    -- Skip if recent search exists
    IF v_last_search IS NOT NULL THEN
      RETURN;
    END IF;
  END IF;

  -- Insert or update outbound tracking record
  INSERT INTO search_route_tracking (
    origin,
    destination,
    month,
    departure_date,
    return_date,
    search_count,
    last_search_at
  )
  VALUES (
    p_origin,
    p_destination,
    v_outbound_month,
    p_departure_date,
    p_return_date,
    1,
    now()
  )
  ON CONFLICT (origin, destination, month, departure_date) 
  DO UPDATE SET
    search_count = search_route_tracking.search_count + 1,
    last_search_at = now(),
    updated_at = now();

  -- For roundtrip flights, also track the return leg
  IF p_return_date IS NOT NULL THEN
    -- Extract month for return flight
    v_return_month := to_char(p_return_date, 'YYYY-MM');

    -- Insert or update return tracking record
    INSERT INTO search_route_tracking (
      origin,
      destination,
      month,
      departure_date,
      return_date,
      search_count,
      last_search_at
    )
    VALUES (
      p_destination, -- Swap origin/destination for return leg
      p_origin,
      v_return_month,
      p_return_date,
      NULL, -- No return date for the return leg record
      1,
      now()
    )
    ON CONFLICT (origin, destination, month, departure_date) 
    DO UPDATE SET
      search_count = search_route_tracking.search_count + 1,
      last_search_at = now(),
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION should_update_calendar_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_route_tracking TO anon, authenticated;

-- Add helpful comments
COMMENT ON TABLE route_demand_tracking IS 
'Tracks route popularity, demand levels, and price update schedules';

COMMENT ON FUNCTION should_update_calendar_prices IS 
'Determines if calendar prices need to be updated based on route demand tracking settings';

COMMENT ON FUNCTION update_route_tracking IS 
'Updates route tracking statistics for both outbound and return legs of flights';