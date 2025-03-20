/*
  # Implement Group Discount Commission Rules

  1. Changes
    - Add group discount rules to commission_rules table
    - Create function to calculate group rates
    - Update commission calculation to support group discounts

  2. Group Discount Structure
    - 2 adults: €15 per person (Save €10 total)
    - 3 adults: €13.33 per person (Save €20 total)
    - 4 adults: €15 per person (Save €20 total)
    - 5+ adults: Fixed €15 per person
*/

-- Add columns to commission_rules for group discounts
ALTER TABLE commission_rules
ADD COLUMN group_discount_rules jsonb DEFAULT NULL;

-- Update adult commission rule with group discount rules
UPDATE commission_rules
SET group_discount_rules = jsonb_build_object(
  'thresholds', jsonb_build_array(
    jsonb_build_object('min_count', 2, 'rate', 15),
    jsonb_build_object('min_count', 3, 'rate', 13.33),
    jsonb_build_object('min_count', 4, 'rate', 15),
    jsonb_build_object('min_count', 5, 'rate', 15)
  )
)
WHERE passenger_type = 'adult';

-- Create function to calculate group discount
CREATE OR REPLACE FUNCTION calculate_adult_group_rate(p_adult_count integer)
RETURNS numeric AS $$
DECLARE
  base_rate numeric;
  discount_rules jsonb;
  applicable_rate numeric;
BEGIN
  -- Get base rate and discount rules
  SELECT rate, group_discount_rules 
  INTO base_rate, discount_rules
  FROM commission_rules 
  WHERE passenger_type = 'adult';

  -- Default to base rate
  applicable_rate := base_rate;

  -- Apply group discount if applicable
  IF p_adult_count >= 2 THEN
    -- Find applicable threshold
    SELECT (rule->>'rate')::numeric INTO applicable_rate
    FROM jsonb_array_elements(discount_rules->'thresholds') AS rule
    WHERE (rule->>'min_count')::integer <= p_adult_count
    ORDER BY (rule->>'min_count')::integer DESC
    LIMIT 1;
  END IF;

  RETURN applicable_rate;
END;
$$ LANGUAGE plpgsql;

-- Drop existing commission calculation function
DROP FUNCTION IF EXISTS calculate_commission(integer, integer, integer, integer);

-- Create new commission calculation function with updated return type
CREATE OR REPLACE FUNCTION calculate_commission(
  p_adults integer,
  p_children integer,
  p_infants_seat integer,
  p_infants_lap integer
) RETURNS TABLE (
  total_commission numeric,
  discounted_commission numeric,
  commission_breakdown jsonb,
  discount_applied boolean,
  savings numeric
) AS $$
DECLARE
  adult_base_rate numeric;
  adult_group_rate numeric;
  child_rate numeric;
  infant_seat_rate numeric;
  infant_lap_rate numeric;
  standard_total numeric;
  discounted_total numeric;
BEGIN
  -- Get rates
  SELECT rate INTO adult_base_rate FROM commission_rules WHERE passenger_type = 'adult';
  SELECT rate INTO child_rate FROM commission_rules WHERE passenger_type = 'child';
  SELECT rate INTO infant_seat_rate FROM commission_rules WHERE passenger_type = 'infant_seat';
  SELECT rate INTO infant_lap_rate FROM commission_rules WHERE passenger_type = 'infant_lap';

  -- Calculate adult group rate
  adult_group_rate := calculate_adult_group_rate(p_adults);

  -- Calculate standard total
  standard_total := (
    p_adults * adult_base_rate +
    p_children * child_rate +
    p_infants_seat * infant_seat_rate +
    p_infants_lap * infant_lap_rate
  );

  -- Calculate discounted total
  discounted_total := (
    p_adults * adult_group_rate +
    p_children * child_rate +
    p_infants_seat * infant_seat_rate +
    p_infants_lap * infant_lap_rate
  );

  RETURN QUERY
  SELECT
    standard_total AS total_commission,
    discounted_total AS discounted_commission,
    jsonb_build_object(
      'standard', jsonb_build_object(
        'adult', jsonb_build_object('count', p_adults, 'rate', adult_base_rate, 'total', p_adults * adult_base_rate),
        'child', jsonb_build_object('count', p_children, 'rate', child_rate, 'total', p_children * child_rate),
        'infant_seat', jsonb_build_object('count', p_infants_seat, 'rate', infant_seat_rate, 'total', p_infants_seat * infant_seat_rate),
        'infant_lap', jsonb_build_object('count', p_infants_lap, 'rate', infant_lap_rate, 'total', p_infants_lap * infant_lap_rate)
      ),
      'discounted', jsonb_build_object(
        'adult', jsonb_build_object('count', p_adults, 'rate', adult_group_rate, 'total', p_adults * adult_group_rate),
        'child', jsonb_build_object('count', p_children, 'rate', child_rate, 'total', p_children * child_rate),
        'infant_seat', jsonb_build_object('count', p_infants_seat, 'rate', infant_seat_rate, 'total', p_infants_seat * infant_seat_rate),
        'infant_lap', jsonb_build_object('count', p_infants_lap, 'rate', infant_lap_rate, 'total', p_infants_lap * infant_lap_rate)
      )
    ) AS commission_breakdown,
    (standard_total != discounted_total) AS discount_applied,
    (standard_total - discounted_total) AS savings;
END;
$$ LANGUAGE plpgsql;