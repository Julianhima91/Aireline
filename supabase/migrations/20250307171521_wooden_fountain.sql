/*
  # Fix SEO URL Generation with Character Normalization

  1. Extensions
    - Enable unaccent extension for proper character normalization

  2. New Functions
    - sanitize_url_part: Improved function to handle special characters and formatting
    - generate_template_url: Function to generate proper template URLs
    - update_connection_template_url: Trigger function for automatic URL updates

  3. Changes
    - Added unaccent extension
    - Updated character normalization logic
    - Fixed URL structure and formatting
    - Added CASCADE to function drops
*/

-- Enable the unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop existing functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS sanitize_url_part(text) CASCADE;
DROP FUNCTION IF EXISTS generate_template_url(text, text, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS update_connection_template_url() CASCADE;

-- Create improved character mapping function
CREATE FUNCTION sanitize_url_part(text_input text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convert special characters and format URL part
  RETURN regexp_replace(
    regexp_replace(
      lower(unaccent(text_input)),
      '[^a-z0-9\s-]',
      '',
      'g'
    ),
    '\s+',
    '-',
    'g'
  );
END;
$$;

-- Create template URL generation function
CREATE FUNCTION generate_template_url(
  from_type text,
  from_city text,
  from_state text,
  from_nga text,
  to_type text,
  to_city text,
  to_state text,
  to_per text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_url text;
  from_part text;
  to_part text;
BEGIN
  -- Determine base URL based on location types
  IF from_type = 'city' AND to_type = 'city' THEN
    base_url := '/bileta-avioni';
  ELSE
    base_url := '/fluturime';
  END IF;

  -- Generate from part
  from_part := COALESCE(from_nga, 
    CASE 
      WHEN from_type = 'city' THEN 'Nga ' || from_city
      ELSE 'Nga ' || from_state
    END
  );

  -- Generate to part
  to_part := COALESCE(to_per,
    CASE 
      WHEN to_type = 'city' THEN 'per ' || to_city
      ELSE 'per ' || to_state
    END
  );

  -- Combine and format URL
  RETURN base_url || '/' || 
         sanitize_url_part(from_part) || '-' ||
         sanitize_url_part(to_part) || '/';
END;
$$;

-- Create the connection URL trigger function
CREATE FUNCTION update_connection_template_url()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  from_loc record;
  to_loc record;
BEGIN
  -- Get from location details
  SELECT type, city, state, nga_format, per_format
  INTO from_loc
  FROM seo_location_formats
  WHERE id = NEW.from_location_id;

  -- Get to location details
  SELECT type, city, state, nga_format, per_format
  INTO to_loc
  FROM seo_location_formats
  WHERE id = NEW.to_location_id;

  -- Generate and set template URL
  NEW.template_url := generate_template_url(
    from_loc.type,
    from_loc.city,
    from_loc.state,
    from_loc.nga_format,
    to_loc.type,
    to_loc.city,
    to_loc.state,
    to_loc.per_format
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER update_connection_template_url_trigger
  BEFORE INSERT OR UPDATE OF from_location_id, to_location_id
  ON seo_location_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_template_url();

-- Update existing URLs
DO $$
BEGIN
  UPDATE seo_location_connections
  SET template_url = generate_template_url(
    (SELECT type FROM seo_location_formats WHERE id = from_location_id),
    (SELECT city FROM seo_location_formats WHERE id = from_location_id),
    (SELECT state FROM seo_location_formats WHERE id = from_location_id),
    (SELECT nga_format FROM seo_location_formats WHERE id = from_location_id),
    (SELECT type FROM seo_location_formats WHERE id = to_location_id),
    (SELECT city FROM seo_location_formats WHERE id = to_location_id),
    (SELECT state FROM seo_location_formats WHERE id = to_location_id),
    (SELECT per_format FROM seo_location_formats WHERE id = to_location_id)
  );
END $$;