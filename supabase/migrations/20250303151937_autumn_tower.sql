-- Drop existing trigger and function
DROP TRIGGER IF EXISTS connection_status_change_trigger ON seo_location_connections;
DROP FUNCTION IF EXISTS handle_connection_status_change();
DROP FUNCTION IF EXISTS generate_route_template(uuid);

-- Add template_type_id column to seo_location_connections if it doesn't exist
ALTER TABLE seo_location_connections 
ADD COLUMN IF NOT EXISTS template_type_id uuid REFERENCES seo_template_types(id);

-- Create function to determine template type
CREATE OR REPLACE FUNCTION determine_template_type(
  p_from_type text,
  p_to_type text
) RETURNS uuid AS $$
DECLARE
  v_template_type_id uuid;
BEGIN
  SELECT id INTO v_template_type_id
  FROM seo_template_types
  WHERE slug = CASE 
    WHEN p_from_type = 'city' AND p_to_type = 'city' THEN 'city-city'
    WHEN p_from_type = 'state' AND p_to_type = 'state' THEN 'state-state'
    WHEN p_from_type = 'city' AND p_to_type = 'state' THEN 'city-state'
    WHEN p_from_type = 'state' AND p_to_type = 'city' THEN 'state-city'
  END
  AND status = 'active';

  RETURN v_template_type_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate SEO page from template
CREATE OR REPLACE FUNCTION generate_seo_page(
  p_connection_id uuid
) RETURNS void AS $$
DECLARE
  v_connection record;
  v_template record;
  v_url text;
  v_title text;
  v_description text;
  v_template_type_id uuid;
BEGIN
  -- Get connection details with location info
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
  INTO v_connection
  FROM seo_location_connections c
  JOIN seo_location_formats fl ON fl.id = c.from_location_id
  JOIN seo_location_formats tl ON tl.id = c.to_location_id
  WHERE c.id = p_connection_id;

  IF v_connection IS NULL OR v_connection.status != 'active' THEN
    RAISE NOTICE 'Connection % is not active', p_connection_id;
    RETURN;
  END IF;

  -- Determine template type if not set
  IF v_connection.template_type_id IS NULL THEN
    v_template_type_id := determine_template_type(v_connection.from_type, v_connection.to_type);
    
    -- Update connection with template type
    UPDATE seo_location_connections 
    SET template_type_id = v_template_type_id
    WHERE id = p_connection_id;
  ELSE
    v_template_type_id := v_connection.template_type_id;
  END IF;

  -- Get template configuration
  SELECT * INTO v_template 
  FROM seo_page_templates 
  WHERE template_type_id = v_template_type_id;

  IF v_template IS NULL THEN
    RAISE NOTICE 'No template configuration found for type %', v_template_type_id;
    RETURN;
  END IF;

  -- Replace placeholders in template
  v_url := v_template.url_structure;
  v_title := v_template.seo_title;
  v_description := v_template.meta_description;

  -- Replace city placeholders
  IF v_connection.from_type = 'city' THEN
    v_url := REPLACE(v_url, '{nga_city}', COALESCE(v_connection.from_nga, 'nga-' || v_connection.from_city));
    v_url := REPLACE(v_url, '{per_city}', COALESCE(v_connection.from_per, 'per-' || v_connection.from_city));
    v_title := REPLACE(v_title, '{nga_city}', COALESCE(v_connection.from_nga, 'Nga ' || v_connection.from_city));
    v_title := REPLACE(v_title, '{per_city}', COALESCE(v_connection.from_per, 'Për ' || v_connection.from_city));
    v_description := REPLACE(v_description, '{nga_city}', COALESCE(v_connection.from_nga, 'Nga ' || v_connection.from_city));
    v_description := REPLACE(v_description, '{per_city}', COALESCE(v_connection.from_per, 'Për ' || v_connection.from_city));
  END IF;

  IF v_connection.to_type = 'city' THEN
    v_url := REPLACE(v_url, '{nga_city}', COALESCE(v_connection.to_nga, 'nga-' || v_connection.to_city));
    v_url := REPLACE(v_url, '{per_city}', COALESCE(v_connection.to_per, 'per-' || v_connection.to_city));
    v_title := REPLACE(v_title, '{nga_city}', COALESCE(v_connection.to_nga, 'Nga ' || v_connection.to_city));
    v_title := REPLACE(v_title, '{per_city}', COALESCE(v_connection.to_per, 'Për ' || v_connection.to_city));
    v_description := REPLACE(v_description, '{nga_city}', COALESCE(v_connection.to_nga, 'Nga ' || v_connection.to_city));
    v_description := REPLACE(v_description, '{per_city}', COALESCE(v_connection.to_per, 'Për ' || v_connection.to_city));
  END IF;

  -- Replace state placeholders
  IF v_connection.from_type = 'state' THEN
    v_url := REPLACE(v_url, '{nga_state}', COALESCE(v_connection.from_nga, 'nga-' || v_connection.from_state));
    v_url := REPLACE(v_url, '{per_state}', COALESCE(v_connection.from_per, 'per-' || v_connection.from_state));
    v_title := REPLACE(v_title, '{nga_state}', COALESCE(v_connection.from_nga, 'Nga ' || v_connection.from_state));
    v_title := REPLACE(v_title, '{per_state}', COALESCE(v_connection.from_per, 'Për ' || v_connection.from_state));
    v_description := REPLACE(v_description, '{nga_state}', COALESCE(v_connection.from_nga, 'Nga ' || v_connection.from_state));
    v_description := REPLACE(v_description, '{per_state}', COALESCE(v_connection.from_per, 'Për ' || v_connection.from_state));
  END IF;

  IF v_connection.to_type = 'state' THEN
    v_url := REPLACE(v_url, '{nga_state}', COALESCE(v_connection.to_nga, 'nga-' || v_connection.to_state));
    v_url := REPLACE(v_url, '{per_state}', COALESCE(v_connection.to_per, 'per-' || v_connection.to_state));
    v_title := REPLACE(v_title, '{nga_state}', COALESCE(v_connection.to_nga, 'Nga ' || v_connection.to_state));
    v_title := REPLACE(v_title, '{per_state}', COALESCE(v_connection.to_per, 'Për ' || v_connection.to_state));
    v_description := REPLACE(v_description, '{nga_state}', COALESCE(v_connection.to_nga, 'Nga ' || v_connection.to_state));
    v_description := REPLACE(v_description, '{per_state}', COALESCE(v_connection.to_per, 'Për ' || v_connection.to_state));
  END IF;

  -- Create new SEO page entry
  INSERT INTO seo_page_templates (
    template_type_id,
    url_structure,
    seo_title,
    meta_description
  )
  VALUES (
    v_template_type_id,
    v_url,
    v_title,
    v_description
  )
  ON CONFLICT (template_type_id) DO UPDATE SET
    url_structure = EXCLUDED.url_structure,
    seo_title = EXCLUDED.seo_title,
    meta_description = EXCLUDED.meta_description,
    updated_at = now();

  RAISE NOTICE 'Generated SEO page for connection % with URL %', p_connection_id, v_url;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle connection status changes
