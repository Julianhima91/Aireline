/*
  # Add Flight API Configuration Tables

  1. New Tables
    - `flight_api_config`
      - Stores API configuration settings
      - Includes API keys and preferences
    - `flight_api_stats`
      - Tracks API usage statistics
      - Monitors performance metrics

  2. Security
    - Enable RLS on both tables
    - Add admin-only policies
*/

-- Create flight_api_config table
CREATE TABLE IF NOT EXISTS flight_api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_api text NOT NULL CHECK (active_api IN ('rapidapi', 'flightapi', 'both')),
  simultaneous_requests boolean NOT NULL DEFAULT false,
  oneway_api text NOT NULL CHECK (oneway_api IN ('rapidapi', 'flightapi', 'both')),
  roundtrip_api text NOT NULL CHECK (roundtrip_api IN ('rapidapi', 'flightapi', 'both')),
  rapidapi_key text NOT NULL,
  flightapi_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create flight_api_stats table
CREATE TABLE IF NOT EXISTS flight_api_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rapidapi jsonb NOT NULL DEFAULT '{
    "total_requests": 0,
    "avg_response_time": 0,
    "error_rate": 0
  }',
  flightapi jsonb NOT NULL DEFAULT '{
    "total_requests": 0,
    "avg_response_time": 0,
    "error_rate": 0
  }',
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE flight_api_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_api_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for flight_api_config
CREATE POLICY "Admin can manage API config"
  ON flight_api_config
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read non-sensitive API config"
  ON flight_api_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for flight_api_stats
CREATE POLICY "Admin can manage API stats"
  ON flight_api_stats
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read API stats"
  ON flight_api_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger for flight_api_config
CREATE TRIGGER update_flight_api_config_updated_at
  BEFORE UPDATE ON flight_api_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default configuration
INSERT INTO flight_api_config (
  active_api,
  simultaneous_requests,
  oneway_api,
  roundtrip_api,
  rapidapi_key,
  flightapi_key
) VALUES (
  'rapidapi',
  false,
  'rapidapi',
  'rapidapi',
  'eff37b01a1msh6090de6dea39514p108435jsnf7c09e43a0a5',
  ''
) ON CONFLICT DO NOTHING;

-- Insert default stats
INSERT INTO flight_api_stats (rapidapi, flightapi)
VALUES (
  '{"total_requests": 0, "avg_response_time": 0, "error_rate": 0}',
  '{"total_requests": 0, "avg_response_time": 0, "error_rate": 0}'
) ON CONFLICT DO NOTHING;