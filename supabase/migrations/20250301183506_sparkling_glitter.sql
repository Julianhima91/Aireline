-- Create seo_location_formats table
CREATE TABLE seo_location_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  nga_format text,
  per_format text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT unique_city_state UNIQUE (city, state)
);

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

-- Create indexes
CREATE INDEX idx_location_formats_city ON seo_location_formats(city);
CREATE INDEX idx_location_formats_state ON seo_location_formats(state);

-- Add helpful comment
COMMENT ON TABLE seo_location_formats IS 
'Stores custom "Nga" and "Për" formats for cities in SEO-enabled states.';