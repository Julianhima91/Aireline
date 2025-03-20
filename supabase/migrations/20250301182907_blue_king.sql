-- Create seo_enabled_states table
CREATE TABLE seo_enabled_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE seo_enabled_states ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage SEO states"
  ON seo_enabled_states
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Public can read SEO states"
  ON seo_enabled_states
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_seo_states_updated_at
  BEFORE UPDATE ON seo_enabled_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX idx_seo_states_state_name ON seo_enabled_states(state_name);
CREATE INDEX idx_seo_states_updated_at ON seo_enabled_states(updated_at);

-- Add helpful comment
COMMENT ON TABLE seo_enabled_states IS 
'Stores which states have SEO features enabled. States not present in this table are considered disabled.';