/*
  # Fix Location Formats Migration

  1. Changes
    - Adds proper handling for upsert conflicts
    - Ensures unique combinations of type, city, and state
    - Preserves existing data while preventing duplicates

  2. Security
    - Maintains existing RLS policies
    - No changes to access controls needed
*/

-- Create a temporary table to store unique records
CREATE TEMPORARY TABLE temp_formats AS
SELECT DISTINCT ON (type, city, state)
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
ORDER BY type, city, state, updated_at DESC;

-- Delete all records from main table
DELETE FROM seo_location_formats;

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
FROM temp_formats;

-- Drop temporary table
DROP TABLE temp_formats;

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'unique_location_format'
  ) THEN
    ALTER TABLE seo_location_formats
    ADD CONSTRAINT unique_location_format
    UNIQUE (type, city, state);
  END IF;
END $$;