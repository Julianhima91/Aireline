-- Drop existing migration functions if they exist
DROP FUNCTION IF EXISTS migrate_api_mode_setting();

-- Create a function to safely handle system settings
CREATE OR REPLACE FUNCTION ensure_system_settings()
RETURNS void AS $$
BEGIN
  -- Create temporary table for new settings
  CREATE TEMP TABLE temp_settings (
    setting_name text,
    setting_value boolean,
    description text
  ) ON COMMIT DROP;

  -- Insert desired settings into temp table
  INSERT INTO temp_settings (setting_name, setting_value, description)
  VALUES
    ('use_incomplete_api', true, 'Use incomplete API endpoint for flight search results');

  -- Perform upsert from temp table to system_settings
  INSERT INTO system_settings (
    setting_name,
    setting_value,
    description,
    updated_at
  )
  SELECT
    ts.setting_name,
    ts.setting_value,
    ts.description,
    now()
  FROM temp_settings ts
  ON CONFLICT (setting_name) 
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT ensure_system_settings();

-- Drop the function
DROP FUNCTION ensure_system_settings();