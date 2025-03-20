-- Drop existing functions first
DROP FUNCTION IF EXISTS generate_template_url(text, text, text, text, text);
DROP FUNCTION IF EXISTS generate_template_url(text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS generate_seo_template(uuid);
DROP FUNCTION IF EXISTS has_valid_route_connection(uuid, uuid);

-- Create seo_location_connections table
CREATE TABLE seo_location_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location_id uuid NOT NULL REFERENCES seo_location_formats(id) ON DELETE CASCADE,
  to_location_id uuid NOT NULL REFERENCES seo_location_formats(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT unique_connection UNIQUE (from_location_id, to_location_id),
  CONSTRAINT no_self_connections CHECK (from_location_id != to_location_id)
);

-- Enable RLS
ALTER TABLE seo_location_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage location connections"
  ON seo_location_connections
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read location connections"
  ON seo_location_connections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_location_connections_updated_at
  BEFORE UPDATE ON seo_location_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX idx_location_connections_from ON seo_location_connections(from_location_id);
CREATE INDEX idx_location_connections_to ON seo_location_connections(to_location_id);
CREATE INDEX idx_location_connections_status ON seo_location_connections(status);

-- Create function to check if a route connection exists
CREATE FUNCTION has_valid_route_connection(
  p_from_location_id uuid,
  p_to_location_id uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM seo_location_connections
    WHERE from_location_id = p_from_location_id
      AND to_location_id = p_to_location_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to generate template URL
CREATE FUNCTION generate_template_url(
  p_type text,
  p_from_city text,
  p_from_state text,
  p_to_city text,
  p_to_state text,
  p_nga_format text,
  p_per_format text
) RETURNS text AS $$
DECLARE
  v_template_type_id uuid;
  v_template_id uuid;
  v_url_structure text;
  v_from_code text;
  v_to_code text;
BEGIN
  -- Get template type ID based on location type
  SELECT id INTO v_template_type_id
  FROM seo_template_types
  WHERE slug = CASE 
    WHEN p_type = 'city' THEN 'city-city'
    WHEN p_type = 'state' THEN 'state-state'
  END
  AND status = 'active'
  LIMIT 1;

  IF v_template_type_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get URL structure from template
  SELECT id, url_structure 
  INTO v_template_id, v_url_structure
  FROM seo_page_templates
  WHERE template_type_id = v_template_type_id
  LIMIT 1;

  -- Get airport codes for cities
  IF p_type = 'city' THEN
    SELECT iata_code INTO v_from_code
    FROM airports
    WHERE city = p_from_city AND state = p_from_state
    LIMIT 1;

    SELECT iata_code INTO v_to_code
    FROM airports
    WHERE city = p_to_city AND state = p_to_state
    LIMIT 1;
  END IF;

  -- For cities, use IATA codes in URL
  IF p_type = 'city' AND v_from_code IS NOT NULL AND v_to_code IS NOT NULL THEN
    RETURN '/bileta-avioni-' || LOWER(v_from_code) || '-ne-' || LOWER(v_to_code);
  END IF;

  -- For states, use state names in URL
  RETURN '/fluturime-' || 
         LOWER(REPLACE(p_from_state, ' ', '-')) || 
         '-ne-' || 
         LOWER(REPLACE(p_to_state, ' ', '-'));
END;
$$ LANGUAGE plpgsql;

-- Create function to generate SEO template
CREATE FUNCTION generate_seo_template(
  p_location_id uuid
) RETURNS void AS $$
DECLARE
  v_location record;
  v_template_type_id uuid;
  v_template_id uuid;
  v_url text;
  v_to_location record;
BEGIN
  -- Get location details
  SELECT * INTO v_location
  FROM seo_location_formats
  WHERE id = p_location_id;

  IF v_location IS NULL THEN
    RAISE EXCEPTION 'Location not found';
  END IF;

  -- Only proceed if status is 'ready'
  IF v_location.status != 'ready' THEN
    RETURN;
  END IF;

  -- Get template type ID
  SELECT id INTO v_template_type_id
  FROM seo_template_types
  WHERE slug = CASE 
    WHEN v_location.type = 'city' THEN 'city-city'
    WHEN v_location.type = 'state' THEN 'state-state'
  END
  AND status = 'active'
  LIMIT 1;

  IF v_template_type_id IS NULL THEN
    RAISE EXCEPTION 'Template type not found';
  END IF;

  -- Process each valid connection
  FOR v_to_location IN
    SELECT lf.*
    FROM seo_location_formats lf
    JOIN seo_location_connections lc ON lc.to_location_id = lf.id
    WHERE lc.from_location_id = p_location_id
      AND lc.status = 'active'
      AND lf.status = 'ready'
  LOOP
    -- Generate URL for this connection
    v_url := generate_template_url(
      v_location.type,
      v_location.city,
      v_location.state,
      v_to_location.city,
      v_to_location.state,
      v_location.nga_format,
      v_to_location.per_format
    );

    -- Update location with template URL
    UPDATE seo_location_formats
    SET 
      template_created = true,
      template_url = v_url,
      updated_at = now()
    WHERE id = p_location_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE seo_location_connections IS 
'Stores valid connections between locations for SEO template generation';

COMMENT ON FUNCTION has_valid_route_connection IS 
'Checks if a valid route connection exists between two locations';

COMMENT ON FUNCTION generate_template_url IS 
'Generates the URL for a SEO template based on the connection between two locations';

COMMENT ON FUNCTION generate_seo_template IS 
'Generates SEO templates for a location based on its valid connections';