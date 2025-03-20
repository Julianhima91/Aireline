/*
  # Create Route Update Settings Table

  1. New Tables
    - `route_update_settings`
      - `id` (uuid, primary key)
      - `origin` (text)
      - `destination` (text)
      - `update_interval` (integer, hours)
      - `is_ignored` (boolean)
      - `search_count` (integer)
      - `last_update` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add admin-only policies
*/

-- Create route_update_settings table
CREATE TABLE route_update_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  update_interval integer NOT NULL DEFAULT 6,
  is_ignored boolean NOT NULL DEFAULT false,
  search_count integer NOT NULL DEFAULT 0,
  last_update timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_update_interval CHECK (update_interval IN (3, 6, 12, 24))
);

-- Create unique constraint on route pair
CREATE UNIQUE INDEX route_update_settings_route_idx ON route_update_settings(origin, destination);

-- Create updated_at trigger
CREATE TRIGGER update_route_settings_updated_at
  BEFORE UPDATE ON route_update_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE route_update_settings ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies
CREATE POLICY "Admin can manage route settings"
  ON route_update_settings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Function to sync route settings with tracking data
CREATE OR REPLACE FUNCTION sync_route_update_settings()
RETURNS void AS $$
BEGIN
  -- Insert new routes from tracking that don't exist in settings
  INSERT INTO route_update_settings (origin, destination, search_count)
  SELECT 
    origin,
    destination,
    sum(search_count) as total_searches
  FROM search_route_tracking
  GROUP BY origin, destination
  ON CONFLICT (origin, destination) 
  DO UPDATE SET
    search_count = EXCLUDED.search_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically sync settings when tracking is updated
CREATE OR REPLACE FUNCTION trigger_sync_route_settings()
RETURNS trigger AS $$
BEGIN
  PERFORM sync_route_update_settings();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_route_settings_trigger
  AFTER INSERT OR UPDATE ON search_route_tracking
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_sync_route_settings();

-- Initial sync of existing data
SELECT sync_route_update_settings();