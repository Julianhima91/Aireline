/*
  # Fix SEO URL format generation

  1. Changes
    - Updates generate_seo_url function to handle nga/për prefixes correctly
    - Fixes URL format to avoid duplicate prefixes
    - Updates existing URLs to match new format

  2. Updates
    - Modifies existing template_url values
    - Updates trigger function for URL generation
*/

-- Update the generate_seo_url function to handle prefixes correctly
CREATE OR REPLACE FUNCTION generate_seo_url(
  from_type text,
  from_city text,
  from_state text,
  to_type text,
  to_city text,
  to_state text
) RETURNS text AS $$
DECLARE
  base_path text;
  from_name text;
  to_name text;
BEGIN
  -- Determine base path based on location types
  IF from_type = 'city' AND to_type = 'city' THEN
    base_path := '/bileta-avioni';
    from_name := from_city;
    to_name := to_city;
  ELSE
    base_path := '/fluturime';
    from_name := CASE WHEN from_type = 'city' THEN from_city ELSE from_state END;
    to_name := CASE WHEN to_type = 'city' THEN to_city ELSE to_state END;
  END IF;

  -- Remove any existing "nga " or "për " prefixes
  from_name := regexp_replace(from_name, '^nga\s+', '', 'i');
  to_name := regexp_replace(to_name, '^për\s+', '', 'i');

  -- Convert names to lowercase and replace spaces/special chars with hyphens
  from_name := lower(regexp_replace(from_name, '[^a-zA-ZäëïöüÄËÏÖÜ\s]', '', 'g'));
  to_name := lower(regexp_replace(to_name, '[^a-zA-ZäëïöüÄËÏÖÜ\s]', '', 'g'));
  
  -- Replace spaces with hyphens
  from_name := regexp_replace(from_name, '\s+', '-', 'g');
  to_name := regexp_replace(to_name, '\s+', '-', 'g');

  -- Return formatted URL with proper prefixes
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
      f.city as from_city,
      f.state as from_state,
      t.type as to_type,
      t.city as to_city,
      t.state as to_state
    FROM seo_location_connections c
    JOIN seo_location_formats f ON c.from_location_id = f.id
    JOIN seo_location_formats t ON c.to_location_id = t.id
  LOOP
    UPDATE seo_location_connections
    SET template_url = generate_seo_url(
      conn.from_type,
      conn.from_city,
      conn.from_state,
      conn.to_type,
      conn.to_city,
      conn.to_state
    )
    WHERE id = conn.id;
  END LOOP;
END $$;

-- Update the trigger function
CREATE OR REPLACE FUNCTION update_connection_url() RETURNS trigger AS $$
DECLARE
  from_type text;
  from_city text;
  from_state text;
  to_type text;
  to_city text;
  to_state text;
BEGIN
  -- Get location details
  SELECT type, city, state INTO from_type, from_city, from_state
  FROM seo_location_formats
  WHERE id = NEW.from_location_id;

  SELECT type, city, state INTO to_type, to_city, to_state
  FROM seo_location_formats
  WHERE id = NEW.to_location_id;

  -- Generate and set URL
  NEW.template_url := generate_seo_url(
    from_type,
    from_city,
    from_state,
    to_type,
    to_city,
    to_state
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- No need to recreate trigger as it's using the same name and function