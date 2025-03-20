-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS saved_searches_stats;

-- Recreate materialized view with proper permissions
CREATE MATERIALIZED VIEW saved_searches_stats AS
SELECT 
  count(*) as total_count,
  count(DISTINCT user_id) as unique_users,
  max(created_at) as last_search_at
FROM saved_searches;

-- Grant necessary permissions to public role
GRANT SELECT ON saved_searches_stats TO anon;
GRANT SELECT ON saved_searches_stats TO authenticated;
GRANT SELECT ON saved_searches_stats TO service_role;

-- Create index for better performance
CREATE UNIQUE INDEX ON saved_searches_stats ((1));

-- Create function to refresh stats
CREATE OR REPLACE FUNCTION refresh_saved_searches_stats()
RETURNS trigger AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY saved_searches_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS refresh_saved_searches_stats_trigger ON saved_searches;

-- Create trigger to refresh stats
CREATE TRIGGER refresh_saved_searches_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON saved_searches
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_saved_searches_stats();

-- Grant execute permission on refresh function
GRANT EXECUTE ON FUNCTION refresh_saved_searches_stats() TO anon;
GRANT EXECUTE ON FUNCTION refresh_saved_searches_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_saved_searches_stats() TO service_role;

-- Do initial refresh
REFRESH MATERIALIZED VIEW saved_searches_stats;