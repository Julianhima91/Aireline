/*
  # Add direct flight information to processed_flight_prices

  1. Changes
    - Add is_direct column to processed_flight_prices table
    - Add index on is_direct column for faster filtering
    - Add check constraint to ensure valid boolean values

  2. Notes
    - Default value set to FALSE for backward compatibility
    - Index added to optimize queries filtering by direct flights
*/

-- Add is_direct column with default value and constraint
ALTER TABLE processed_flight_prices 
  ADD COLUMN is_direct BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for faster filtering by direct flight status
CREATE INDEX idx_processed_prices_direct 
  ON processed_flight_prices (is_direct);

-- Add check constraint to ensure valid boolean values
ALTER TABLE processed_flight_prices
  ADD CONSTRAINT processed_flight_prices_is_direct_check
  CHECK (is_direct IN (TRUE, FALSE));