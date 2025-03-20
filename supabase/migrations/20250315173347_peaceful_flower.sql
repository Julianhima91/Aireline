-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS calculate_route_demand(text, text, text);
DROP FUNCTION IF EXISTS calculate_route_demand(integer);

-- Add year_month to route_update_settings
ALTER TABLE route_update_settings 
DROP CONSTRAINT IF EXISTS route_update_settings_route_idx;

-- Add year_month column
ALTER TABLE route_update_settings 
ADD COLUMN IF NOT EXISTS year_month text CHECK (year_month ~ '^\d{4}-\d{2}$');

-- Create new composite unique constraint
ALTER TABLE route_update_settings
ADD CONSTRAINT route_settings_unique_month 
UNIQUE (origin, destination, year_month);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_route_settings_composite 
ON route_update_settings(origin, destination, year_month);

CREATE INDEX IF NOT EXISTS idx_route_settings_month 
ON route_update_settings(year_month);

-- Create function to calculate route demand level
CREATE OR REPLACE FUNCTION calculate_route_demand_by_month(
  p_origin text,
  p_destination text,
  p_year_month text
)
RETURNS text AS $$
DECLARE
  v_search_count integer;
BEGIN
  -- Get total searches for the specific route and month
  SELECT COALESCE(sum(search_count), 0)
  INTO v_search_count
  FROM search_route_tracking
  WHERE origin = p_origin
    AND destination = p_destination
    AND month = p_year_month;

  -- Calculate demand level
  RETURN CASE
    WHEN v_search_count >= 30 THEN 'HIGH'
    WHEN v_search_count >= 10 THEN 'MEDIUM'
    ELSE 'LOW'
  END;
END;
$$ LANGUAGE plpgsql;

-- Update the sync route demand trigger
CREATE OR REPLACE FUNCTION sync_route_demand_trigger()
RETURNS trigger AS $$
DECLARE
  v_demand_level text;
  v_update_interval integer;
  v_total_searches integer;
BEGIN
  -- Calculate total searches for this route and month
  SELECT COALESCE(sum(search_count), 0)
  INTO v_total_searches
  FROM search_route_tracking
  WHERE origin = NEW.origin
    AND destination = NEW.destination
    AND month = NEW.month;

  -- Calculate demand level
  v_demand_level := calculate_route_demand_by_month(NEW.origin, NEW.destination, NEW.month);

  -- Insert or update demand tracking
  INSERT INTO route_demand_tracking (
    origin,
    destination,
    year_month,
    search_count,
    demand_level,
    last_analysis
  )
  VALUES (
    NEW.origin,
    NEW.destination,
    NEW.month,
    v_total_searches,
    v_demand_level,
    now()
  )
  ON CONFLICT (origin, destination, year_month) 
  DO UPDATE SET
    search_count = EXCLUDED.search_count,
    demand_level = EXCLUDED.demand_level,
    last_analysis = EXCLUDED.last_analysis,
    updated_at = now();

  -- Set update interval based on demand level
  v_update_interval := CASE v_demand_level
    WHEN 'HIGH' THEN 3    -- Update every 3 hours
    WHEN 'MEDIUM' THEN 6  -- Update every 6 hours
    ELSE 12              -- Update every 12 hours
  END;

  -- Update route settings for specific month
  INSERT INTO route_update_settings (
    origin,
    destination,
    year_month,
    update_interval,
    is_ignored,
    search_count
  )
  VALUES (
    NEW.origin,
    NEW.destination,
    NEW.month,
    v_update_interval,
    false,
    v_total_searches
  )
  ON CONFLICT (origin, destination, year_month) 
  DO UPDATE SET
    update_interval = CASE 
      WHEN EXCLUDED.update_interval < route_update_settings.update_interval 
      THEN EXCLUDED.update_interval 
      ELSE route_update_settings.update_interval 
    END,
    search_count = EXCLUDED.search_count,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the queue route update function
CREATE OR REPLACE FUNCTION queue_route_update(
  p_origin text,
  p_destination text,
  p_year_month text,
  p_priority integer DEFAULT 0
)
RETURNS void AS $$
BEGIN
  -- Insert or update queue entry
  INSERT INTO route_update_queue (
    origin,
    destination,
    year_month,
    priority,
    scheduled_for,
    status
  )
  VALUES (
    p_origin,
    p_destination,
    p_year_month,
    p_priority,
    now() + (random() * interval '10 minutes'), -- Spread updates
    'PENDING'
  )
  ON CONFLICT (origin, destination, year_month, status) 
  DO UPDATE SET
    priority = GREATEST(EXCLUDED.priority, route_update_queue.priority),
    scheduled_for = LEAST(EXCLUDED.scheduled_for, route_update_queue.scheduled_for),
    updated_at = now()
  WHERE route_update_queue.status = 'PENDING';
END;
$$ LANGUAGE plpgsql;

-- Create function to get routes that need updates
CREATE OR REPLACE FUNCTION get_routes_to_update(
  p_batch_size integer DEFAULT 10
)
RETURNS TABLE (
  origin text,
  destination text,
  year_month text,
  priority integer
) AS $$
BEGIN
  RETURN QUERY
  WITH route_priorities AS (
    -- Calculate priority based on demand level and last update
    SELECT 
      rs.origin,
      rs.destination,
      rs.year_month,
      CASE rdt.demand_level
        WHEN 'HIGH' THEN 3
        WHEN 'MEDIUM' THEN 2
        ELSE 1
      END * 
      CASE 
        WHEN cp.last_update IS NULL THEN 3
        WHEN now() - cp.last_update > interval '24 hours' THEN 2
        ELSE 1
      END as priority
    FROM route_update_settings rs
    JOIN route_demand_tracking rdt 
      ON rdt.origin = rs.origin 
      AND rdt.destination = rs.destination
      AND rdt.year_month = rs.year_month
    LEFT JOIN calendar_prices cp 
      ON cp.origin = rs.origin 
      AND cp.destination = rs.destination
      AND cp.year_month = rs.year_month
    WHERE NOT rs.is_ignored
      AND NOT EXISTS (
        SELECT 1 
        FROM route_update_queue ruq
        WHERE ruq.origin = rs.origin
          AND ruq.destination = rs.destination
          AND ruq.year_month = rs.year_month
          AND ruq.status IN ('PENDING', 'IN_PROGRESS')
      )
  )
  SELECT 
    rp.origin,
    rp.destination,
    rp.year_month,
    rp.priority
  FROM route_priorities rp
  ORDER BY rp.priority DESC
  LIMIT p_batch_size;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION calculate_route_demand_by_month IS 
'Calculates demand level for a specific route and month based on search volume';

COMMENT ON FUNCTION sync_route_demand_trigger IS 
'Updates route demand tracking and settings when search patterns change';

COMMENT ON FUNCTION queue_route_update IS 
'Queues a route for price update with priority for a specific month';

COMMENT ON FUNCTION get_routes_to_update IS 
'Returns routes that need updates based on demand and update frequency';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_route_demand_by_month TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sync_route_demand_trigger TO anon, authenticated;
GRANT EXECUTE ON FUNCTION queue_route_update TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_routes_to_update TO authenticated;