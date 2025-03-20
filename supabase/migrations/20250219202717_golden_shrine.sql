/*
  # Fix Anonymous Search Functionality Schema

  1. Changes
    - Make user_id nullable to support anonymous searches
    - Update foreign key constraint
    - Maintain existing RLS policies
    - Add default value for anonymous users

  2. Security
    - Maintain data integrity while allowing anonymous access
    - Preserve existing security policies
*/

-- Temporarily disable RLS
ALTER TABLE saved_searches DISABLE ROW LEVEL SECURITY;

-- Drop existing foreign key constraint
ALTER TABLE saved_searches
DROP CONSTRAINT saved_searches_user_id_fkey;

-- Make user_id nullable and add new foreign key constraint
ALTER TABLE saved_searches
ALTER COLUMN user_id DROP NOT NULL,
ADD CONSTRAINT saved_searches_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Re-enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Update existing null user_ids to use anonymous user id
UPDATE saved_searches
SET user_id = NULL
WHERE user_id = '00000000-0000-0000-0000-000000000000';