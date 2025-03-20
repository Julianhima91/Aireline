-- Drop existing table and functions
DROP TABLE IF EXISTS system_settings CASCADE;

-- Recreate system_settings table with proper constraints
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text NOT NULL UNIQUE,
  setting_value boolean NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
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

-- Function to safely insert or update settings
CREATE OR REPLACE FUNCTION ensure_system_settings()
RETURNS void AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@example.com'
  LIMIT 1;

  -- Insert default settings
  INSERT INTO system_settings (
    setting_name,
    setting_value,
    description,
    updated_by
  )
  VALUES
    (
      'use_incomplete_api',
      true,
      'Use incomplete API endpoint for flight search results',
      v_admin_id
    )
  ON CONFLICT (setting_name) 
  DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT ensure_system_settings();

-- Drop the function
DROP FUNCTION ensure_system_settings();