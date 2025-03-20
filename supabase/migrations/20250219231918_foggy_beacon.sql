-- Add is_active column to sales_agents table
ALTER TABLE sales_agents
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create index for better performance on status filtering
CREATE INDEX idx_sales_agents_is_active ON sales_agents(is_active);

-- Add admin policy to manage agent status
CREATE POLICY "Admin can manage agent status"
  ON sales_agents
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@example.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@example.com');