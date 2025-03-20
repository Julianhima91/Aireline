-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS update_connection_template_url_trigger ON seo_location_connections;
DROP FUNCTION IF EXISTS update_connection_template_url();
DROP FUNCTION IF EXISTS generate_connection_url(text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS format_location_name(text, text);

-- Create function to format location names for URLs
CREATE OR REPLACE FUNCTION format_location_name(
  p_name text,
  p_prefix text DEFAULT ''
) RETURNS text AS $$
BEGIN
  -- Remove any existing hyphens and multiple spaces
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(p_prefix || ' ' || p_name, p_name),
        '[-\s]+',  -- Match one or more hyphens or whitespace
        '-',       -- Replace with single hyphen
        'g'
      ),
      '^-+|-+$',  -- Remove leading/trailing hyphens
      '',
      'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to generate template URL with correct patterns
CREATE OR REPLACE FUNCTION generate_connection_url(
  p_from_type text,
  p_from_city text,
  p_from_state text,
  p_from_nga text,
  p_to_type text,
  p_to_city text,
  p_to_state text,
  p_to_per text
) RETURNS text AS $$
DECLARE
  v_from_part text;
  v_to_part text;
BEGIN
  -- Generate from part
  v_from_part := CASE
    WHEN p_from_nga IS NOT NULL THEN
      format_location_name(p_from_nga)
    WHEN p_from_type = 'city' THEN
      format_location_name(p_from_city, 'nga')
    ELSE
      format_location_name(p_from_state, 'nga')
  END;

  -- Generate to part
  v_to_part := CASE
    WHEN p_to_per IS NOT NULL THEN
      format_location_name(p_to_per)
    WHEN p_to_type = 'city' THEN
      format_location_name(p_to_city, 'per')
    ELSE
      format_location_name(p_to_state, 'per')
  END;

  -- Return full URL with correct pattern
  RETURN CASE 
    WHEN p_from_type = 'city' AND p_to_type = 'city' THEN
      '/bileta-avioni-' || v_from_part || '-' || v_to_part
    WHEN p_from_type = 'state' AND p_to_type = 'state' THEN
      '/fluturime-' || v_from_part || '-' || v_to_part
    WHEN p_from_type = 'city' AND p_to_type = 'state' THEN
      '/bileta-avioni-' || v_from_part || '-' || v_to_part
    ELSE
      '/fluturime-' || v_from_part || '-' || v_to_part
  END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update template URL
CREATE OR REPLACE FUNCTION update_connection_template_url()
RETURNS trigger AS $$
DECLARE
  v_from_location record;
  v_to_location record;
BEGIN
  -- Get from location details
  SELECT * INTO v_from_location
  FROM seo_location_formats
  WHERE id = NEW.from_location_id;

  -- Get to location details
  SELECT * INTO v_to_location
  FROM seo_location_formats
  WHERE id = NEW.to_location_id;

  -- Generate and set template URL
  NEW.template_url := generate_connection_url(
    v_from_location.type,
    v_from_location.city,
    v_from_location.state,
    v_from_location.nga_format,
    v_to_location.type,
    v_to_location.city,
    v_to_location.state,
    v_to_location.per_format
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update template URL
CREATE TRIGGER update_connection_template_url_trigger
  BEFORE INSERT OR UPDATE OF from_location_id, to_location_id, status
  ON seo_location_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_template_url();

-- Update existing connections with correct URL patterns
DO $$
DECLARE
  v_connection record;
  v_url text;
BEGIN
  FOR v_connection IN 
    SELECT 
      c.*,
      fl.type as from_type,
      fl.city as from_city,
      fl.state as from_state,
      fl.nga_format as from_nga,
      fl.per_format as from_per,
      tl.type as to_type,
      tl.city as to_city,
      tl.state as to_state,
      tl.nga_format as to_nga,
      tl.per_format as to_per
    FROM seo_location_connections c
    JOIN seo_location_formats fl ON fl.id = c.from_location_id
    JOIN seo_location_formats tl ON tl.id = c.to_location_id
    WHERE c.status = 'active'
  LOOP
    -- Generate URL using the new function
    v_url := generate_connection_url(
      v_connection.from_type,
      v_connection.from_city,
      v_connection.from_state,
      v_connection.from_nga,
      v_connection.to_type,
      v_connection.to_city,
      v_connection.to_state,
      v_connection.to_per
    );

    -- Update connection with URL
    UPDATE seo_location_connections
    SET template_url = v_url
    WHERE id = v_connection.id;
  END LOOP;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION format_location_name IS 
'Formats a location name for use in URLs by converting to lowercase, replacing spaces with hyphens, and handling prefixes';

COMMENT ON FUNCTION generate_connection_url IS 
'Generates a properly formatted URL for a route connection using the format_location_name function';