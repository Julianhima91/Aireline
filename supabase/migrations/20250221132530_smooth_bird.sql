-- Create scoring_settings table
CREATE TABLE scoring_settings (
  id text PRIMARY KEY DEFAULT 'default',
  settings jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE scoring_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage scoring settings"
  ON scoring_settings
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read scoring settings"
  ON scoring_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_scoring_settings_updated_at
  BEFORE UPDATE ON scoring_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default settings
INSERT INTO scoring_settings (id, settings) VALUES (
  'default',
  '{
    "direct_flight_bonus": 5,
    "arrival_time_bonuses": {
      "early_morning": { "start": 3, "end": 10, "points": 5 },
      "morning": { "start": 10, "end": 15, "points": 3 }
    },
    "departure_time_bonuses": {
      "afternoon": { "start": 14, "end": 18, "points": 3 },
      "evening": { "start": 18, "end": 24, "points": 5 }
    },
    "stop_penalties": {
      "one_stop": -5,
      "two_plus_stops": -10
    },
    "duration_penalties": {
      "medium": { "hours": 4, "points": -1 },
      "long": { "hours": 6, "points": -2 },
      "very_long": { "hours": 6, "points": -3 }
    }
  }'::jsonb
);