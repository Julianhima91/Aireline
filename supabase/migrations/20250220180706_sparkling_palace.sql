-- Create function to check if route is ignored
CREATE OR REPLACE FUNCTION is_route_ignored(
  p_origin text,
  p_destination text
) RETURNS boolean AS $$
DECLARE
  v_is_ignored boolean;
BEGIN
  SELECT is_ignored INTO v_is_ignored
  FROM route_update_settings
  WHERE origin = p_origin 
    AND destination = p_destination;
  
  RETURN COALESCE(v_is_ignored, false);
END;
$$ LANGUAGE plpgsql;

-- Create function to get route update interval
CREATE OR REPLACE FUNCTION get_route_update_interval(
  p_origin text,
  p_destination text
) RETURNS integer AS $$
DECLARE
  v_interval integer;
BEGIN
  SELECT update_interval INTO v_interval
  FROM route_update_settings
  WHERE origin = p_origin 
    AND destination = p_destination;
  
  RETURN COALESCE(v_interval, 6); -- Default to 6 hours
END;
$$ LANGUAGE plpgsql;

-- Create function to update route tracking
CREATE OR REPLACE FUNCTION update_route_tracking(
  p_origin text,
  p_destination text,
  p_year_month text,
  p_success boolean
) RETURNS void AS $$
BEGIN
  -- Update route settings
  INSERT INTO route_update_settings (
    origin,
    destination,
    last_update,
    update_interval,
    is_ignored
  )
  VALUES (
    p_origin,
    p_destination,
    now(),
    6, -- Default interval
    false
  )
  ON CONFLICT (origin, destination) 
  DO UPDATE SET
    last_update = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;