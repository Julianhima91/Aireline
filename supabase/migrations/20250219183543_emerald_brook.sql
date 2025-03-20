/*
  # Update saved_searches table schema

  1. Changes
    - Drop existing table if exists
    - Create new table with batch_id as primary key
    - Add necessary columns and constraints
    - Enable RLS and add policies

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add policies for admin access
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS saved_searches;

-- Create new saved_searches table with batch_id as primary key
CREATE TABLE saved_searches (
  batch_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  search_params jsonb NOT NULL,
  results jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own saved searches"
  ON saved_searches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved searches"
  ON saved_searches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can read all saved searches"
  ON saved_searches
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- Create indexes for better performance
CREATE INDEX saved_searches_user_id_idx ON saved_searches(user_id);
CREATE INDEX saved_searches_created_at_idx ON saved_searches(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();