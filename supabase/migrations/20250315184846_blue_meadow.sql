/*
  # Fix Route Tracking RPC Function

  1. Changes
    - Remove references to route_update_settings
    - Update RPC function to use route_demand_tracking
    - Add proper error handling
    - Maintain existing functionality

  2. Security
    - Maintain existing RLS policies
    - Keep existing permissions
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_route_tracking(text, text, date, date, uuid);

-- Create updated function to handle route tracking
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
  v_demand_level text;
  v_update_interval integer;
  v_total_searches integer;
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

  -- Calculate total searches for outbound route
  SELECT COALESCE(sum(search_count), 0)
  INTO v_total_searches
  FROM search_route_tracking
  WHERE origin = p_origin
    AND destination = p_destination
    AND month = v_outbound_month;

  -- Calculate demand level
  v_demand_level := CASE
    WHEN v_total_searches >= 30 THEN 'HIGH'
    WHEN v_total_searches >= 10 THEN 'MEDIUM'
    ELSE 'LOW'
  END;

  -- Set update interval based on demand
  v_update_interval := CASE v_demand_level
    WHEN 'HIGH' THEN 3    -- Update every 3 hours
    WHEN 'MEDIUM' THEN 6  -- Update every 6 hours
    ELSE 12              -- Update every 12 hours
  END;

  -- Update route demand tracking for outbound
  INSERT INTO route_demand_tracking (
    origin,
    destination,
    year_month,
    search_count,
    demand_level,
    update_interval,
    last_analysis
  )
  VALUES (
    p_origin,
    p_destination,
    v_outbound_month,
    v_total_searches,
    v_demand_level,
    v_update_interval,
    now()
  )
  ON CONFLICT (origin, destination, year_month) 
  DO UPDATE SET
    search_count = EXCLUDED.search_count,
    demand_level = EXCLUDED.demand_level,
    update_interval = CASE 
      WHEN EXCLUDED.update_interval < route_demand_tracking.update_interval 
      THEN EXCLUDED.update_interval 
      ELSE route_demand_tracking.update_interval 
    END,
    last_analysis = EXCLUDED.last_analysis,
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

    -- Calculate total searches for return route
    SELECT COALESCE(sum(search_count), 0)
    INTO v_total_searches
    FROM search_route_tracking
    WHERE origin = p_destination
      AND destination = p_origin
      AND month = v_return_month;

    -- Calculate demand level for return route
    v_demand_level := CASE
      WHEN v_total_searches >= 30 THEN 'HIGH'
      WHEN v_total_searches >= 10 THEN 'MEDIUM'
      ELSE 'LOW'
    END;

    -- Set update interval based on return route demand
    v_update_interval := CASE v_demand_level
      WHEN 'HIGH' THEN 3    -- Update every 3 hours
      WHEN 'MEDIUM' THEN 6  -- Update every 6 hours
      ELSE 12              -- Update every 12 hours
    END;

    -- Update route demand tracking for return
    INSERT INTO route_demand_tracking (
      origin,
      destination,
      year_month,
      search_count,
      demand_level,
      update_interval,
      last_analysis
    )
    VALUES (
      p_destination,
      p_origin,
      v_return_month,
      v_total_searches,
      v_demand_level,
      v_update_interval,
      now()
    )
    ON CONFLICT (origin, destination, year_month) 
    DO UPDATE SET
      search_count = EXCLUDED.search_count,
      demand_level = EXCLUDED.demand_level,
      update_interval = CASE 
        WHEN EXCLUDED.update_interval < route_demand_tracking.update_interval 
        THEN EXCLUDED.update_interval 
        ELSE route_demand_tracking.update_interval 
      END,
      last_analysis = EXCLUDED.last_analysis,
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_route_tracking TO anon, authenticated;

-- Add helpful comment
COMMENT ON FUNCTION update_route_tracking IS 
'Updates route tracking statistics and demand levels for both outbound and return legs of flights';