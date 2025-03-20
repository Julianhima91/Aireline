-- Drop existing function
DROP FUNCTION IF EXISTS generate_route_template(uuid);

-- Create improved function to generate SEO template for a route connection
CREATE OR REPLACE FUNCTION generate_route_template(
  p_connection_id uuid
) RETURNS void AS $$
DECLARE
  v_connection record;
  v_template_type_id uuid;
  v_url text;
  v_title text;
  v_description text;
  v_template_id uuid;
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

  -- Get template type based on location types
  SELECT id INTO v_template_type_id
  FROM seo_template_types
  WHERE slug = CASE 
    WHEN v_connection.from_type = 'city' AND v_connection.to_type = 'city' THEN 'city-city'
    WHEN v_connection.from_type = 'state' AND v_connection.to_type = 'state' THEN 'state-state'
    WHEN v_connection.from_type = 'city' AND v_connection.to_type = 'state' THEN 'city-state'
    WHEN v_connection.from_type = 'state' AND v_connection.to_type = 'city' THEN 'state-city'
  END
  AND status = 'active';

  IF v_template_type_id IS NULL THEN
    RAISE NOTICE 'No active template type found for connection %', p_connection_id;
    RETURN;
  END IF;

  -- Generate URL structure
  v_url := CASE 
    WHEN v_connection.from_type = 'city' AND v_connection.to_type = 'city' THEN
      '/bileta-avioni-' || 
      LOWER(REPLACE(COALESCE(v_connection.from_nga, 'Nga ' || v_connection.from_city), ' ', '-')) || 
      '-ne-' ||
      LOWER(REPLACE(COALESCE(v_connection.to_per, 'Per ' || v_connection.to_city), ' ', '-')) || '/'
    WHEN v_connection.from_type = 'state' AND v_connection.to_type = 'state' THEN
      '/fluturime-' || 
      LOWER(REPLACE(COALESCE(v_connection.from_nga, 'Nga ' || v_connection.from_state), ' ', '-')) || 
      '-ne-' ||
      LOWER(REPLACE(COALESCE(v_connection.to_per, 'Per ' || v_connection.to_state), ' ', '-')) || '/'
    ELSE
      '/fluturime-' || 
      LOWER(REPLACE(COALESCE(v_connection.from_nga, 'Nga ' || COALESCE(v_connection.from_city, v_connection.from_state)), ' ', '-')) || 
      '-ne-' ||
      LOWER(REPLACE(COALESCE(v_connection.to_per, 'Per ' || COALESCE(v_connection.to_city, v_connection.to_state)), ' ', '-')) || '/'
  END;

  -- Generate title
  v_title := CASE 
    WHEN v_connection.from_type = 'city' AND v_connection.to_type = 'city' THEN
      'Bileta Avioni ' || 
      COALESCE(v_connection.from_nga, 'Nga ' || v_connection.from_city) || ' ' ||
      COALESCE(v_connection.to_per, 'Për ' || v_connection.to_city) || ' | Rezervo Online'
    WHEN v_connection.from_type = 'state' AND v_connection.to_type = 'state' THEN
      'Fluturime ' || 
      COALESCE(v_connection.from_nga, 'Nga ' || v_connection.from_state) || ' ' ||
      COALESCE(v_connection.to_per, 'Për ' || v_connection.to_state) || ' | Çmimet & Linjat e Lira'
    ELSE
      'Fluturime ' || 
      COALESCE(v_connection.from_nga, 'Nga ' || COALESCE(v_connection.from_city, v_connection.from_state)) || ' ' ||
      COALESCE(v_connection.to_per, 'Për ' || COALESCE(v_connection.to_city, v_connection.to_state)) || ' | Rezervo Online'
  END;

  -- Generate description
  v_description := CASE 
    WHEN v_connection.from_type = 'city' AND v_connection.to_type = 'city' THEN
      'Rezervoni biletën tuaj ' || 
      LOWER(COALESCE(v_connection.from_nga, 'nga ' || v_connection.from_city)) || ' ' ||
      LOWER(COALESCE(v_connection.to_per, 'për ' || v_connection.to_city)) || 
      ' me çmimet më të mira! ✈️ Krahasoni fluturimet dhe zgjidhni ofertën më të mirë.'
    WHEN v_connection.from_type = 'state' AND v_connection.to_type = 'state' THEN
      'Gjeni ofertat më të mira për fluturime ' || 
      LOWER(COALESCE(v_connection.from_nga, 'nga ' || v_connection.from_state)) || ' ' ||
      LOWER(COALESCE(v_connection.to_per, 'për ' || v_connection.to_state)) || 
      '. ✈️ Çmime të ulëta, fluturime direkte dhe me ndalesë.'
    ELSE
      'Fluturime ' || 
      LOWER(COALESCE(v_connection.from_nga, 'nga ' || COALESCE(v_connection.from_city, v_connection.from_state))) || ' ' ||
      LOWER(COALESCE(v_connection.to_per, 'për ' || COALESCE(v_connection.to_city, v_connection.to_state))) || 
      '. ✈️ Gjeni dhe krahasoni çmimet më të mira për udhëtimin tuaj.'
  END;

  -- First check if a template already exists for this connection
  SELECT id INTO v_template_id
  FROM seo_page_templates
  WHERE url_structure = v_url;

  -- Update existing template or insert new one
  IF v_template_id IS NOT NULL THEN
    UPDATE seo_page_templates SET
      seo_title = v_title,
      meta_description = v_description,
      updated_at = now()
    WHERE id = v_template_id;
  ELSE
    -- Insert new template
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
    RETURNING id INTO v_template_id;

    -- Insert default components for new template
    INSERT INTO seo_template_components (
      template_id,
      component_name,
      display_order,
      status
    )
    VALUES 
      (v_template_id, 'HeaderComponent', 1, 'active'),
      (v_template_id, 'FlightSearchComponent', 2, 'active'),
      (v_template_id, 'PricingTableComponent', 3, 'active'),
      (v_template_id, 'RouteInfoComponent', 4, 'active'),
      (v_template_id, 'FAQComponent', 5, 'active'),
      (v_template_id, 'RelatedDestinationsComponent', 6, 'active'),
      (v_template_id, 'FooterComponent', 7, 'active');
  END IF;

  RAISE NOTICE 'Generated/updated template % for connection % with URL %', v_template_id, p_connection_id, v_url;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle route connection status changes
CREATE OR REPLACE FUNCTION handle_connection_status_change()
RETURNS trigger AS $$
BEGIN
  -- If status changed to active, generate template
  IF NEW.status = 'active' AND (OLD.status != 'active' OR OLD.status IS NULL) THEN
    PERFORM generate_route_template(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for connection status changes
DROP TRIGGER IF EXISTS connection_status_change_trigger ON seo_location_connections;

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

    PERFORM generate_route_template(v_connection.id);
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Finished processing % active connections', v_count;
END $$;