-- Add foreign key relationships between route tracking tables
ALTER TABLE route_update_settings
ADD CONSTRAINT route_update_settings_origin_fkey 
FOREIGN KEY (origin) 
REFERENCES airports(iata_code)
ON DELETE CASCADE;

ALTER TABLE route_update_settings
ADD CONSTRAINT route_update_settings_destination_fkey 
FOREIGN KEY (destination) 
REFERENCES airports(iata_code)
ON DELETE CASCADE;

-- Create view to join route settings with demand tracking
CREATE OR REPLACE VIEW route_settings_with_demand AS
SELECT 
  rs.*,
  rd.demand_level
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