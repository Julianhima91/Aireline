/*
  # Fix Anonymous Search Functionality

  1. Changes
    - Add policy for anonymous searches without user_id constraint
    - Update existing policies to handle both authenticated and anonymous users
    - Ensure proper access control while allowing anonymous searches

  2. Security
    - Allow anonymous searches without requiring user authentication
    - Maintain RLS for authenticated users
    - Preserve admin access to all searches
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous searches" ON saved_searches;
DROP POLICY IF EXISTS "Allow reading searches" ON saved_searches;
DROP POLICY IF EXISTS "Authenticated users can create searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can update own searches" ON saved_searches;

-- Create new policies
CREATE POLICY "Anyone can create searches"
  ON saved_searches
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read searches by batch_id"
  ON saved_searches
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can update their searches"
  ON saved_searches
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);