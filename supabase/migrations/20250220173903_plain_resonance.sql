/*
  # Create Calendar Prices Tables

  1. New Tables
    - `calendar_prices`
      - `id` (uuid, primary key)
      - `origin` (text)
      - `destination` (text)
      - `year_month` (text)
      - `price_grid` (jsonb)
      - `last_update` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for public read access
*/

-- Create calendar_prices table
CREATE TABLE calendar_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  year_month text NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  price_grid jsonb NOT NULL,
  last_update timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_route_month UNIQUE (origin, destination, year_month)
);

-- Create indexes
CREATE INDEX idx_calendar_prices_route ON calendar_prices(origin, destination);
CREATE INDEX idx_calendar_prices_month ON calendar_prices(year_month);

-- Create updated_at trigger
CREATE TRIGGER update_calendar_prices_updated_at
  BEFORE UPDATE ON calendar_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE calendar_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to calendar prices"
  ON calendar_prices
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage calendar prices"
  ON calendar_prices
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

-- Create function to check if prices need update
CREATE OR REPLACE FUNCTION should_update_calendar_prices(
  p_origin text,
  p_destination text,
  p_year_month text
) RETURNS boolean AS $$
DECLARE
  v_last_update timestamptz;
  v_update_interval integer;
BEGIN
  -- Get the last update time and update interval for this route
  SELECT 
    cp.last_update,
    COALESCE(rus.update_interval, 6) -- Default to 6 hours if no setting
  INTO v_last_update, v_update_interval
  FROM calendar_prices cp
  LEFT JOIN route_update_settings rus 
    ON rus.origin = cp.origin 
    AND rus.destination = cp.destination
  WHERE cp.origin = p_origin 
    AND cp.destination = p_destination
    AND cp.year_month = p_year_month;

  -- If no record exists or route is not ignored, return true
  IF v_last_update IS NULL THEN
    RETURN true;
  END IF;

  -- Check if enough time has passed since last update
  RETURN (now() - v_last_update) > (v_update_interval || ' hours')::interval;
END;
$$ LANGUAGE plpgsql;