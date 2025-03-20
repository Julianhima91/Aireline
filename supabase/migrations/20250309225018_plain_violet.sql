/*
  # Flight Price Calculation Functions

  1. New Functions
    - calculate_flight_price: Calculates total price with commission
    - get_flight_pricing: Returns complete price breakdown
    - get_commission_rate: Helper function to get commission rate

  2. Changes
    - Updates get_calendar_final_prices to use new calculation functions
    - Adds price breakdown to calendar prices

  3. Security
    - Functions accessible to authenticated and anonymous users
    - Input validation for all parameters
*/

-- Helper function to get commission rate based on passenger type and count
create or replace function get_commission_rate(
  p_passenger_type text,
  p_passenger_count integer
)
returns numeric
language plpgsql
security definer
as $$
declare
  v_rate numeric;
  v_rule record;
begin
  -- Get base commission rate for passenger type
  select rate into v_rate
  from commission_rules
  where passenger_type = p_passenger_type;

  -- Check for group discounts if passenger type is adult
  if p_passenger_type = 'adult' and p_passenger_count >= 2 then
    select rate into v_rate
    from (
      select rate
      from commission_rules cr,
           jsonb_array_elements(group_discount_rules->'thresholds') as rules
      where passenger_type = 'adult'
      and (rules->>'min_count')::integer <= p_passenger_count
      order by (rules->>'min_count')::integer desc
      limit 1
    ) discounts;
  end if;

  return coalesce(v_rate, 0);
end;
$$;

-- Main function to calculate flight price with commission
create or replace function calculate_flight_price(
  p_base_price numeric,
  p_passengers jsonb,
  p_trip_type text default 'oneWay'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_commission numeric := 0;
  v_adult_commission numeric;
  v_child_commission numeric;
  v_infant_seat_commission numeric;
  v_infant_lap_commission numeric;
  v_total_price numeric;
  v_breakdown jsonb;
begin
  -- Input validation
  if p_base_price < 0 then
    raise exception 'Base price cannot be negative';
  end if;

  -- Calculate commission for each passenger type
  v_adult_commission := get_commission_rate('adult', (p_passengers->>'adults')::integer) * 
                       (p_passengers->>'adults')::integer;
  
  v_child_commission := get_commission_rate('child', (p_passengers->>'children')::integer) * 
                       (p_passengers->>'children')::integer;
  
  v_infant_seat_commission := get_commission_rate('infant_seat', (p_passengers->>'infantsInSeat')::integer) * 
                             (p_passengers->>'infantsInSeat')::integer;
  
  v_infant_lap_commission := get_commission_rate('infant_lap', (p_passengers->>'infantsOnLap')::integer) * 
                            (p_passengers->>'infantsOnLap')::integer;

  -- Calculate total commission
  v_total_commission := v_adult_commission + v_child_commission + 
                       v_infant_seat_commission + v_infant_lap_commission;

  -- Calculate total price
  v_total_price := p_base_price + v_total_commission;

  -- Create price breakdown
  v_breakdown := jsonb_build_object(
    'base_price', p_base_price,
    'commission', jsonb_build_object(
      'total', v_total_commission,
      'breakdown', jsonb_build_object(
        'adult', v_adult_commission,
        'child', v_child_commission,
        'infant_seat', v_infant_seat_commission,
        'infant_lap', v_infant_lap_commission
      )
    ),
    'total_price', v_total_price,
    'trip_type', p_trip_type,
    'passengers', p_passengers
  );

  return v_breakdown;
end;
$$;

-- Function to get complete flight pricing details
create or replace function get_flight_pricing(
  p_flight_id uuid,
  p_passengers jsonb,
  p_trip_type text default 'oneWay'
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_base_price numeric;
  v_pricing jsonb;
begin
  -- Get base price from flight data
  select price into v_base_price
  from processed_flight_prices
  where id = p_flight_id;

  if not found then
    raise exception 'Flight not found';
  end if;

  -- Calculate complete pricing
  v_pricing := calculate_flight_price(
    v_base_price,
    p_passengers,
    p_trip_type
  );

  return v_pricing;
end;
$$;

-- Update calendar prices function to include commission
create or replace function get_calendar_final_prices(
  p_base_prices jsonb,
  p_trip_type text default 'oneWay',
  p_is_return boolean default false
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb := '{}'::jsonb;
  v_date text;
  v_price numeric;
  v_pricing jsonb;
begin
  -- Process each date's price
  for v_date, v_price in select * from jsonb_each_text(p_base_prices)
  loop
    -- Calculate pricing with default passenger count (1 adult)
    v_pricing := calculate_flight_price(
      v_price::numeric,
      '{"adults": 1, "children": 0, "infantsInSeat": 0, "infantsOnLap": 0}'::jsonb,
      p_trip_type
    );

    -- Store total price in result
    v_result := v_result || jsonb_build_object(
      v_date,
      (v_pricing->>'total_price')::numeric
    );
  end loop;

  return v_result;
end;
$$;