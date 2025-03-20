/*
  # Add State-City Pricing Component to Template Components

  1. Changes
    - Updates the check constraint for seo_template_components.component_name to include StateCityPricingComponent

  2. Security
    - No changes to RLS policies
    - Maintains existing access controls
*/

DO $$ BEGIN
  -- Update the check constraint for component_name
  ALTER TABLE seo_template_components
    DROP CONSTRAINT IF EXISTS seo_template_components_component_name_check;

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
END $$;