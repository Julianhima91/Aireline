/*
  # Add SEOHead component to template components

  1. Changes
    - Add SEOHead to allowed component names
    - Update check constraint
    - Add comment explaining component purpose

  2. Security
    - No changes to RLS policies needed
    - Maintains existing access controls
*/

-- Drop existing check constraint
ALTER TABLE seo_template_components 
DROP CONSTRAINT IF EXISTS seo_template_components_component_name_check;

-- Add updated check constraint with SEOHead
ALTER TABLE seo_template_components
ADD CONSTRAINT seo_template_components_component_name_check 
CHECK (component_name = ANY (ARRAY[
  'SEOHead',
  'HeaderComponent',
  'FlightSearchComponent',
  'PricingTableComponent',
  'StateCityPricingComponent',
  'StatePricingComponent',
  'RouteInfoComponent',
  'StateRouteInfoComponent',
  'FAQComponent',
  'StateFAQComponent',
  'RelatedDestinationsComponent',
  'FooterComponent'
]::text[]));

-- Add helpful comment
COMMENT ON CONSTRAINT seo_template_components_component_name_check 
ON seo_template_components 
IS 'Validates that component names match the available React components. SEOHead component handles meta tags and structured data.';