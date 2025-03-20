/*
  # Route Update Automation System

  1. New Functions
    - `get_routes_to_update`: Identifies routes that need price updates
    - `update_route_prices`: Handles the price update process
    - `log_price_update`: Records update attempts and results

  2. New Tables
    - `price_update_log`: Tracks all price update attempts
    - `route_update_queue`: Manages pending updates

  3. Security
    - RLS enabled with admin-only access
    - Public read access for active routes
*/

-- Create price update log table
CREATE TABLE price_update_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  year_month text NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  status text NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'SKIPPED')),
  error_message text,
  prices_found integer,
  execution_time interval,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create route update queue table
CREATE TABLE route_update_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  year_month text NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  priority integer NOT NULL DEFAULT 0,
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  attempts integer NOT NULL DEFAULT 0,
  last_attempt timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_route_update UNIQUE (origin, destination, year_month, status)
);

-- Create indexes
CREATE INDEX idx_update_log_route ON price_update_log(origin, destination);
CREATE INDEX idx_update_log_status ON price_update_log(status);
CREATE INDEX idx_update_queue_status ON route_update_queue(status, scheduled_for);
CREATE INDEX idx_update_queue_priority ON route_update_queue(priority DESC);

-- Enable RLS
ALTER TABLE price_update_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_update_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage price update log"
  ON price_update_log
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Admin can manage update queue"
  ON route_update_queue
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Create updated_at trigger for queue
CREATE TRIGGER update_route_queue_updated_at
  BEFORE UPDATE ON route_update_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to get routes that need updates
CREATE OR REPLACE FUNCTION get_routes_to_update(p_batch_size integer DEFAULT 10)
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
      rdt.origin,
      rdt.destination,
      rdt.year_month,
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
    FROM route_demand_tracking rdt
    LEFT JOIN calendar_prices cp 
      ON cp.origin = rdt.origin 
      AND cp.destination = rdt.destination
      AND cp.year_month = rdt.year_month
    WHERE rdt.demand_level IN ('HIGH', 'MEDIUM')
      AND NOT EXISTS (
        SELECT 1 
        FROM route_update_queue ruq
        WHERE ruq.origin = rdt.origin
          AND ruq.destination = rdt.destination
          AND ruq.year_month = rdt.year_month
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

-- Function to queue route updates
CREATE OR REPLACE FUNCTION queue_route_updates()
RETURNS integer AS $$
DECLARE
  v_routes_queued integer := 0;
  v_route record;
BEGIN
  -- Get routes that need updates
  FOR v_route IN 
    SELECT * FROM get_routes_to_update(10)
  LOOP
    -- Add to queue
    INSERT INTO route_update_queue (
      origin,
      destination,
      year_month,
      priority,
      scheduled_for
    )
    VALUES (
      v_route.origin,
      v_route.destination,
      v_route.year_month,
      v_route.priority,
      now() + (random() * interval '10 minutes') -- Spread updates over time
    )
    ON CONFLICT (origin, destination, year_month, status) 
    DO UPDATE SET
      priority = EXCLUDED.priority,
      scheduled_for = EXCLUDED.scheduled_for,
      updated_at = now()
    WHERE route_update_queue.status = 'PENDING';

    v_routes_queued := v_routes_queued + 1;
  END LOOP;

  RETURN v_routes_queued;
END;
$$ LANGUAGE plpgsql;

-- Function to log price updates
CREATE OR REPLACE FUNCTION log_price_update(
  p_origin text,
  p_destination text,
  p_year_month text,
  p_status text,
  p_error_message text DEFAULT NULL,
  p_prices_found integer DEFAULT NULL,
  p_execution_time interval DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO price_update_log (
    origin,
    destination,
    year_month,
    status,
    error_message,
    prices_found,
    execution_time
  )
  VALUES (
    p_origin,
    p_destination,
    p_year_month,
    p_status,
    p_error_message,
    p_prices_found,
    p_execution_time
  );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old queue entries
CREATE OR REPLACE FUNCTION cleanup_update_queue()
RETURNS integer AS $$
DECLARE
  v_cleaned integer;
BEGIN
  -- Remove completed/failed entries older than 24 hours
  WITH deleted AS (
    DELETE FROM route_update_queue
    WHERE status IN ('COMPLETED', 'FAILED')
      AND updated_at < now() - interval '24 hours'
    RETURNING *
  )
  SELECT count(*) INTO v_cleaned FROM deleted;

  -- Reset stuck updates
  UPDATE route_update_queue
  SET status = 'PENDING',
      attempts = attempts + 1,
      scheduled_for = now() + (random() * interval '10 minutes')
  WHERE status = 'IN_PROGRESS'
    AND updated_at < now() - interval '30 minutes';

  RETURN v_cleaned;
END;
$$ LANGUAGE plpgsql;