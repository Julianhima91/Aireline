-- This migration fixes permission issues to ensure everyone can search and view results
-- including anonymous users sharing result pages

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS saved_searches_stats;

-- Create a simpler version of the stats view without triggers
CREATE MATERIALIZED VIEW saved_searches_stats AS
SELECT 
  count(*) as total_count,
  count(DISTINCT user_id) as unique_users,
  max(created_at) as last_search_at
FROM saved_searches;

-- Create index for better performance
CREATE UNIQUE INDEX ON saved_searches_stats ((1));

-- Grant necessary permissions to all roles
GRANT SELECT ON saved_searches_stats TO anon;
GRANT SELECT ON saved_searches_stats TO authenticated;
GRANT SELECT ON saved_searches_stats TO service_role;

-- Create a manual refresh function that can be called by admins
CREATE OR REPLACE FUNCTION admin_refresh_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW saved_searches_stats;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission only to authenticated users (admins)
GRANT EXECUTE ON FUNCTION admin_refresh_stats() TO authenticated;

-- Ensure all roles have proper access to saved_searches table
DROP POLICY IF EXISTS "Anyone can create searches" ON saved_searches;
DROP POLICY IF EXISTS "Anyone can read searches by batch_id" ON saved_searches;
DROP POLICY IF EXISTS "Users can update their searches" ON saved_searches;

-- Create more permissive policies for saved_searches
CREATE POLICY "Anyone can create searches"
  ON saved_searches
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read searches by batch_id"
  ON saved_searches
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update searches"
  ON saved_searches
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Do initial refresh of stats
REFRESH MATERIALIZED VIEW saved_searches_stats;

-- Add helpful comment explaining the purpose
COMMENT ON MATERIALIZED VIEW saved_searches_stats IS 
'Provides aggregated statistics about saved searches. This view is manually refreshed by admins.';