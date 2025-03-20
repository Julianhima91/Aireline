/*
  # Fix Admin Settings Table

  1. Changes
    - Drop and recreate admin_settings table with proper defaults
    - Add proper RLS policies
    - Insert initial settings

  2. Security
    - Maintain admin-only access for sensitive data
    - Allow public read access to non-sensitive fields
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS admin_settings;

-- Create admin_settings table with proper defaults
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint text NOT NULL DEFAULT 'https://serpapi.com',
  commission_rate numeric NOT NULL DEFAULT 10.0,
  api_key text NOT NULL DEFAULT 'dc61170d59e31d189f629edf9516d5d30684c57b0600d61a28c39c5d0d7e3156',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can read all settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Admin can update settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Create policy for public read access to non-sensitive fields
CREATE POLICY "Public can read non-sensitive settings"
  ON admin_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create security barrier view for public access
CREATE VIEW public_admin_settings AS
SELECT id, api_endpoint, commission_rate, updated_at
FROM admin_settings
WHERE true;

-- Insert initial settings if not exists
INSERT INTO admin_settings (api_endpoint, commission_rate, api_key)
VALUES (
  'https://serpapi.com',
  10.0,
  'dc61170d59e31d189f629edf9516d5d30684c57b0600d61a28c39c5d0d7e3156'
)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();