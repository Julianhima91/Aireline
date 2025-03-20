/*
  # Add admin settings table

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `api_endpoint` (text, default 'https://serpapi.com')
      - `commission_rate` (numeric, default 0.0)
      - `api_key` (text)
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on `admin_settings` table
    - Add policy for admin access
*/

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_endpoint text NOT NULL DEFAULT 'https://serpapi.com',
  commission_rate numeric NOT NULL DEFAULT 0.0,
  api_key text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Only admin can access settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email = 'admin@example.com'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email = 'admin@example.com'
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert initial admin settings
INSERT INTO admin_settings (api_key)
VALUES ('dc61170d59e31d189f629edf9516d5d30684c57b0600d61a28c39c5d0d7e3156');