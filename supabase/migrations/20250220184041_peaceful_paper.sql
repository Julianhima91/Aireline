/*
  # System Settings Control Panel

  1. New Tables
    - `system_settings`
      - `id` (uuid, primary key)
      - `setting_name` (text, unique)
      - `setting_value` (boolean)
      - `description` (text)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add admin-only policies
    - Add public read access for non-sensitive settings

  3. Default Settings
    - Route tracking enabled
    - Auto price updates enabled
    - Manual API search enabled
    - Price display enabled
*/

-- Create system_settings table
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text NOT NULL UNIQUE,
  setting_value boolean NOT NULL DEFAULT true,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read system settings"
  ON system_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default settings
INSERT INTO system_settings (setting_name, setting_value, description) VALUES
  ('enable_route_tracking', true, 'Enable tracking of route popularity and search patterns'),
  ('enable_auto_price_updates', true, 'Enable automated price updates based on demand'),
  ('enable_manual_api_search', true, 'Allow manual API testing and price fetching'),
  ('enable_price_display', true, 'Show price information to users');

-- Create function to check if a feature is enabled
CREATE OR REPLACE FUNCTION is_feature_enabled(p_setting_name text)
RETURNS boolean AS $$
DECLARE
  v_enabled boolean;
BEGIN
  SELECT setting_value INTO v_enabled
  FROM system_settings
  WHERE setting_name = p_setting_name;
  
  RETURN COALESCE(v_enabled, true);
END;
$$ LANGUAGE plpgsql;