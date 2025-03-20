-- Create seo_template_types table
CREATE TABLE seo_template_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE seo_template_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage template types"
  ON seo_template_types
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read template types"
  ON seo_template_types
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_template_types_updated_at
  BEFORE UPDATE ON seo_template_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX idx_template_types_slug ON seo_template_types(slug);
CREATE INDEX idx_template_types_status ON seo_template_types(status);

-- Insert default template types
INSERT INTO seo_template_types (name, slug, description, status) VALUES
  ('State → State', 'state-state', 'Template for state to state SEO pages', 'active'),
  ('City → City', 'city-city', 'Template for city to city SEO pages', 'active'),
  ('State → City', 'state-city', 'Template for state to city SEO pages', 'active'),
  ('City → State', 'city-state', 'Template for city to state SEO pages', 'active');

-- Add helpful comment
COMMENT ON TABLE seo_template_types IS 
'Stores SEO template types that define different kinds of SEO pages that can be generated';