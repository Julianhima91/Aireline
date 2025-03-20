-- Create function to automatically generate route connections
CREATE OR REPLACE FUNCTION auto_generate_route_connections(
  p_location_id uuid
) RETURNS void AS $$
DECLARE
  v_location record;
  v_other_location record;
BEGIN
  -- Get location details
  SELECT * INTO v_location
  FROM seo_location_formats
  WHERE id = p_location_id;

  IF v_location IS NULL OR v_location.status != 'ready' THEN
    RETURN;
  END IF;

  -- Find other ready locations to connect with
  FOR v_other_location IN (
    SELECT *
    FROM seo_location_formats
    WHERE status = 'ready'
      AND id != p_location_id
      AND NOT (
        -- Don't connect city with its own state
        (v_location.type = 'city' AND type = 'state' AND v_location.state = state) OR
        (v_location.type = 'state' AND type = 'city' AND v_location.state = state)
      )
  ) LOOP
    -- Insert connection if it doesn't exist
    INSERT INTO seo_location_connections (
      from_location_id,
      to_location_id,
      status
    )
    VALUES (
      p_location_id,
      v_other_location.id,
      'active'
    )
    ON CONFLICT (from_location_id, to_location_id) DO NOTHING;

    -- Insert reverse connection
    INSERT INTO seo_location_connections (
      from_location_id,
      to_location_id,
      status
    )
    VALUES (
      v_other_location.id,
      p_location_id,
      'active'
    )
    ON CONFLICT (from_location_id, to_location_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle location status changes
CREATE OR REPLACE FUNCTION handle_location_status_change()
RETURNS trigger AS $$
BEGIN
  -- If status changed to 'ready', generate connections and template
  IF NEW.status = 'ready' AND (OLD.status != 'ready' OR OLD.status IS NULL) THEN
    -- Generate route connections
    PERFORM auto_generate_route_connections(NEW.id);
    -- Generate template
    PERFORM generate_seo_template(NEW.id);
  -- If status changed from 'ready', deactivate connections
  ELSIF NEW.status != 'ready' AND OLD.status = 'ready' THEN
    -- Deactivate all connections
    UPDATE seo_location_connections
    SET status = 'inactive'
    WHERE from_location_id = NEW.id OR to_location_id = NEW.id;
    -- Reset template status
    NEW.template_created := false;
    NEW.template_url := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS location_status_change_trigger ON seo_location_formats;

-- Create trigger for status changes
CREATE TRIGGER location_status_change_trigger
  BEFORE UPDATE OF status ON seo_location_formats
  FOR EACH ROW
  EXECUTE FUNCTION handle_location_status_change();

-- Add helpful comments
COMMENT ON FUNCTION auto_generate_route_connections IS 
'Automatically generates route connections when a location is marked as ready';

COMMENT ON FUNCTION handle_location_status_change IS 
'Handles route connections and template generation when location status changes';

-- Process existing ready locations
DO $$
DECLARE
  v_location record;
BEGIN
  FOR v_location IN 
    SELECT id 
    FROM seo_location_formats 
    WHERE status = 'ready'
  LOOP
    PERFORM auto_generate_route_connections(v_location.id);
    PERFORM generate_seo_template(v_location.id);
  END LOOP;
END $$;