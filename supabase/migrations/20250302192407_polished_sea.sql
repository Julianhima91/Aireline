-- Add default components to existing templates
INSERT INTO seo_template_components (
  template_id,
  component_name,
  display_order,
  status
)
SELECT 
  t.id as template_id,
  c.component_name,
  c.display_order,
  'active' as status
FROM seo_page_templates t
CROSS JOIN (
  VALUES 
    ('HeaderComponent', 1),
    ('FlightSearchComponent', 2),
    ('PricingTableComponent', 3),
    ('RouteInfoComponent', 4),
    ('FAQComponent', 5),
    ('RelatedDestinationsComponent', 6),
    ('FooterComponent', 7)
) as c(component_name, display_order)
ON CONFLICT (template_id, component_name) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  status = EXCLUDED.status,
  updated_at = now();

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'seo_template_components' 
    AND indexname = 'idx_template_components_template'
  ) THEN
    CREATE INDEX idx_template_components_template ON seo_template_components(template_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'seo_template_components' 
    AND indexname = 'idx_template_components_status'
  ) THEN
    CREATE INDEX idx_template_components_status ON seo_template_components(status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'seo_template_components' 
    AND indexname = 'idx_template_components_order'
  ) THEN
    CREATE INDEX idx_template_components_order ON seo_template_components(display_order);
  END IF;
END $$;