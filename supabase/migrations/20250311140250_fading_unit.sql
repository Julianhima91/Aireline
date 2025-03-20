/*
  # Fix SEO Tables Constraints and Duplicates

  1. Changes
    - Fixes location formats table to handle NULL city values
    - Adds proper composite unique constraints
    - Preserves existing data while removing duplicates
    - Handles existing constraints safely

  2. Security
    - Maintains existing RLS policies
    - No changes to access controls
*/

-- Create function to handle NULL city values
CREATE OR REPLACE FUNCTION normalize_city(city text)
RETURNS text AS $$
BEGIN
  RETURN COALESCE(city, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create temporary table for location formats deduplication
CREATE TEMPORARY TABLE temp_location_formats AS
SELECT DISTINCT ON (type, normalize_city(city), state)
  *
FROM seo_location_formats
ORDER BY 
  type, 
  normalize_city(city), 
  state, 
  updated_at DESC;

-- Create temporary table for enabled states deduplication
CREATE TEMPORARY TABLE temp_enabled_states AS
SELECT DISTINCT ON (state_name)
  *
FROM seo_enabled_states
ORDER BY 
  state_name, 
  created_at DESC;

-- Begin transaction
BEGIN;

  -- Drop existing constraints if they exist
  DO $$ 
  BEGIN
    IF EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conname = 'unique_location_format'
    ) THEN
      ALTER TABLE seo_location_formats DROP CONSTRAINT unique_location_format;
    END IF;
  END $$;

  -- Safely update seo_location_formats
  DELETE FROM seo_location_formats CASCADE;
  INSERT INTO seo_location_formats 
  SELECT * FROM temp_location_formats;

  -- Create new unique index for location formats
  CREATE UNIQUE INDEX IF NOT EXISTS unique_location_format 
  ON seo_location_formats (type, (normalize_city(city)), state);

  -- Create performance index
  CREATE INDEX IF NOT EXISTS idx_location_formats_composite 
  ON seo_location_formats (type, (normalize_city(city)), state);

  -- Safely update seo_enabled_states
  -- First drop the existing unique constraint if it exists
  DO $$ 
  BEGIN
    IF EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conname = 'seo_enabled_states_state_name_key'
    ) THEN
      ALTER TABLE seo_enabled_states DROP CONSTRAINT seo_enabled_states_state_name_key;
    END IF;
  END $$;

  -- Then update the data
  DELETE FROM seo_enabled_states;
  INSERT INTO seo_enabled_states 
  SELECT * FROM temp_enabled_states;

  -- Finally recreate the unique constraint
  ALTER TABLE seo_enabled_states 
  ADD CONSTRAINT seo_enabled_states_state_name_unique UNIQUE (state_name);

COMMIT;

-- Drop temporary tables
DROP TABLE temp_location_formats;
DROP TABLE temp_enabled_states;

-- Analyze tables to update statistics
ANALYZE seo_location_formats;
ANALYZE seo_enabled_states;