-- Add use_incomplete_api setting if it doesn't exist
INSERT INTO system_settings (setting_name, setting_value, description)
VALUES (
  'use_incomplete_api',
  true,
  'Use incomplete API endpoint for flight search results'
)
ON CONFLICT (setting_name) 
DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();