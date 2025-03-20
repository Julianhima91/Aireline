/*
  # Fix Template Components Migration

  1. Changes
    - Removes duplicates while preserving data integrity
    - Updates component name check constraint
    - Adds cascade delete for template components
    - Ensures unique components per template

  2. Security
    - Maintains existing RLS policies
    - No changes to access controls needed
*/

-- First, create a temporary table to store the first occurrence of each combination
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
ORDER BY template_id, component_name, display_order;

-- Delete all records from main table
DELETE FROM seo_template_components;

-- Drop existing constraints
ALTER TABLE seo_template_components 
  DROP CONSTRAINT IF EXISTS unique_component_template,
  DROP CONSTRAINT IF EXISTS seo_template_components_component_name_check,
  DROP CONSTRAINT IF EXISTS seo_template_components_template_id_fkey;

-- Add updated component_name check constraint
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

-- Add foreign key with cascade delete
ALTER TABLE seo_template_components
  ADD CONSTRAINT seo_template_components_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES seo_page_templates(id)
  ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE seo_template_components
  ADD CONSTRAINT unique_component_template
  UNIQUE (template_id, component_name);

-- Reinsert unique records from temporary table
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