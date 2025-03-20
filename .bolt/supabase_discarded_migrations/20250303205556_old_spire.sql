-- First, clean up any existing test data
DELETE FROM seo_location_connections;
DELETE FROM seo_location_formats 
WHERE (city = 'Tirana' AND state = 'Albania') 
   OR (city = 'Rome' AND state = 'Italy')
   OR (state = 'Albania' AND type = 'state')
   OR (state = 'Italy' AND type = 'state');

-- Insert test data for cities and states
INSERT INTO seo_location_formats (type, city, state, nga_format, per_format, status)
SELECT * FROM (
  VALUES
    ('city', 'Tirana', 'Albania', 'Nga Tirana', 'Per Tirane', 'ready'),
    ('city', 'Rome', 'Italy', 'Nga Roma', 'Per Rome', 'ready'),
    ('state', NULL, 'Albania', 'Nga Shqiperia', 'Per Shqiperi', 'ready'),
    ('state', NULL, 'Italy', 'Nga Italia', 'Per Itali', 'ready')
) AS data(type, city, state, nga_format, per_format, status)
WHERE NOT EXISTS (
  SELECT 1 FROM seo_location_formats
  WHERE (type = data.type AND city = data.city AND state = data.state)
);

-- Create test connections
WITH locations AS (
  SELECT id, type, city, state 
  FROM seo_location_formats 
  WHERE status = 'ready'
)
INSERT INTO seo_location_connections (from_location_id, to_location_id, status)
SELECT DISTINCT
  l1.id as from_location_id,
  l2.id as to_location_id,
  'active' as status
FROM locations l1
CROSS JOIN locations l2
WHERE l1.id != l2.id
  AND NOT (l1.type = 'city' AND l2.type = 'state' AND l1.state = l2.state)
  AND NOT (l1.type = 'state' AND l2.type = 'city' AND l1.state = l2.state)
  AND NOT EXISTS (
    SELECT 1 FROM seo_location_connections
    WHERE from_location_id = l1.id AND to_location_id = l2.id
  );

-- Select and display generated URLs
SELECT 
  CASE 
    WHEN fl.type = 'city' THEN fl.city
    ELSE fl.state
  END as from_location,
  fl.state as from_state,
  CASE 
    WHEN tl.type = 'city' THEN tl.city
    ELSE tl.state
  END as to_location,
  tl.state as to_state,
  c.template_url
FROM seo_location_connections c
JOIN seo_location_formats fl ON fl.id = c.from_location_id
JOIN seo_location_formats tl ON tl.id = c.to_location_id
WHERE c.status = 'active'
ORDER BY fl.type, tl.type, fl.state, tl.state;