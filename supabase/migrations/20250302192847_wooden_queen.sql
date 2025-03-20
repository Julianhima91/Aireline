-- Drop existing trigger first
DROP TRIGGER IF EXISTS location_status_change_trigger ON seo_location_formats;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_location_status_change();
DROP FUNCTION IF EXISTS generate_seo_template(uuid);
DROP FUNCTION IF EXISTS generate_template_url(text, text, text, text, text);

-- Create function to generate template URL
CREATE OR REPLACE FUNCTION generate_template_url(
  p_type text,
  p_city text,
  p_state text,
  p_nga_format text,
  p_per_format text
) RETURNS text AS $$
DECLARE
  v_template_type_id uuid;
  v_template_id uuid;
  v_url_structure text;
  v_airport_code text;
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

  -- Get airport code for the city
  IF p_type = 'city' THEN
    SELECT iata_code INTO v_airport_code
    FROM airports
    WHERE city = p_city AND state = p_state
    LIMIT 1;
  END IF;

  -- For cities, use IATA code in URL
  IF p_type = 'city' AND v_airport_code IS NOT NULL THEN
    RETURN '/bileta-avioni-' || LOWER(v_airport_code) || '-ne-' || LOWER(v_airport_code);
  END IF;

  -- For states, use state name in URL
  RETURN '/fluturime-' || LOWER(REPLACE(p_state, ' ', '-')) || '-ne-' || LOWER(REPLACE(p_state, ' ', '-'));
END;
$$ LANGUAGE plpgsql;

-- Create function to handle template generation
CREATE OR REPLACE FUNCTION generate_seo_template(
  p_location_id uuid
) RETURNS void AS $$
DECLARE
  v_location record;
  v_template_type_id uuid;
  v_template_id uuid;
  v_url text;
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

  -- Generate URL
  v_url := generate_template_url(
    v_location.type,
    v_location.city,
    v_location.state,
    v_location.nga_format,
    v_location.per_format
  );

  -- Update location with template URL
  UPDATE seo_location_formats
  SET 
    template_created = true,
    template_url = v_url,
    updated_at = now()
  WHERE id = p_location_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle template generation on status change
CREATE OR REPLACE FUNCTION handle_location_status_change()
RETURNS trigger AS $$
BEGIN
  -- If status changed to 'ready', generate template
  IF NEW.status = 'ready' AND (OLD.status != 'ready' OR OLD.status IS NULL) THEN
    PERFORM generate_seo_template(NEW.id);
  -- If status changed from 'ready', mark template as not created
  ELSIF NEW.status != 'ready' AND OLD.status = 'ready' THEN
    NEW.template_created := false;
    NEW.template_url := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER location_status_change_trigger
  BEFORE UPDATE OF status ON seo_location_formats
  FOR EACH ROW
  EXECUTE FUNCTION handle_location_status_change();

-- Process existing ready locations
DO $$
DECLARE
  v_location record;
BEGIN
  FOR v_location IN 
    SELECT id 
    FROM seo_location_formats 
    WHERE status = 'ready' 
    AND NOT template_created
  LOOP
    PERFORM generate_seo_template(v_location.id);
  END LOOP;
END $$;