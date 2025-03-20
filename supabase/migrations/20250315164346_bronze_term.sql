/*
  # Update Route Tracking for Roundtrip Searches

  1. Changes
    - Modify update_route_tracking function to handle roundtrip searches
    - Track both outbound and return legs separately
    - Update search counts for both directions
    - Add proper month handling for each leg

  2. Security
    - Maintain existing RLS policies
    - No changes to access controls needed
*/

-- Drop existing function
DROP FUNCTION IF EXISTS update_route_tracking(text, text, date, date, uuid);

-- Create updated function to handle roundtrip searches
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

  -- Update route settings for both directions
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
    6, -- Default 6 hours
    false
  )
  ON CONFLICT (origin, destination) 
  DO UPDATE SET
    last_update = now(),
    updated_at = now();

  -- For roundtrip, also update settings for return route
  IF p_return_date IS NOT NULL THEN
    INSERT INTO route_update_settings (
      origin,
      destination,
      last_update,
      update_interval,
      is_ignored
    )
    VALUES (
      p_destination,
      p_origin,
      now(),
      6, -- Default 6 hours
      false
    )
    ON CONFLICT (origin, destination) 
    DO UPDATE SET
      last_update = now(),
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION update_route_tracking IS 
'Updates route tracking statistics for both outbound and return legs of flights. 
For roundtrip flights, tracks both directions separately in their respective months.';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_route_tracking TO anon, authenticated;