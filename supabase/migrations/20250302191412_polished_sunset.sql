-- Drop existing objects if they exist
DROP POLICY IF EXISTS "Admin can manage template components" ON seo_template_components;
DROP POLICY IF EXISTS "Public can read template components" ON seo_template_components;
DROP TRIGGER IF EXISTS update_template_components_updated_at ON seo_template_components;
DROP INDEX IF EXISTS idx_template_components_template;
DROP INDEX IF EXISTS idx_template_components_status;
DROP INDEX IF EXISTS idx_template_components_order;
DROP TABLE IF EXISTS seo_template_components CASCADE;

-- Create seo_template_components table
CREATE TABLE seo_template_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES seo_page_templates(id) ON DELETE CASCADE,
  component_name text NOT NULL CHECK (
    component_name IN (
      'HeaderComponent',
      'FlightSearchComponent',
      'PricingTableComponent',
      'RouteInfoComponent',
      'FAQComponent',
      'RelatedDestinationsComponent',
      'FooterComponent'
    )
  ),
  display_order integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT unique_component_template UNIQUE (template_id, component_name)
);

-- Enable RLS
ALTER TABLE seo_template_components ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage template components"
  ON seo_template_components
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read template components"
  ON seo_template_components
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_template_components_updated_at
  BEFORE UPDATE ON seo_template_components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX idx_template_components_template ON seo_template_components(template_id);
CREATE INDEX idx_template_components_status ON seo_template_components(status);
CREATE INDEX idx_template_components_order ON seo_template_components(display_order);

-- Add helpful comments
COMMENT ON TABLE seo_template_components IS 
'Stores component configuration for SEO page templates, including display order and status';

COMMENT ON COLUMN seo_template_components.component_name IS 
'Name of the React component file (without .tsx extension) in the seo-component-templates directory';

COMMENT ON COLUMN seo_template_components.display_order IS 
'Order in which components should be rendered on the page (1-based)';

COMMENT ON COLUMN seo_template_components.status IS 
'Component status: active = component will be rendered, inactive = component will be skipped';