CREATE OR REPLACE FUNCTION handle_connection_status_change()
RETURNS trigger AS $$
BEGIN
  -- If status changed to active, generate SEO page
  IF NEW.status = 'active' AND (OLD.status != 'active' OR OLD.status IS NULL) THEN
    PERFORM generate_seo_page(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for connection status changes
CREATE TRIGGER connection_status_change_trigger
  AFTER UPDATE OF status ON seo_location_connections
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION handle_connection_status_change();

-- Process existing active connections
DO $$
DECLARE
  v_connection record;
  v_count integer := 0;
BEGIN
  RAISE NOTICE 'Processing existing active connections...';

  -- First, determine template types for all connections
  UPDATE seo_location_connections c
  SET template_type_id = (
    SELECT determine_template_type(fl.type, tl.type)
    FROM seo_location_formats fl
    JOIN seo_location_formats tl ON tl.id = c.to_location_id
    WHERE fl.id = c.from_location_id
  )
  WHERE status = 'active' AND template_type_id IS NULL;

  -- Then generate SEO pages
  FOR v_connection IN 
    SELECT c.id, 
           fl.type as from_type, fl.city as from_city, fl.state as from_state,
           tl.type as to_type, tl.city as to_city, tl.state as to_state
    FROM seo_location_connections c
    JOIN seo_location_formats fl ON fl.id = c.from_location_id
    JOIN seo_location_formats tl ON tl.id = c.to_location_id
    WHERE c.status = 'active'
  LOOP
    RAISE NOTICE 'Processing connection: % % -> % %',
      CASE WHEN v_connection.from_type = 'city' THEN v_connection.from_city ELSE v_connection.from_state END,
      v_connection.from_state,
      CASE WHEN v_connection.to_type = 'city' THEN v_connection.to_city ELSE v_connection.to_state END,
      v_connection.to_state;

    PERFORM generate_seo_page(v_connection.id);
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Finished processing % active connections', v_count;
END $$;