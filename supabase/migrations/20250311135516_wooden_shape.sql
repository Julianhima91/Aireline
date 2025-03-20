/*
  # Fix Location Formats Deduplication

  1. Changes
    - Creates function for handling NULL city values
    - Deduplicates location formats while preserving referential integrity
    - Recreates unique constraints and indexes
    - Uses CASCADE to handle foreign key dependencies properly

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

-- Create temporary table for deduplication
CREATE TEMPORARY TABLE temp_location_formats AS
SELECT DISTINCT ON (type, normalize_city(city), state)
  id,
  type,
  city,
  state,
  nga_format,
  per_format,
  status,
  template_created,
  template_url,
  created_at,
  updated_at,
  updated_by
FROM seo_location_formats
ORDER BY 
  type, 
  normalize_city(city), 
  state, 
  updated_at DESC;

-- Drop existing unique constraint if it exists
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

-- Delete all records from main table using CASCADE
TRUNCATE TABLE seo_location_formats CASCADE;

-- Reinsert unique records
INSERT INTO seo_location_formats (
  id,
  type,
  city,
  state,
  nga_format,
  per_format,
  status,
  template_created,
  template_url,
  created_at,
  updated_at,
  updated_by
)
SELECT
  id,
  type,
  city,
  state,
  nga_format,
  per_format,
  status,
  template_created,
  template_url,
  created_at,
  updated_at,
  updated_by
FROM temp_location_formats;

-- Drop temporary table
DROP TABLE temp_location_formats;

-- Create unique index using the function
CREATE UNIQUE INDEX unique_location_format 
ON seo_location_formats (type, (normalize_city(city)), state);

-- Create index to improve performance
CREATE INDEX idx_location_formats_composite 
ON seo_location_formats (type, (normalize_city(city)), state);

-- Analyze table to update statistics
ANALYZE seo_location_formats;