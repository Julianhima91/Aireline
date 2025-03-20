/*
  # Fix Template Components and Location Formats

  1. New Tables
    - Temporary tables for deduplication

  2. Changes
    - Fixes duplicate entries in seo_template_components
    - Fixes duplicate entries in seo_location_formats
    - Updates component name constraints
    - Adds proper ON DELETE CASCADE for template components

  3. Security
    - Maintains existing RLS policies
    - No changes to access controls
*/

-- First handle template components
DO $$ 
BEGIN
  -- Remove existing constraints
  ALTER TABLE seo_template_components 
    DROP CONSTRAINT IF EXISTS unique_component_template,
    DROP CONSTRAINT IF EXISTS seo_template_components_component_name_check,
    DROP CONSTRAINT IF EXISTS seo_template_components_template_id_fkey;

  -- Create temporary table for template components
  CREATE TEMPORARY TABLE temp_components AS
  SELECT DISTINCT ON (template_id, component_name)
    id,
    template_id,
    component_name,
    display_order,
    status,
    created_at,
    updated_at
  FROM seo_template_components
  ORDER BY template_id, component_name, updated_at DESC;

  -- Delete all records from main table
  DELETE FROM seo_template_components;

  -- Reinsert unique records
  INSERT INTO seo_template_components (
    id,
    template_id,
    component_name,
    display_order,
    status,
    created_at,
    updated_at
  )
  SELECT
    id,
    template_id,
    component_name,
    display_order,
    status,
    created_at,
    updated_at
  FROM temp_components;

  -- Drop temporary table
  DROP TABLE temp_components;

  -- Add updated constraints
  ALTER TABLE seo_template_components
    ADD CONSTRAINT seo_template_components_component_name_check
    CHECK (component_name = ANY (ARRAY[
      'HeaderComponent',
      'FlightSearchComponent',
      'PricingTableComponent',
      'StateCityPricingComponent',
      'RouteInfoComponent',
      'FAQComponent',
      'RelatedDestinationsComponent',
      'FooterComponent'
    ]));

  ALTER TABLE seo_template_components
    ADD CONSTRAINT seo_template_components_template_id_fkey
    FOREIGN KEY (template_id)
    REFERENCES seo_page_templates(id)
    ON DELETE CASCADE;

  ALTER TABLE seo_template_components
    ADD CONSTRAINT unique_component_template
    UNIQUE (template_id, component_name);
END $$;

-- Then handle location formats
DO $$ 
BEGIN
  -- Create temporary table for location formats
  CREATE TEMPORARY TABLE temp_formats AS
  SELECT DISTINCT ON (type, COALESCE(city, ''), state)
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
  ORDER BY type, COALESCE(city, ''), state, updated_at DESC;

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