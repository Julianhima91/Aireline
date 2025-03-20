/*
  # Drop Template URL Trigger and Functions
  
  1. Changes
    - Drop the template URL trigger and associated functions
    - This allows frontend to control template_url values directly
  
  2. Reason
    - Need to handle URL generation in frontend code
    - Prevent database trigger from overriding frontend values
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_connection_template_url_trigger ON seo_location_connections;

-- Drop the functions with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS update_connection_template_url() CASCADE;
DROP FUNCTION IF EXISTS generate_template_url(text, text, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS sanitize_url_part(text) CASCADE;