-- Drop existing objects if they exist
DROP POLICY IF EXISTS "Public can read airports" ON airports;
DROP POLICY IF EXISTS "Admin can manage airports" ON airports;
DROP TRIGGER IF EXISTS update_airports_updated_at ON airports;
DROP INDEX IF EXISTS idx_airports_iata_code;
DROP INDEX IF EXISTS idx_airports_city;
DROP INDEX IF EXISTS idx_airports_state;

-- Create airports table if it doesn't exist
CREATE TABLE IF NOT EXISTS airports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  iata_code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE airports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can read airports"
  ON airports
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage airports"
  ON airports
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Create updated_at trigger
CREATE TRIGGER update_airports_updated_at
  BEFORE UPDATE ON airports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_airports_iata_code ON airports(iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_city ON airports(city);
CREATE INDEX IF NOT EXISTS idx_airports_state ON airports(state);

-- Insert some initial airports
INSERT INTO airports (name, city, state, iata_code) VALUES
  ('Tirana International Airport', 'Tirana', 'Albania', 'TIA'),
  ('Rome Fiumicino Airport', 'Rome', 'Italy', 'FCO'),
  ('Vienna International Airport', 'Vienna', 'Austria', 'VIE'),
  ('Istanbul Airport', 'Istanbul', 'Turkey', 'IST'),
  ('Dubai International Airport', 'Dubai', 'United Arab Emirates', 'DXB')
ON CONFLICT (iata_code) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  state = EXCLUDED.state;