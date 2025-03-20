-- Create airports table
CREATE TABLE airports (
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
CREATE INDEX idx_airports_iata_code ON airports(iata_code);
CREATE INDEX idx_airports_city ON airports(city);
CREATE INDEX idx_airports_state ON airports(state);