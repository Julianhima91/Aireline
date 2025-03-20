/*
  # Remove Template URL Automation
  
  1. Changes
    - Drop the template URL trigger and associated functions
    - Allow frontend to control template_url values directly
  
  2. Reason
    - Need to handle URL generation in frontend code
    - Prevent database from overriding frontend values
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_connection_url_trigger ON seo_location_connections;

-- Drop the function
DROP FUNCTION IF EXISTS update_connection_url CASCADE;