/*
  # Fix Template Components Unique Constraint

  1. Changes
    - Drops and recreates unique_component_template constraint to handle component updates properly
    - Updates the component_name check constraint to include StateCityPricingComponent

  2. Security
    - No changes to RLS policies
    - Maintains existing access controls
*/

DO $$ BEGIN
  -- Drop existing constraints
  ALTER TABLE seo_template_components
    DROP CONSTRAINT IF EXISTS unique_component_template;

  ALTER TABLE seo_template_components
    DROP CONSTRAINT IF EXISTS seo_template_components_component_name_check;

  -- Recreate unique constraint with ON CONFLICT DO UPDATE behavior
  ALTER TABLE seo_template_components
    ADD CONSTRAINT unique_component_template 
    UNIQUE (template_id, component_name, display_order);

  -- Update component_name check constraint
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