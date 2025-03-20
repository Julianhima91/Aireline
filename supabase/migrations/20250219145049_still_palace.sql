/*
  # Update admin settings

  1. Changes
    - Update initial admin settings with new API key
*/

-- Update initial admin settings if exists, otherwise insert
INSERT INTO admin_settings (api_key)
VALUES ('dc61170d59e31d189f629edf9516d5d30684c57b0600d61a28c39c5d0d7e3156')
ON CONFLICT (id) 
DO UPDATE SET 
  api_key = EXCLUDED.api_key,
  updated_at = now();