/*
  # Add price stability level to saved searches

  1. Changes
    - Add price_stability_level column to saved_searches table
    - Set default value to 'MEDIUM'
    - Add check constraint to ensure valid values

  2. Notes
    - Values can be: 'HIGH', 'MEDIUM', 'LOW'
    - Default is 'MEDIUM' for all searches
*/

ALTER TABLE saved_searches
ADD COLUMN price_stability_level text NOT NULL DEFAULT 'MEDIUM'
CHECK (price_stability_level IN ('HIGH', 'MEDIUM', 'LOW'));