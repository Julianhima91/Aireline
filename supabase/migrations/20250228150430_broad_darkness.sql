-- Drop existing trigger first to avoid dependency issues
DROP TRIGGER IF EXISTS refresh_saved_searches_stats_trigger ON saved_searches;

-- Then drop the function
DROP FUNCTION IF EXISTS refresh_saved_searches_stats();
DROP FUNCTION IF EXISTS admin_refresh_stats();

-- Drop the materialized view
DROP MATERIALIZED VIEW IF EXISTS saved_searches_stats;

-- Drop all existing policies first
DO $$ 
BEGIN
  -- Drop all policies on saved_searches
  DROP POLICY IF EXISTS "Anyone can create searches" ON saved_searches;
  DROP POLICY IF EXISTS "Anyone can read searches by batch_id" ON saved_searches;
  DROP POLICY IF EXISTS "Anyone can update searches" ON saved_searches;
  DROP POLICY IF EXISTS "Allow public search creation" ON saved_searches;
  DROP POLICY IF EXISTS "Allow public search viewing" ON saved_searches;
  DROP POLICY IF EXISTS "Allow public search updates" ON saved_searches;
  DROP POLICY IF EXISTS "Anyone can read searches" ON saved_searches;
  DROP POLICY IF EXISTS "Public search creation" ON saved_searches;
  DROP POLICY IF EXISTS "Public search viewing" ON saved_searches;
  DROP POLICY IF EXISTS "Public search updates" ON saved_searches;
  
  -- Create new policies only if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_searches' 
    AND policyname = 'Public search access'
  ) THEN
    CREATE POLICY "Public search access"
      ON saved_searches
      FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_saved_searches_batch_id 
ON saved_searches(batch_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at 
ON saved_searches(created_at DESC);

-- Add helpful comment explaining the permissions
COMMENT ON TABLE saved_searches IS 
'Stores flight search parameters and results. Public access is allowed to support anonymous searches and result sharing.';