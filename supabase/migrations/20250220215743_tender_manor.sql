-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can manage route tracking" ON search_route_tracking;
DROP POLICY IF EXISTS "Allow public tracking updates" ON search_route_tracking;

-- Enable RLS if not already enabled
ALTER TABLE search_route_tracking ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow public tracking updates"
  ON search_route_tracking
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for admin access (more permissive than public)
CREATE POLICY "Admin can manage route tracking"
  ON search_route_tracking
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_route_tracking_search_count 
ON search_route_tracking(search_count DESC);

CREATE INDEX IF NOT EXISTS idx_route_tracking_last_search 
ON search_route_tracking(last_search_at DESC);

-- Grant necessary permissions to the public role
GRANT SELECT, INSERT, UPDATE ON search_route_tracking TO anon, authenticated;