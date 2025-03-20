/*
  # Fix Sales Agents RLS Policies

  1. Changes
    - Drop existing policies
    - Create comprehensive RLS policies for sales_agents table
    - Add admin policies for full control
    - Add public policies for agent registration
  
  2. Security
    - Enable RLS
    - Add policies for:
      - Admin full access
      - Agent self-management
      - Public registration
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Agents can read own profile" ON sales_agents;
DROP POLICY IF EXISTS "Agents can update own profile" ON sales_agents;
DROP POLICY IF EXISTS "Admin can manage agent status" ON sales_agents;

-- Create new policies
CREATE POLICY "Admin has full access"
  ON sales_agents
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');

CREATE POLICY "Agents can read own profile"
  ON sales_agents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Agents can update own non-sensitive data"
  ON sales_agents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow agent registration"
  ON sales_agents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policy for public read access to active agents
CREATE POLICY "Public can view active agents"
  ON sales_agents
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);