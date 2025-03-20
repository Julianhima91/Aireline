/*
  # Implement Passenger-Based Commission Rules

  1. New Tables
    - `commission_rules` for storing per-passenger type rates
    - `booking_commissions` for tracking applied commissions

  2. Changes
    - Add commission calculation functions
    - Set up default commission rates
    - Add RLS policies
*/

-- Create commission_rules table
CREATE TABLE commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_type text NOT NULL,
  rate numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_passenger_type CHECK (
    passenger_type IN ('adult', 'child', 'infant_seat', 'infant_lap')
  ),
  CONSTRAINT valid_rate CHECK (rate >= 0)
);

-- Create booking_commissions table
CREATE TABLE booking_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  agent_id uuid REFERENCES sales_agents(id),
  total_commission numeric NOT NULL,
  commission_breakdown jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_commissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can manage commission rules"
  ON commission_rules
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Agents can view commission rules"
  ON commission_rules
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sales_agents
    WHERE id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Agents can view own commissions"
  ON booking_commissions
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Admin can view all commissions"
  ON booking_commissions
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Create updated_at triggers
CREATE TRIGGER update_commission_rules_updated_at
  BEFORE UPDATE ON commission_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_booking_commissions_updated_at
  BEFORE UPDATE ON booking_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default commission rates
INSERT INTO commission_rules (passenger_type, rate) VALUES
  ('adult', 20),
  ('child', 10),
  ('infant_seat', 10),
  ('infant_lap', 0);

-- Create commission calculation function
CREATE OR REPLACE FUNCTION calculate_commission(
  p_adults integer,
  p_children integer,
  p_infants_seat integer,
  p_infants_lap integer
) RETURNS TABLE (
  total_commission numeric,
  commission_breakdown jsonb
) AS $$
DECLARE
  adult_rate numeric;
  child_rate numeric;
  infant_seat_rate numeric;
  infant_lap_rate numeric;
BEGIN
  -- Get current rates
  SELECT rate INTO adult_rate FROM commission_rules WHERE passenger_type = 'adult';
  SELECT rate INTO child_rate FROM commission_rules WHERE passenger_type = 'child';
  SELECT rate INTO infant_seat_rate FROM commission_rules WHERE passenger_type = 'infant_seat';
  SELECT rate INTO infant_lap_rate FROM commission_rules WHERE passenger_type = 'infant_lap';

  -- Calculate total commission and breakdown
  RETURN QUERY
  SELECT
    (p_adults * adult_rate + 
     p_children * child_rate + 
     p_infants_seat * infant_seat_rate + 
     p_infants_lap * infant_lap_rate) AS total_commission,
    jsonb_build_object(
      'adult', jsonb_build_object('count', p_adults, 'rate', adult_rate, 'total', p_adults * adult_rate),
      'child', jsonb_build_object('count', p_children, 'rate', child_rate, 'total', p_children * child_rate),
      'infant_seat', jsonb_build_object('count', p_infants_seat, 'rate', infant_seat_rate, 'total', p_infants_seat * infant_seat_rate),
      'infant_lap', jsonb_build_object('count', p_infants_lap, 'rate', infant_lap_rate, 'total', p_infants_lap * infant_lap_rate)
    ) AS commission_breakdown;
END;
$$ LANGUAGE plpgsql;