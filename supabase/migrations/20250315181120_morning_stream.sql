-- Drop existing function
DROP FUNCTION IF EXISTS should_update_calendar_prices(text, text, text);

-- Create updated function to check if prices need update
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION should_update_calendar_prices TO anon, authenticated;

-- Add helpful comment
COMMENT ON FUNCTION should_update_calendar_prices IS 
'Determines if calendar prices need to be updated based on route demand tracking settings';