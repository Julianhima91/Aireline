/*
  # Add Flight API Configuration

  1. New Tables
    - `flight_api_config`
      - Stores API configuration settings
      - Controls which API to use for different search types
      - Manages API keys and simultaneous request settings
    
    - `flight_api_stats`
      - Tracks API usage statistics
      - Monitors response times and error rates
      - Helps optimize API selection

  2. Security
    - Enable RLS on both tables
    - Admin-only write access
    - Public read access for non-sensitive data

  3. Default Data
    - Insert initial configuration
    - Set up default statistics tracking
*/

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS update_flight_api_config_updated_at ON flight_api_config;
DROP TRIGGER IF EXISTS ensure_single_config ON flight_api_config;
DROP FUNCTION IF EXISTS ensure_single_config_row();
DROP TABLE IF EXISTS flight_api_config CASCADE;
DROP TABLE IF EXISTS flight_api_stats CASCADE;

-- Create flight_api_config table
CREATE TABLE flight_api_config (
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

-- Create flight_api_stats table
CREATE TABLE flight_api_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rapidapi jsonb NOT NULL DEFAULT '{"error_rate": 0, "total_requests": 0, "avg_response_time": 0}'::jsonb,
  flightapi jsonb NOT NULL DEFAULT '{"error_rate": 0, "total_requests": 0, "avg_response_time": 0}'::jsonb,
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

-- Create function to ensure single config row
CREATE FUNCTION ensure_single_config_row()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM flight_api_config) > 0 AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Only one flight API configuration row is allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER ensure_single_config
  BEFORE INSERT ON flight_api_config
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_config_row();

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
  'your-flightapi-key-here'
) ON CONFLICT DO NOTHING;

-- Insert default stats
INSERT INTO flight_api_stats (
  rapidapi,
  flightapi
) VALUES (
  '{"error_rate": 0, "total_requests": 0, "avg_response_time": 0}'::jsonb,
  '{"error_rate": 0, "total_requests": 0, "avg_response_time": 0}'::jsonb
) ON CONFLICT DO NOTHING;