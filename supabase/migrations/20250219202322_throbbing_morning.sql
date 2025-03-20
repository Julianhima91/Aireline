/*
  # Update saved searches policies

  1. Changes
    - Add policy for anonymous searches
    - Update existing policies for authenticated users
    - Ensure proper access control for all operations

  2. Security
    - Allow anonymous users to create searches with a default user ID
    - Maintain RLS for authenticated users
    - Preserve admin access to all searches
*/

-- Drop existing policies for saved_searches
DROP POLICY IF EXISTS "Users can read own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can create own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Admin can read all saved searches" ON saved_searches;

-- Create new policies for saved_searches
CREATE POLICY "Allow anonymous searches"
  ON saved_searches
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id = '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Allow reading searches"
  ON saved_searches
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id = '00000000-0000-0000-0000-000000000000'
    OR
    (auth.role() = 'authenticated' AND (
      user_id = auth.uid()
      OR
      auth.jwt() ->> 'email' = 'admin@example.com'
    ))
  );

CREATE POLICY "Authenticated users can create searches"
  ON saved_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR
    auth.jwt() ->> 'email' = 'admin@example.com'
  );

CREATE POLICY "Users can update own searches"
  ON saved_searches
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    auth.jwt() ->> 'email' = 'admin@example.com'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    auth.jwt() ->> 'email' = 'admin@example.com'
  );