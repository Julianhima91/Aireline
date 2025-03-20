/*
  # Update Calendar Commission Functions

  1. Changes
    - Update get_calendar_commission to handle round-trip commission splitting
    - Add function to calculate final price with commission
    - Add helper function for commission calculation

  2. Security
    - Maintain existing RLS policies
    - Keep existing permissions
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_calendar_commission(text, boolean);
DROP FUNCTION IF EXISTS get_calendar_final_price(numeric, text, boolean);
DROP FUNCTION IF EXISTS get_calendar_final_prices(jsonb, text, boolean);

-- Create function to get commission amount for a trip type
CREATE OR REPLACE FUNCTION get_calendar_commission(
  p_trip_type text,
  p_is_return boolean
)
RETURNS numeric AS $$
BEGIN
  -- For one-way flights, always add €20
  IF p_trip_type = 'oneWay' THEN
    RETURN 20;
  END IF;

  -- For round-trip flights:
  -- Split €20 commission equally between outbound and return
  IF p_trip_type = 'roundTrip' THEN
    RETURN 10; -- €10 per leg (50% of €20)
  END IF;

  -- Default case (should never happen)
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get final price with commission
CREATE OR REPLACE FUNCTION get_calendar_final_price(
  p_base_price numeric,
  p_trip_type text,
  p_is_return boolean
)
RETURNS numeric AS $$
BEGIN
  RETURN p_base_price + get_calendar_commission(p_trip_type, p_is_return);
END;
$$ LANGUAGE plpgsql;

-- Function to process multiple prices at once
CREATE OR REPLACE FUNCTION get_calendar_final_prices(
  p_base_prices jsonb,
  p_trip_type text,
  p_is_return boolean
)
RETURNS jsonb AS $$
DECLARE
  v_commission numeric;
  v_result jsonb := '{}'::jsonb;
  v_date text;
  v_price numeric;
BEGIN
  -- Get commission amount once
  v_commission := get_calendar_commission(p_trip_type, p_is_return);
  
  -- Process all prices in one go
  FOR v_date, v_price IN 
    SELECT * FROM jsonb_each_text(p_base_prices)
  LOOP
    v_result := v_result || 
      jsonb_build_object(
        v_date,
        (v_price::numeric + v_commission)::numeric(10,2)
      );
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_calendar_commission TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_final_price TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_final_prices TO anon, authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_calendar_commission IS 
'Calculates commission based on trip type:
- One-way flights: €20 commission
- Round-trip flights: €10 per leg (50% of total commission)';

COMMENT ON FUNCTION get_calendar_final_price IS 
'Calculates final price including commission for a single price';

COMMENT ON FUNCTION get_calendar_final_prices IS 
'Calculates final prices including commission for multiple prices at once';