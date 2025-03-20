/*
  # Update template components schema

  1. Changes
    - Updates the check constraint for component_name to include all valid component types
    - Adds new state-specific components to the allowed list
    - Ensures unique component per template constraint is properly enforced

  2. Security
    - Maintains existing RLS policies
    - No changes to access controls needed
*/

-- First drop the existing constraint
ALTER TABLE seo_template_components 
DROP CONSTRAINT IF EXISTS seo_template_components_component_name_check;

-- Add updated check constraint with all valid component types
ALTER TABLE seo_template_components
ADD CONSTRAINT seo_template_components_component_name_check 
CHECK (component_name = ANY (ARRAY[
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

-- Drop and recreate the unique constraint to ensure it's properly enforced
ALTER TABLE seo_template_components 
DROP CONSTRAINT IF EXISTS unique_component_template;

ALTER TABLE seo_template_components
ADD CONSTRAINT unique_component_template 
UNIQUE (template_id, component_name);

-- Add comment explaining the constraints
COMMENT ON CONSTRAINT seo_template_components_component_name_check 
ON seo_template_components 
IS 'Validates that component names match the available React components';

COMMENT ON CONSTRAINT unique_component_template 
ON seo_template_components 
IS 'Ensures each component can only be used once per template';