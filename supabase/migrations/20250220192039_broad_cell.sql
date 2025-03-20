/*
  # Fix route tracking function

  1. Changes
    - Drop existing functions with all parameter combinations
    - Create unique index for route tracking
    - Create updated route tracking function
    - Grant execute permissions

  2. Security
    - Function accessible to all roles
*/

-- Drop existing functions with all parameter combinations
DROP FUNCTION IF EXISTS update_route_tracking(text, text, date, date, uuid);
DROP FUNCTION IF EXISTS update_route_tracking(text, text, text, boolean);

-- Create unique index for route tracking if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'search_route_tracking' 
    AND indexname = 'idx_route_tracking_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_route_tracking_unique 
    ON search_route_tracking(origin, destination, month, departure_date);
  END IF;
END $$;

-- Create updated route tracking function
CREATE OR REPLACE FUNCTION update_route_tracking(
  p_origin text,
  p_destination text,
  p_departure_date date,
  p_return_date date,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_month text;
BEGIN
  -- Extract month in YYYY-MM format
  v_month := to_char(p_departure_date, 'YYYY-MM');
  
  -- Insert or update tracking record
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
    v_month,
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
    6, -- Default 6 hours
    false
  )
  ON CONFLICT (origin, destination) 
  DO UPDATE SET
    last_update = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION update_route_tracking(text, text, date, date, uuid) TO anon, authenticated;