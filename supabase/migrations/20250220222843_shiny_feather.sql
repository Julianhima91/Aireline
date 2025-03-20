-- Drop existing policies
DROP POLICY IF EXISTS "Admin can manage route settings" ON route_update_settings;
DROP POLICY IF EXISTS "Allow public route settings access" ON route_update_settings;

-- Enable RLS
ALTER TABLE route_update_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public route settings access"
  ON route_update_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create admin policy (more permissive than public)
CREATE POLICY "Admin can manage route settings"
  ON route_update_settings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Grant necessary permissions
GRANT ALL ON route_update_settings TO anon;
GRANT ALL ON route_update_settings TO authenticated;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_route_settings_route 
ON route_update_settings(origin, destination);

CREATE INDEX IF NOT EXISTS idx_route_settings_last_update 
ON route_update_settings(last_update);

-- Grant execute permissions on related functions
GRANT EXECUTE ON FUNCTION sync_route_demand_trigger TO anon;
GRANT EXECUTE ON FUNCTION sync_route_demand_trigger TO authenticated;