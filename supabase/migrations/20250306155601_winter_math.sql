/*
  # Add direct flight information to calendar_prices

  1. Changes
    - Add has_direct_flight column to calendar_prices table
    - Add index on has_direct_flight column for faster filtering
    - Add check constraint to ensure valid boolean values

  2. Notes
    - Default value set to FALSE for backward compatibility
    - Index added to optimize queries filtering by direct flights
*/

-- Add has_direct_flight column with default value and constraint
ALTER TABLE calendar_prices 
  ADD COLUMN has_direct_flight BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for faster filtering by direct flight status
CREATE INDEX idx_calendar_prices_direct 
  ON calendar_prices (has_direct_flight);

-- Add check constraint to ensure valid boolean values
ALTER TABLE calendar_prices
  ADD CONSTRAINT calendar_prices_has_direct_flight_check
  CHECK (has_direct_flight IN (TRUE, FALSE));