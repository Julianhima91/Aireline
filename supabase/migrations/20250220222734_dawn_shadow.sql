-- Drop existing policies
DROP POLICY IF EXISTS "Allow public tracking updates" ON search_route_tracking;
DROP POLICY IF EXISTS "Admin can manage route tracking" ON search_route_tracking;
DROP POLICY IF EXISTS "Allow public tracking access" ON route_demand_tracking;

-- Enable RLS
ALTER TABLE search_route_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_demand_tracking ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for search_route_tracking
CREATE POLICY "Allow public tracking updates"
  ON search_route_tracking
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create policy for route_demand_tracking
CREATE POLICY "Allow public tracking access"
  ON route_demand_tracking
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON search_route_tracking TO anon;
GRANT ALL ON search_route_tracking TO authenticated;
GRANT ALL ON route_demand_tracking TO anon;
GRANT ALL ON route_demand_tracking TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_route_tracking TO anon;
GRANT EXECUTE ON FUNCTION update_route_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION sync_route_demand_trigger TO anon;
GRANT EXECUTE ON FUNCTION sync_route_demand_trigger TO authenticated;