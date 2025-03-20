-- Create function to process multiple prices at once
CREATE OR REPLACE FUNCTION get_calendar_final_prices(
  p_base_prices jsonb,
  p_trip_type text,
  p_is_return boolean
) RETURNS jsonb AS $$
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_calendar_final_prices(jsonb, text, boolean) TO anon, authenticated;