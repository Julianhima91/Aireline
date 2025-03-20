/*
  # Add StateRouteInfoComponent to template components

  1. New Component
    - Add StateRouteInfoComponent to allowed component names
    - Update validation constraint

  2. Changes
    - Modify component_name check constraint to include new component
*/

-- Add StateRouteInfoComponent to allowed component names
DO $$ 
BEGIN
  ALTER TABLE seo_template_components DROP CONSTRAINT IF EXISTS seo_template_components_component_name_check;
  
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
      'RelatedDestinationsComponent',
      'FooterComponent'
    ]));
END $$;