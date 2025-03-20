-- Drop existing table and recreate with correct schema
DROP TABLE IF EXISTS seo_location_formats;

CREATE TABLE seo_location_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('city', 'state')),
  city text,
  state text,
  nga_format text,
  per_format text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('ready', 'pending', 'disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT unique_city_state UNIQUE (type, city, state),
  CONSTRAINT city_state_validation CHECK (
    (type = 'city' AND city IS NOT NULL AND state IS NOT NULL) OR
    (type = 'state' AND state IS NOT NULL AND city IS NULL)
  )
);

-- Create indexes
CREATE INDEX idx_location_formats_type ON seo_location_formats(type);
CREATE INDEX idx_location_formats_city ON seo_location_formats(city);
CREATE INDEX idx_location_formats_state ON seo_location_formats(state);
CREATE INDEX idx_location_formats_status ON seo_location_formats(status);

-- Enable RLS
ALTER TABLE seo_location_formats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage location formats"
  ON seo_location_formats
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read location formats"
  ON seo_location_formats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_location_formats_updated_at
  BEFORE UPDATE ON seo_location_formats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add helpful comments
COMMENT ON TABLE seo_location_formats IS 
'Stores SEO-friendly location formats for cities and states';

COMMENT ON COLUMN seo_location_formats.type IS 
'Type of location entry:
- city: City entry with Nga/Për formats
- state: State entry that can have multiple cities';

COMMENT ON COLUMN seo_location_formats.status IS 
'Status of the location format configuration:
- ready: OK to be used
- pending: Waiting for configuration
- disabled: Not needed';