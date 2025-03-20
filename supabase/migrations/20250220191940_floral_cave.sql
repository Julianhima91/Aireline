/*
  # Add commission handling to calendar prices

  1. Changes
    - Add commission calculation for calendar prices
    - Add function to get final price with commission
    - Add function to get commission amount

  2. Security
    - Functions accessible to all roles
*/

-- Function to get commission amount for a trip type
CREATE OR REPLACE FUNCTION get_calendar_commission(
  p_trip_type text,
  p_is_return boolean
) RETURNS numeric AS $$
BEGIN
  -- For one-way flights, always add €20
  IF p_trip_type = 'oneWay' THEN
    RETURN 20;
  END IF;

  -- For round-trip flights:
  -- Add €20 to outbound flight only
  -- Return flight has no additional commission
  IF p_trip_type = 'roundTrip' THEN
    RETURN CASE 
      WHEN NOT p_is_return THEN 20 -- Outbound flight
      ELSE 0                       -- Return flight
    END;
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
) RETURNS numeric AS $$
BEGIN
  RETURN p_base_price + get_calendar_commission(p_trip_type, p_is_return);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_calendar_commission TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_calendar_final_price TO anon, authenticated;