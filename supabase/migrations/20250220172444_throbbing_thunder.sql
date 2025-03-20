/*
  # Add Route Popularity Tracking

  1. New Tables
    - `search_route_tracking`
      - `id` (uuid, primary key)
      - `origin` (text) - Airport code
      - `destination` (text) - Airport code
      - `month` (text) - YYYY-MM format
      - `departure_date` (date)
      - `return_date` (date, nullable)
      - `search_count` (integer)
      - `last_search_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Composite index on (origin, destination, month) for faster lookups
    - Index on search_count for sorting by popularity

  3. Functions
    - `update_route_tracking()` - Updates search counts and handles duplicates
*/

-- Create search_route_tracking table
CREATE TABLE search_route_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  month text NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  departure_date date NOT NULL,
  return_date date,
  search_count integer NOT NULL DEFAULT 1,
  last_search_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (
    return_date IS NULL OR return_date > departure_date
  )
);

-- Create indexes
CREATE INDEX idx_route_tracking_composite 
ON search_route_tracking(origin, destination, month);

CREATE INDEX idx_route_tracking_search_count 
ON search_route_tracking(search_count DESC);

-- Create updated_at trigger
CREATE TRIGGER update_route_tracking_updated_at
  BEFORE UPDATE ON search_route_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to update route tracking
CREATE OR REPLACE FUNCTION update_route_tracking(
  p_origin text,
  p_destination text,
  p_departure_date date,
  p_return_date date,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_month text;
  v_last_search timestamptz;
BEGIN
  -- Extract month in YYYY-MM format
  v_month := to_char(p_departure_date, 'YYYY-MM');
  
  -- Check if user has searched this route recently (within 30 minutes)
  IF p_user_id IS NOT NULL THEN
    SELECT last_search_at 
    INTO v_last_search
    FROM search_route_tracking
    WHERE origin = p_origin 
    AND destination = p_destination
    AND month = v_month
    AND departure_date = p_departure_date
    AND (
      (p_return_date IS NULL AND return_date IS NULL) OR
      (return_date = p_return_date)
    )
    AND last_search_at > (now() - interval '30 minutes');
    
    -- Skip if recent search exists
    IF v_last_search IS NOT NULL THEN
      RETURN;
    END IF;
  END IF;

  -- Insert or update tracking record
  INSERT INTO search_route_tracking (
    origin,
    destination,
    month,
    departure_date,
    return_date,
    search_count,
    last_search_at
  )
  VALUES (
    p_origin,
    p_destination,
    v_month,
    p_departure_date,
    p_return_date,
    1,
    now()
  )
  ON CONFLICT (origin, destination, month, departure_date) 
  DO UPDATE SET
    search_count = search_route_tracking.search_count + 1,
    last_search_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create policy for admin access
ALTER TABLE search_route_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can access route tracking"
  ON search_route_tracking
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');