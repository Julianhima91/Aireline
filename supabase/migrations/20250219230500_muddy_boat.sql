/*
  # Create Sales Agents System

  1. New Tables
    - `sales_agents`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, unique, required)
      - `phone_number` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `sales_agents` table
    - Add policies for agent authentication
*/

-- Create sales_agents table
CREATE TABLE sales_agents (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sales_agents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Agents can read own profile"
  ON sales_agents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Agents can update own profile"
  ON sales_agents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE TRIGGER update_sales_agents_updated_at
  BEFORE UPDATE ON sales_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();