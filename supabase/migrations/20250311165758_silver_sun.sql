/*
  # Update template components check constraint

  1. Changes
    - Updates the check constraint for component_name to include new state-specific components
    - Adds StatePricingComponent, StateRouteInfoComponent, and StateFAQComponent as valid options

  2. Security
    - No changes to RLS policies needed
    - Maintains existing access controls
*/

-- Drop existing check constraint
ALTER TABLE seo_template_components 
DROP CONSTRAINT IF EXISTS seo_template_components_component_name_check;

-- Add updated check constraint with new component types
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