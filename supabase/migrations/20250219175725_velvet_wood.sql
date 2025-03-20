/*
  # Add batch_id to saved_searches table

  1. Changes
    - Add batch_id column to saved_searches table
    - Create unique index on batch_id
    - Add results column for storing search results

  2. Security
    - Maintain existing RLS policies
*/

-- Add batch_id and results columns to saved_searches
ALTER TABLE saved_searches
ADD COLUMN IF NOT EXISTS batch_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS results jsonb;

-- Create unique index on batch_id
CREATE UNIQUE INDEX IF NOT EXISTS saved_searches_batch_id_idx ON saved_searches(batch_id);

-- Add not null constraint to batch_id
ALTER TABLE saved_searches
ALTER COLUMN batch_id SET NOT NULL;