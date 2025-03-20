-- Drop existing view if it exists
DROP VIEW IF EXISTS route_settings_with_demand;

-- Add year_month to route_update_settings
ALTER TABLE route_update_settings 
DROP CONSTRAINT IF EXISTS route_update_settings_route_idx;

-- Drop existing constraint first
ALTER TABLE route_update_settings
DROP CONSTRAINT IF EXISTS route_settings_unique_month;

-- Add year_month column if it doesn't exist
ALTER TABLE route_update_settings 
ADD COLUMN IF NOT EXISTS year_month text CHECK (year_month ~ '^\d{4}-\d{2}$');

-- Create new composite unique constraint with a different name
ALTER TABLE route_update_settings
ADD CONSTRAINT route_settings_unique_month 
UNIQUE (origin, destination, year_month);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_route_settings_composite 
ON route_update_settings(origin, destination, year_month);

CREATE INDEX IF NOT EXISTS idx_route_settings_month 
ON route_update_settings(year_month);

-- Create view to join route settings with demand tracking
CREATE VIEW route_settings_with_demand AS
SELECT 
  rs.id,
  rs.origin,
  rs.destination,
  rs.update_interval,
  rs.is_ignored,
  rs.search_count,
  rs.last_update,
  rs.created_at,
  rs.updated_at,
  rs.year_month,
  COALESCE(rd.demand_level, 'LOW') as demand_level
FROM route_update_settings rs
LEFT JOIN route_demand_tracking rd ON 
  rd.origin = rs.origin AND 
  rd.destination = rs.destination AND 
  rd.year_month = rs.year_month;

-- Grant access to the view
GRANT SELECT ON route_settings_with_demand TO anon, authenticated;

-- Add comment explaining the view
COMMENT ON VIEW route_settings_with_demand IS 
'Joins route update settings with demand tracking data to provide a complete view of route status';