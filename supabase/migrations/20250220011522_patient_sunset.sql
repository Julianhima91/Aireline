/*
  # Fix Commission Access for Unauthenticated Users

  1. Changes
    - Add policy to allow anonymous access to commission calculation
    - Modify commission rules policy to allow public read access
    - Keep write access restricted to admin

  2. Security
    - Maintains data integrity by keeping write operations restricted
    - Only exposes necessary commission data to public
*/

-- Allow public read access to commission rules
CREATE POLICY "Public can view commission rules"
  ON commission_rules
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public access to commission calculation function
REVOKE EXECUTE ON FUNCTION calculate_commission(integer, integer, integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION calculate_commission(integer, integer, integer, integer) TO anon, authenticated;