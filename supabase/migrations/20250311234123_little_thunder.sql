/*
  # Flight API Configuration Tables

  1. New Tables
    - flight_api_config: Stores API configuration and keys
    - flight_api_stats: Tracks API usage statistics

  2. Security
    - RLS policies for admin access
    - Public read access for stats
*/

-- Create flight_api_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS flight_api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_api text NOT NULL CHECK (active_api IN ('rapidapi', 'flightapi', 'both')),
  simultaneous_requests boolean DEFAULT false,
  oneway_api text NOT NULL CHECK (oneway_api IN ('rapidapi', 'flightapi', 'both')),
  roundtrip_api text NOT NULL CHECK (roundtrip_api IN ('rapidapi', 'flightapi', 'both')),
  rapidapi_key text NOT NULL,
  flightapi_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create flight_api_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS flight_api_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rapidapi jsonb NOT NULL DEFAULT '{"error_rate": 0, "total_requests": 0, "avg_response_time": 0}'::jsonb,
  flightapi jsonb NOT NULL DEFAULT '{"error_rate": 0, "total_requests": 0, "avg_response_time": 0}'::jsonb,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE flight_api_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_api_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for flight_api_config
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'flight_api_config'
    AND policyname = 'Admin can manage API config'
  ) THEN
    DROP POLICY "Admin can manage API config" ON flight_api_config;
  END IF;

  -- Drop policies for flight_api_stats
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'flight_api_stats'
    AND policyname = 'Admin can manage API stats'
  ) THEN
    DROP POLICY "Admin can manage API stats" ON flight_api_stats;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'flight_api_stats'
    AND policyname = 'Public can read API stats'
  ) THEN
    DROP POLICY "Public can read API stats" ON flight_api_stats;
  END IF;
END $$;

-- Create policies for flight_api_config
CREATE POLICY "Admin can manage API config"
  ON flight_api_config
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@example.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@example.com'::text);

-- Create policies for flight_api_stats
CREATE POLICY "Admin can manage API stats"
  ON flight_api_stats
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@example.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@example.com'::text);

CREATE POLICY "Public can read API stats"
  ON flight_api_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_flight_api_config_updated_at ON flight_api_config;

-- Create updated_at trigger for flight_api_config
CREATE TRIGGER update_flight_api_config_updated_at
  BEFORE UPDATE ON flight_api_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to ensure single config row
CREATE OR REPLACE FUNCTION ensure_single_config_row()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM flight_api_config) > 0 AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Only one flight API configuration row is allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS ensure_single_config ON flight_api_config;

-- Create trigger to enforce single row
CREATE TRIGGER ensure_single_config
  BEFORE INSERT ON flight_api_config
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_config_row();

-- Insert default configuration if table is empty
INSERT INTO flight_api_config (
  active_api,
  simultaneous_requests,
  oneway_api,
  roundtrip_api,
  rapidapi_key,
  flightapi_key
)
SELECT
  'rapidapi',
  false,
  'rapidapi',
  'rapidapi',
  'eff37b01a1msh6090de6dea39514p108435jsnf7c09e43a0a5',
  'your-flightapi-key-here'
WHERE NOT EXISTS (SELECT 1 FROM flight_api_config);

-- Insert default stats if table is empty
INSERT INTO flight_api_stats (
  rapidapi,
  flightapi
)
SELECT
  '{"error_rate": 0, "total_requests": 0, "avg_response_time": 0}'::jsonb,
  '{"error_rate": 0, "total_requests": 0, "avg_response_time": 0}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM flight_api_stats);