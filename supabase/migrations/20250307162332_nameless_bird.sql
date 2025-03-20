/*
  # Update template URL generation trigger

  1. Changes
    - Improves URL generation for nga/për formats
    - Handles spaces and special characters properly
    - Ensures consistent URL structure
    - Adds proper URL sanitization

  2. Updates
    - Modified template_url generation logic
    - Added proper character handling
    - Updated URL structure format

  3. Functions
    - update_connection_template_url: Main trigger function
    - update_connection_url: Helper function for URL generation
*/

-- Helper function to sanitize URL parts
CREATE OR REPLACE FUNCTION sanitize_url_part(input text) RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(input, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Remove special characters
          '\s+', '-', 'g'                                     -- Replace spaces with hyphens
        ),
        '-+', '-', 'g'                                        -- Replace multiple hyphens with single
      ),
      '^-+|-+$', '', 'g'                                     -- Remove leading/trailing hyphens
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Main trigger function for template URL generation
CREATE OR REPLACE FUNCTION update_connection_template_url()
RETURNS TRIGGER AS $$
DECLARE
  from_loc record;
  to_loc record;
  url_base text;
  nga_part text;
  per_part text;
BEGIN
  -- Get location information
  SELECT * INTO from_loc
  FROM seo_location_formats
  WHERE id = NEW.from_location_id;

  SELECT * INTO to_loc
  FROM seo_location_formats
  WHERE id = NEW.to_location_id;

  -- Determine URL base based on location types
  IF from_loc.type = 'city' AND to_loc.type = 'city' THEN
    url_base := '/bileta-avioni';
  ELSE
    url_base := '/fluturime';
  END IF;

  -- Get nga format
  nga_part := COALESCE(
    from_loc.nga_format,
    CASE 
      WHEN from_loc.type = 'city' THEN 'nga-' || from_loc.city
      ELSE 'nga-' || from_loc.state
    END
  );

  -- Get për format
  per_part := COALESCE(
    to_loc.per_format,
    CASE 
      WHEN to_loc.type = 'city' THEN 'për-' || to_loc.city
      ELSE 'për-' || to_loc.state
    END
  );

  -- Generate final URL
  NEW.template_url := url_base || '/' || 
    sanitize_url_part(nga_part) || '-' ||
    sanitize_url_part(per_part) || '/';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_connection_template_url_trigger ON seo_location_connections;

-- Create new trigger
CREATE TRIGGER update_connection_template_url_trigger
  BEFORE INSERT OR UPDATE OF from_location_id, to_location_id, status
  ON seo_location_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_template_url();