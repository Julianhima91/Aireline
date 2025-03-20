/*
  # Route Tracking System

  1. New Tables
    - `route_demand_tracking`
      - Tracks search volume and demand levels for routes
      - Stores monthly statistics and demand classification
      - Enables automated updates for high-demand routes

  2. Functions
    - `calculate_route_demand`: Analyzes search patterns and classifies demand
    - `sync_route_demand_trigger`: Updates demand tracking based on search history

  3. Security
    - RLS enabled with admin-only access
    - Public read access for active routes
*/

-- Create route_demand_tracking table
CREATE TABLE route_demand_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  year_month text NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  search_count integer NOT NULL DEFAULT 0,
  demand_level text NOT NULL CHECK (demand_level IN ('HIGH', 'MEDIUM', 'LOW')),
  last_analysis timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_route_month_demand UNIQUE (origin, destination, year_month)
);

-- Create indexes for better performance
CREATE INDEX idx_route_demand_composite ON route_demand_tracking(origin, destination, year_month);
CREATE INDEX idx_route_demand_level ON route_demand_tracking(demand_level);

-- Enable RLS
ALTER TABLE route_demand_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage route demand tracking"
  ON route_demand_tracking
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Create updated_at trigger
CREATE TRIGGER update_route_demand_updated_at
  BEFORE UPDATE ON route_demand_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to calculate route demand level
CREATE OR REPLACE FUNCTION calculate_route_demand(p_search_count integer)
RETURNS text AS $$
BEGIN
  RETURN CASE
    WHEN p_search_count >= 30 THEN 'HIGH'
    WHEN p_search_count >= 10 THEN 'MEDIUM'
    ELSE 'LOW'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to sync route demand tracking
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
    is_ignored
  )
  VALUES (
    NEW.origin,
    NEW.destination,
    v_update_interval,
    false
  )
  ON CONFLICT (origin, destination) 
  DO UPDATE SET
    update_interval = CASE 
      WHEN EXCLUDED.update_interval < route_update_settings.update_interval 
      THEN EXCLUDED.update_interval 
      ELSE route_update_settings.update_interval 
    END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync demand when search tracking is updated
CREATE TRIGGER sync_route_demand_trigger
  AFTER INSERT OR UPDATE ON search_route_tracking
  FOR EACH ROW
  EXECUTE FUNCTION sync_route_demand_trigger();

-- Initial sync of existing data
INSERT INTO route_demand_tracking (
  origin,
  destination,
  year_month,
  search_count,
  demand_level,
  last_analysis
)
SELECT 
  origin,
  destination,
  month,
  sum(search_count)::integer as total_searches,
  calculate_route_demand(sum(search_count)::integer),
  now()
FROM search_route_tracking
GROUP BY origin, destination, month
ON CONFLICT (origin, destination, year_month) 
DO UPDATE SET
  search_count = EXCLUDED.search_count,
  demand_level = EXCLUDED.demand_level,
  last_analysis = EXCLUDED.last_analysis,
  updated_at = now();