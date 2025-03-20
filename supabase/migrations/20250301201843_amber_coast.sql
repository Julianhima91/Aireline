-- Create seo_page_templates table
CREATE TABLE seo_page_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type_id uuid NOT NULL REFERENCES seo_template_types(id),
  url_structure text NOT NULL,
  seo_title text NOT NULL,
  meta_description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT unique_template_type UNIQUE (template_type_id)
);

-- Enable RLS
ALTER TABLE seo_page_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage page templates"
  ON seo_page_templates
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read page templates"
  ON seo_page_templates
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_page_templates_updated_at
  BEFORE UPDATE ON seo_page_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX idx_page_templates_type ON seo_page_templates(template_type_id);

-- Insert default templates
INSERT INTO seo_page_templates (
  template_type_id,
  url_structure,
  seo_title,
  meta_description
) 
SELECT 
  id as template_type_id,
  CASE 
    WHEN slug = 'state-state' THEN '/fluturime-{state}-to-{state}/'
    WHEN slug = 'city-city' THEN '/bileta-{city}-to-{city}/'
    WHEN slug = 'state-city' THEN '/fluturime-{state}-to-{city}/'
    WHEN slug = 'city-state' THEN '/bileta-{city}-to-{state}/'
  END as url_structure,
  CASE 
    WHEN slug = 'state-state' THEN 'Fluturime {state} - {state}'
    WHEN slug = 'city-city' THEN 'Bileta Avioni {nga} në {city}'
    WHEN slug = 'state-city' THEN 'Fluturime nga {state} në {city}'
    WHEN slug = 'city-state' THEN 'Bileta Avioni {nga} në {state}'
  END as seo_title,
  CASE 
    WHEN slug = 'state-state' THEN 'Gjeni ofertat më të mira për fluturime nga {state} në {state}. ✈️ Çmime të ulëta, fluturime direkte dhe me ndalesë.'
    WHEN slug = 'city-city' THEN 'Rezervoni biletën tuaj nga {city} në {city} me çmimet më të mira! ✈️ Krahasoni fluturimet dhe zgjidhni ofertën më të mirë.'
    WHEN slug = 'state-city' THEN 'Fluturime nga {state} në {city}. ✈️ Gjeni dhe krahasoni çmimet më të mira për udhëtimin tuaj.'
    WHEN slug = 'city-state' THEN 'Bileta avioni nga {city} në {state}. ✈️ Rezervoni online me çmimet më të ulëta të garantuara.'
  END as meta_description
FROM seo_template_types;

-- Add helpful comment
COMMENT ON TABLE seo_page_templates IS 
'Stores SEO templates for different page types with URL structure, title, and meta description formats';