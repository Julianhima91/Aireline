/*
  # Add Route Tracking Error Logging

  1. New Table
    - route_tracking_errors: Stores errors from route tracking updates
    - Includes error details, timestamps, and route information
    - Helps with debugging and monitoring

  2. Security
    - Enable RLS
    - Admin-only write access
    - Public read access for error monitoring
*/

-- Create route_tracking_errors table
CREATE TABLE route_tracking_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  year_month text NOT NULL CHECK (year_month ~ '^\d{4}-\d{2}$'),
  error_message text NOT NULL,
  stack_trace text,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (origin) REFERENCES airports(iata_code) ON DELETE CASCADE,
  FOREIGN KEY (destination) REFERENCES airports(iata_code) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_tracking_errors_route 
ON route_tracking_errors(origin, destination);

CREATE INDEX idx_tracking_errors_date 
ON route_tracking_errors(created_at);

-- Enable RLS
ALTER TABLE route_tracking_errors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage tracking errors"
  ON route_tracking_errors
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'admin@example.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'admin@example.com'::text);

CREATE POLICY "Public can read tracking errors"
  ON route_tracking_errors
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Add helpful comments
COMMENT ON TABLE route_tracking_errors IS 
'Stores errors encountered during route tracking updates';

COMMENT ON COLUMN route_tracking_errors.error_message IS 
'The error message from the failed update';

COMMENT ON COLUMN route_tracking_errors.stack_trace IS 
'Full error stack trace for debugging';