-- Drop tables we don't need anymore
DROP TABLE IF EXISTS route_update_queue CASCADE;
DROP TABLE IF EXISTS price_update_log CASCADE;
DROP TABLE IF EXISTS route_update_settings CASCADE;
DROP VIEW IF EXISTS route_settings_with_demand CASCADE;

-- Add new columns to route_demand_tracking
ALTER TABLE route_demand_tracking
ADD COLUMN IF NOT EXISTS update_interval integer NOT NULL DEFAULT 6 CHECK (update_interval IN (3, 6, 12, 24)),
ADD COLUMN IF NOT EXISTS is_ignored boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_price_update timestamptz;

-- Create index for demand level
CREATE INDEX IF NOT EXISTS idx_route_tracking_demand 
ON route_demand_tracking(demand_level);

-- Create index for last price update
CREATE INDEX IF NOT EXISTS idx_route_tracking_last_update
ON route_demand_tracking(last_price_update)
WHERE NOT is_ignored;

-- Update sync_route_demand_trigger to handle update intervals
CREATE OR REPLACE FUNCTION sync_route_demand_trigger()
RETURNS trigger AS $$
DECLARE
  v_total_searches integer;
  v_demand_level text;
  v_update_interval integer;
BEGIN
  -- Calculate total searches for this route and month
  SELECT COALESCE(sum(search_count), 0)
  INTO v_total_searches
  FROM search_route_tracking
  WHERE origin = NEW.origin
    AND destination = NEW.destination
    AND month = NEW.month;

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

  -- Insert or update demand tracking
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
    NEW.origin,
    NEW.destination,
    NEW.month,
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get routes that need price updates
CREATE OR REPLACE FUNCTION get_routes_needing_update(
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
  SELECT 
    rd.origin,
    rd.destination,
    rd.year_month,
    CASE rd.demand_level
      WHEN 'HIGH' THEN 3
      WHEN 'MEDIUM' THEN 2
      ELSE 1
    END * 
    CASE 
      WHEN rd.last_price_update IS NULL THEN 3
      WHEN now() >= (rd.last_price_update + (rd.update_interval || ' hours')::interval) THEN 2
      ELSE 1
    END as priority
  FROM route_demand_tracking rd
  WHERE NOT rd.is_ignored
    AND (
      rd.last_price_update IS NULL OR 
      now() >= (rd.last_price_update + (rd.update_interval || ' hours')::interval)
    )
  ORDER BY priority DESC, rd.search_count DESC
  LIMIT p_batch_size;
END;
$$ LANGUAGE plpgsql;

-- Function to update last price update timestamp
CREATE OR REPLACE FUNCTION update_route_price_timestamp(
  p_origin text,
  p_destination text,
  p_year_month text
)
RETURNS void AS $$
BEGIN
  UPDATE route_demand_tracking
  SET last_price_update = now(),
      updated_at = now()
  WHERE origin = p_origin
    AND destination = p_destination
    AND year_month = p_year_month;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE route_demand_tracking IS 
'Tracks route popularity, demand levels, and price update schedules';

COMMENT ON COLUMN route_demand_tracking.update_interval IS 
'Hours between price updates based on demand level';

COMMENT ON COLUMN route_demand_tracking.last_price_update IS 
'Timestamp of last successful price update';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_routes_needing_update TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_route_price_timestamp TO anon, authenticated;