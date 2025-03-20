/*
  # Update Template URL Trigger

  1. Changes
    - Modified trigger to only update template_url when NULL
    - Preserves manually set template_url values
    - Maintains automatic URL generation for new connections

  2. Trigger Function
    - Checks if NEW.template_url IS NULL before updating
    - Generates URL from template and location formats
    - Maintains existing URL if already set

  3. Security
    - No changes to RLS policies
    - Maintains existing permissions
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_connection_template_url ON seo_location_connections;
DROP FUNCTION IF EXISTS update_connection_template_url();

-- Create trigger function
CREATE OR REPLACE FUNCTION update_connection_template_url()
RETURNS TRIGGER AS $$
DECLARE
  template_data RECORD;
  from_location RECORD;
  to_location RECORD;
  url_structure TEXT;
BEGIN
  -- Only proceed if template_url is NULL
  IF NEW.template_url IS NULL THEN
    -- Get template data
    SELECT url_structure INTO template_data
    FROM seo_page_templates
    WHERE template_type_id = NEW.template_type_id;

    -- Get location data
    SELECT type, city, state, nga_format, per_format INTO from_location
    FROM seo_location_formats
    WHERE id = NEW.from_location_id;

    SELECT type, city, state, nga_format, per_format INTO to_location
    FROM seo_location_formats
    WHERE id = NEW.to_location_id;

    -- Generate URL structure
    url_structure := template_data.url_structure;

    -- Replace city placeholders
    IF from_location.type = 'city' THEN
      url_structure := REPLACE(
        url_structure, 
        '{nga_city}', 
        COALESCE(from_location.nga_format, 'nga-' || from_location.city)
      );
    END IF;

    IF to_location.type = 'city' THEN
      url_structure := REPLACE(
        url_structure, 
        '{per_city}', 
        COALESCE(to_location.per_format, 'per-' || to_location.city)
      );
    END IF;

    -- Replace state placeholders
    IF from_location.type = 'state' THEN
      url_structure := REPLACE(
        url_structure, 
        '{nga_state}', 
        COALESCE(from_location.nga_format, 'nga-' || from_location.state)
      );
    END IF;

    IF to_location.type = 'state' THEN
      url_structure := REPLACE(
        url_structure, 
        '{per_state}', 
        COALESCE(to_location.per_format, 'per-' || to_location.state)
      );
    END IF;

    -- Convert to lowercase and replace spaces with hyphens
    url_structure := LOWER(REGEXP_REPLACE(url_structure, '\s+', '-', 'g'));

    -- Update template_url only if it was NULL
    NEW.template_url := url_structure;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_connection_template_url
  BEFORE INSERT OR UPDATE OF template_type_id, from_location_id, to_location_id
  ON seo_location_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_template_url();

-- Add comment to function
COMMENT ON FUNCTION update_connection_template_url() IS 'Generates and updates template_url for SEO location connections only when template_url is NULL';