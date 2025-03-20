/*
  # Add foreign key relationships to route_demand_tracking

  1. Changes
    - Add foreign key constraints from route_demand_tracking to airports table
    - Add appropriate indexes for better query performance
    - Update RLS policies to ensure proper access control

  2. Foreign Keys
    - origin references airports(iata_code)
    - destination references airports(iata_code)
*/

-- Add foreign key constraints
ALTER TABLE route_demand_tracking
  ADD CONSTRAINT route_demand_tracking_origin_fkey 
  FOREIGN KEY (origin) 
  REFERENCES airports(iata_code)
  ON DELETE CASCADE;

ALTER TABLE route_demand_tracking
  ADD CONSTRAINT route_demand_tracking_destination_fkey 
  FOREIGN KEY (destination) 
  REFERENCES airports(iata_code)
  ON DELETE CASCADE;

-- Add indexes to improve join performance
CREATE INDEX IF NOT EXISTS idx_route_tracking_origin_fk 
  ON route_demand_tracking(origin);

CREATE INDEX IF NOT EXISTS idx_route_tracking_destination_fk 
  ON route_demand_tracking(destination);

-- Update RLS policies to ensure proper access
ALTER TABLE route_demand_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage route tracking"
  ON route_demand_tracking
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@example.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@example.com'::text);

CREATE POLICY "Public can read route tracking"
  ON route_demand_tracking
  FOR SELECT
  TO anon, authenticated
  USING (true);