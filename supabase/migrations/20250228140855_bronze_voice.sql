-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at 
ON saved_searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_batch_id 
ON saved_searches(batch_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id 
ON saved_searches(user_id);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_saved_searches_composite
ON saved_searches(created_at DESC, batch_id, user_id);

-- Create materialized view for faster counts
CREATE MATERIALIZED VIEW IF NOT EXISTS saved_searches_stats AS
SELECT 
  count(*) as total_count,
  count(DISTINCT user_id) as unique_users,
  max(created_at) as last_search_at
FROM saved_searches;

-- Create function to refresh stats
CREATE OR REPLACE FUNCTION refresh_saved_searches_stats()
RETURNS trigger AS $$
BEGIN
  -- Use a non-concurrent refresh if the view doesn't exist yet
  IF (SELECT to_regclass('saved_searches_stats') IS NULL) THEN
    REFRESH MATERIALIZED VIEW saved_searches_stats;
  ELSE
    REFRESH MATERIALIZED VIEW CONCURRENTLY saved_searches_stats;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh stats
DROP TRIGGER IF EXISTS refresh_saved_searches_stats_trigger ON saved_searches;
CREATE TRIGGER refresh_saved_searches_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON saved_searches
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_saved_searches_stats();

-- Grant necessary permissions
GRANT SELECT ON saved_searches_stats TO anon, authenticated;

-- Create function to cleanup old searches
CREATE OR REPLACE FUNCTION cleanup_old_searches()
RETURNS void AS $$
BEGIN
  -- Delete searches older than 30 days
  DELETE FROM saved_searches 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Refresh stats after cleanup
  REFRESH MATERIALIZED VIEW saved_searches_stats;
END;
$$ LANGUAGE plpgsql;

-- Create date-based index for efficient cleanup (without using function in expression)
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_date
ON saved_searches(created_at);