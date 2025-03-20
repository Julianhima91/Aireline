/*
  # Fix URL Formatting in SEO Location Connections

  1. Extensions
    - Enable unaccent extension for character normalization

  2. Functions
    - Improved sanitize_url_part function to properly handle Albanian characters
    - Updated generate_template_url to ensure consistent formatting
    - Enhanced trigger function for URL generation

  3. Changes
    - Better handling of special characters (ë → e, ç → c)
    - Consistent URL format without special characters
    - Proper handling of nga/per formats
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
DECLARE
  normalized text;
BEGIN
  -- First normalize the text by:
  -- 1. Converting to lowercase
  -- 2. Removing accents
  -- 3. Replacing specific Albanian characters
  normalized := lower(text_input);
  normalized := unaccent(normalized);
  
  -- Replace specific Albanian characters
  normalized := replace(normalized, 'ë', 'e');
  normalized := replace(normalized, 'ç', 'c');
  
  -- Replace 'për' with 'per' specifically
  normalized := replace(normalized, 'për', 'per');
  normalized := replace(normalized, 'pёr', 'per');
  
  -- Remove any remaining special characters and convert spaces to hyphens
  normalized := regexp_replace(normalized, '[^a-z0-9\s-]', '', 'g');
  normalized := regexp_replace(normalized, '\s+', '-', 'g');
  normalized := regexp_replace(normalized, '-+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  normalized := trim(both '-' from normalized);
  
  RETURN normalized;
END;
$$;

-- Create template URL generation function
CREATE FUNCTION generate_template_url(
  from_type text,
  from_nga_format text,
  from_city text,
  from_state text,
  to_type text,
  to_per_format text,
  to_city text,
  to_state text
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

  -- Use nga_format if available, otherwise construct default format
  from_part := COALESCE(
    from_nga_format,
    CASE 
      WHEN from_type = 'city' THEN 'nga ' || from_city
      ELSE 'nga ' || from_state
    END
  );

  -- Use per_format if available, otherwise construct default format
  to_part := COALESCE(
    to_per_format,
    CASE 
      WHEN to_type = 'city' THEN 'per ' || to_city
      ELSE 'per ' || to_state
    END
  );

  -- Combine and format URL, ensuring proper character handling
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
  -- Get from location details with nga_format
  SELECT type, city, state, nga_format, per_format
  INTO from_loc
  FROM seo_location_formats
  WHERE id = NEW.from_location_id;

  -- Get to location details with per_format
  SELECT type, city, state, nga_format, per_format
  INTO to_loc
  FROM seo_location_formats
  WHERE id = NEW.to_location_id;

  -- Generate and set template URL using format fields
  NEW.template_url := generate_template_url(
    from_loc.type,
    from_loc.nga_format,
    from_loc.city,
    from_loc.state,
    to_loc.type,
    to_loc.per_format,
    to_loc.city,
    to_loc.state
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

-- Update existing URLs using the new format fields
DO $$
BEGIN
  UPDATE seo_location_connections
  SET template_url = generate_template_url(
    (SELECT type FROM seo_location_formats WHERE id = from_location_id),
    (SELECT nga_format FROM seo_location_formats WHERE id = from_location_id),
    (SELECT city FROM seo_location_formats WHERE id = from_location_id),
    (SELECT state FROM seo_location_formats WHERE id = from_location_id),
    (SELECT type FROM seo_location_formats WHERE id = to_location_id),
    (SELECT per_format FROM seo_location_formats WHERE id = to_location_id),
    (SELECT city FROM seo_location_formats WHERE id = to_location_id),
    (SELECT state FROM seo_location_formats WHERE id = to_location_id)
  );
END $$;