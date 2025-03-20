/*
  # Fix Admin Dashboard Permissions

  1. Changes
    - Add RLS policies for admin user to access all tables
    - Fix permission denied errors for users table
    - Ensure admin can read and write to admin_settings

  2. Security
    - Policies are restricted to admin user only
    - Admin identified by email 'admin@example.com'
*/

-- Add admin policies for users table
CREATE POLICY "Admin can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );

-- Add admin policies for bookings table
CREATE POLICY "Admin can read all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );

-- Add admin policies for saved_searches table
CREATE POLICY "Admin can read all saved searches"
  ON saved_searches
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );

-- Add admin policies for admin_settings table
CREATE POLICY "Admin can read settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );

CREATE POLICY "Admin can update settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@example.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@example.com'
  );