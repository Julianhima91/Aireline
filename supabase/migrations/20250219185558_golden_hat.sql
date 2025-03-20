/*
  # Add caching mechanism for flight prices

  1. Changes
    - Add cached_results column (JSONB) to saved_searches table
    - Add cached_until column (timestamptz) to saved_searches table
    - Add index on cached_until for better query performance

  2. Notes
    - cached_results stores flight data for searches within 7 days
    - cached_until is set to current time + 1 hour
    - Index helps with expiration checks
*/

ALTER TABLE saved_searches
ADD COLUMN cached_results jsonb,
ADD COLUMN cached_until timestamptz;

CREATE INDEX idx_saved_searches_cached_until ON saved_searches(cached_until);