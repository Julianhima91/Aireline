/*
  # Fix Admin Settings Access

  1. Changes
    - Drop and recreate admin_settings table with proper structure
    - Add correct policies for admin access
    - Insert initial settings

  2. Security
    - Enable RLS
    - Add proper admin-only policies
*/

-- Drop existing policies and table
DROP POLICY IF EXISTS "Admin can read settings" ON admin_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON admin_settings;
DROP TABLE IF EXISTS admin_settings;

-- Recreate admin_settings table
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint text NOT NULL DEFAULT 'https://serpapi.com',
  commission_rate numeric NOT NULL DEFAULT 0.0,
  api_key text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can read settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );

CREATE POLICY "Admin can update settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@example.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );

CREATE POLICY "Admin can insert settings"
  ON admin_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );

-- Insert initial settings if not exists
INSERT INTO admin_settings (api_key)
VALUES ('dc61170d59e31d189f629edf9516d5d30684c57b0600d61a28c39c5d0d7e3156')
ON CONFLICT DO NOTHING;