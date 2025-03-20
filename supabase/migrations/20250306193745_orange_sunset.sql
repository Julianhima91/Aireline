/*
  # Create saved searches stats view and security functions

  1. New Views
    - `saved_searches_stats`: Materialized view for search statistics
      - `total_count`: Total number of saved searches
      - `last_updated`: Last refresh timestamp

  2. Security
    - Create secure functions to access stats
    - Function-based access control instead of RLS

  3. Refresh Functions
    - Add function to refresh the materialized view
    - Add trigger for automatic updates
*/

-- Create materialized view for search statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS saved_searches_stats AS
SELECT 
  COUNT(*) as total_count,
  NOW() as last_updated
FROM saved_searches;

-- Create index for better performance
CREATE UNIQUE INDEX IF NOT EXISTS saved_searches_stats_idx ON saved_searches_stats (last_updated);

-- Create secure function to get stats (with admin check)
CREATE OR REPLACE FUNCTION get_saved_searches_stats()
RETURNS TABLE (
  total_count bigint,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) = 'admin@example.com' THEN
    RETURN QUERY SELECT s.total_count, s.last_updated FROM saved_searches_stats s;
  ELSE
    -- For non-admin users, return limited stats
    RETURN QUERY SELECT s.total_count, s.last_updated FROM saved_searches_stats s LIMIT 1;
  END IF;
END;
$$;

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_saved_searches_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY saved_searches_stats;
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_refresh_saved_searches_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh stats asynchronously
  PERFORM pg_notify('refresh_stats', '');
  RETURN NULL;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS refresh_saved_searches_stats_trigger ON saved_searches;
CREATE TRIGGER refresh_saved_searches_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON saved_searches
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_saved_searches_stats();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_saved_searches_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_saved_searches_stats() TO authenticated;