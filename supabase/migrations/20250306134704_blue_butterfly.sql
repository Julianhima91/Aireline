CREATE OR REPLACE FUNCTION generate_seo_url(
  from_type text,
  from_nga_format text,
  to_type text,
  to_per_format text
) RETURNS text AS $$
DECLARE
  base_path text;
  from_name text;
  to_name text;
BEGIN
  -- Determine base path based on location types
  IF from_type = 'city' AND to_type = 'city' THEN
    base_path := '/bileta-avioni';
    from_name := from_nga_format;
    to_name := to_per_format;
  ELSE
    base_path := '/fluturime';
    from_name := from_nga_format;
    to_name := to_per_format;
  END IF;

  -- Convert names to lowercase and replace spaces with hyphens
  from_name := lower(regexp_replace(from_name, '\s+', '-', 'g'));
  to_name := lower(regexp_replace(to_name, '\s+', '-', 'g'));

  -- Return formatted URL
  RETURN format('%s/nga-%s-për-%s/', base_path, from_name, to_name);
END;
$$ LANGUAGE plpgsql;

-- Update existing URLs
DO $$
DECLARE
  conn RECORD;
BEGIN
  FOR conn IN 
    SELECT 
      c.id,
      f.type as from_type,
      f.nga_format as from_nga_format,
      t.type as to_type,
      t.per_format as to_per_format
    FROM seo_location_connections c
    JOIN seo_location_formats f ON c.from_location_id = f.id
    JOIN seo_location_formats t ON c.to_location_id = t.id
  LOOP
    UPDATE seo_location_connections
    SET template_url = generate_seo_url(
      conn.from_type,
      conn.from_nga_format,
      conn.to_type,
      conn.to_per_format
    )
    WHERE id = conn.id;
  END LOOP;
END $$;

-- Create trigger to maintain URL format
CREATE OR REPLACE FUNCTION update_connection_url() RETURNS trigger AS $$
DECLARE
  from_type text;
  from_nga_format text;
  to_type text;
  to_per_format text;
BEGIN
  -- Get location details
  SELECT type, nga_format INTO from_type, from_nga_format
  FROM seo_location_formats
  WHERE id = NEW.from_location_id;

  SELECT type, per_format INTO to_type, to_per_format
  FROM seo_location_formats
  WHERE id = NEW.to_location_id;

  -- Generate and set URL
  NEW.template_url := generate_seo_url(
    from_type,
    from_nga_format,
    to_type,
    to_per_format
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_connection_url_trigger ON seo_location_connections;

-- Create new trigger
CREATE TRIGGER update_connection_url_trigger
  BEFORE INSERT OR UPDATE OF from_location_id, to_location_id
  ON seo_location_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_url();