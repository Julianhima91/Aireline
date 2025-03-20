/*
  # Add route demand priority to airport search

  1. New Functions
    - `get_route_demand`: Returns demand level for a route
    - `search_airports_with_demand`: Searches airports with demand prioritization

  2. Changes
    - Add function to search airports with demand consideration
    - Add index for better search performance
    - Fix ambiguous column references
*/

-- Create function to get route demand for origin-destination pair
CREATE OR REPLACE FUNCTION get_route_demand(p_origin text, p_destination text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT search_count 
     FROM route_demand_tracking 
     WHERE origin = p_origin 
     AND destination = p_destination
     ORDER BY last_search_at DESC 
     LIMIT 1),
    0
  );
END;
$$;

-- Create function to search airports with demand prioritization
CREATE OR REPLACE FUNCTION search_airports_with_demand(
  search_query text,
  current_airport text DEFAULT NULL
)
RETURNS TABLE (
  name text,
  city text,
  state text,
  iata_code text,
  demand_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH airport_matches AS (
    SELECT 
      a.name,
      a.city,
      a.state,
      a.iata_code,
      CASE 
        WHEN current_airport IS NOT NULL THEN
          get_route_demand(current_airport, a.iata_code)
        ELSE 0
      END as demand_score
    FROM airports a
    WHERE 
      a.city ILIKE '%' || search_query || '%' OR
      a.state ILIKE '%' || search_query || '%' OR
      a.name ILIKE '%' || search_query || '%' OR
      a.iata_code ILIKE '%' || search_query || '%'
  )
  SELECT 
    am.name,
    am.city,
    am.state,
    am.iata_code,
    am.demand_score
  FROM airport_matches am
  ORDER BY 
    am.demand_score DESC,
    CASE 
      WHEN am.city ILIKE search_query || '%' THEN 1
      WHEN am.iata_code ILIKE search_query || '%' THEN 2
      ELSE 3
    END,
    am.city;
END;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION get_route_demand(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_airports_with_demand(text, text) TO anon, authenticated;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_airports_search 
ON airports USING gin(
  (
    setweight(to_tsvector('simple', coalesce(city,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(state,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(name,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(iata_code,'')), 'A')
  )
);