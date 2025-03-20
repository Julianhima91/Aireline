-- Drop existing migration if it exists
DROP FUNCTION IF EXISTS migrate_api_mode_setting();

-- Create function to safely migrate the setting
CREATE OR REPLACE FUNCTION migrate_api_mode_setting()
RETURNS void AS $$
BEGIN
  -- Check if the setting already exists
  IF NOT EXISTS (
    SELECT 1 FROM system_settings 
    WHERE setting_name = 'use_incomplete_api'
  ) THEN
    -- Insert only if it doesn't exist
    INSERT INTO system_settings (
      setting_name, 
      setting_value, 
      description
    )
    VALUES (
      'use_incomplete_api',
      true,
      'Use incomplete API endpoint for flight search results'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_api_mode_setting();

-- Drop the function after use
DROP FUNCTION migrate_api_mode_setting();