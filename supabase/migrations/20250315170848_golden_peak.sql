/*
  # Optimize Route Tracking and Calendar Price Updates

  1. Changes
    - Add direct flight tracking to calendar_prices
    - Optimize route tracking for roundtrips
    - Improve route update queue processing
    - Add better indexing for performance

  2. Updates
    - Modify search_route_tracking to better handle roundtrips
    - Update route_demand_tracking calculation
    - Improve route update settings handling
*/

-- Add has_direct_flight column to calendar_prices if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_prices' 
    AND column_name = 'has_direct_flight'
  ) THEN
    ALTER TABLE calendar_prices 
    ADD COLUMN has_direct_flight boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create index for direct flight filtering
CREATE INDEX IF NOT EXISTS idx_calendar_prices_direct 
ON calendar_prices(has_direct_flight);

-- Create function to calculate route demand level
CREATE OR REPLACE FUNCTION calculate_route_demand(
  p_search_count integer
)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN p_search_count >= 30 THEN 'HIGH'
    WHEN p_search_count >= 10 THEN 'MEDIUM'
    ELSE 'LOW'
  END;
END;
$$ LANGUAGE plpgsql;

-- Create function to sync route demand tracking
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
  v_demand_level := calculate_route_demand(v_total_searches);

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

  -- Update route settings
  INSERT INTO route_update_settings (
    origin,
    destination,
    update_interval,
    is_ignored,
    search_count
  )
  VALUES (
    NEW.origin,
    NEW.destination,
    v_update_interval,
    false,
    v_total_searches
  )
  ON CONFLICT (origin, destination) 
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

-- Create trigger to sync demand when search tracking is updated
DROP TRIGGER IF EXISTS sync_route_demand_trigger ON search_route_tracking;
CREATE TRIGGER sync_route_demand_trigger
  AFTER INSERT OR UPDATE ON search_route_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_route_demand_trigger();

-- Create function to queue route updates
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

-- Create function to process route update queue
CREATE OR REPLACE FUNCTION process_route_update_queue()
RETURNS integer AS $$
DECLARE
  v_processed integer := 0;
  v_record record;
BEGIN
  -- Get pending updates that are due
  FOR v_record IN 
    SELECT * FROM route_update_queue
    WHERE status = 'PENDING'
    AND scheduled_for <= now()
    ORDER BY priority DESC, scheduled_for
    LIMIT 10
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Mark as in progress
    UPDATE route_update_queue 
    SET status = 'IN_PROGRESS',
        updated_at = now()
    WHERE id = v_record.id;

    -- Queue the update in the background
    PERFORM pg_notify(
      'route_update',
      json_build_object(
        'origin', v_record.origin,
        'destination', v_record.destination,
        'year_month', v_record.year_month
      )::text
    );

    v_processed := v_processed + 1;
  END LOOP;

  RETURN v_processed;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle route update completion
CREATE OR REPLACE FUNCTION handle_route_update_completion(
  p_queue_id uuid,
  p_success boolean,
  p_error text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update queue entry
  UPDATE route_update_queue SET
    status = CASE WHEN p_success THEN 'COMPLETED' ELSE 'FAILED' END,
    error_message = p_error,
    updated_at = now()
  WHERE id = p_queue_id;

  -- Log the update
  INSERT INTO price_update_log (
    origin,
    destination,
    year_month,
    status,
    error_message
  )
  SELECT
    origin,
    destination,
    year_month,
    CASE WHEN p_success THEN 'SUCCESS' ELSE 'FAILED' END,
    p_error
  FROM route_update_queue
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION calculate_route_demand IS 
'Calculates demand level based on search volume';

COMMENT ON FUNCTION sync_route_demand_trigger IS 
'Updates route demand tracking when search patterns change';

COMMENT ON FUNCTION queue_route_update IS 
'Queues a route for price update with priority';

COMMENT ON FUNCTION process_route_update_queue IS 
'Processes pending route updates in priority order';

COMMENT ON FUNCTION handle_route_update_completion IS 
'Handles completion of route updates and logs results';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_route_demand TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sync_route_demand_trigger TO anon, authenticated;
GRANT EXECUTE ON FUNCTION queue_route_update TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_route_update_queue TO authenticated;
GRANT EXECUTE ON FUNCTION handle_route_update_completion TO authenticated;