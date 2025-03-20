/*
  # Add SEOHead component to existing templates

  1. Changes
    - Add SEOHead component to all existing templates
    - Set display order to 0 to ensure it's rendered first
    - Set status to active

  2. Notes
    - SEOHead must be first component for proper meta tag injection
    - Maintains existing component order for other components
*/

-- Insert SEOHead component for all templates
INSERT INTO seo_template_components (
  template_id,
  component_name,
  display_order,
  status
)
SELECT 
  t.id as template_id,
  'SEOHead' as component_name,
  0 as display_order,
  'active' as status
FROM seo_page_templates t
WHERE NOT EXISTS (
  SELECT 1 
  FROM seo_template_components c 
  WHERE c.template_id = t.id 
  AND c.component_name = 'SEOHead'
);

-- Update display order for existing components to make room for SEOHead
UPDATE seo_template_components
SET display_order = display_order + 1
WHERE component_name != 'SEOHead';