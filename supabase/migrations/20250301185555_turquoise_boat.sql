-- Add type column to seo_location_formats table
ALTER TABLE seo_location_formats
ADD COLUMN type text NOT NULL DEFAULT 'city'
CHECK (type IN ('city', 'state'));

-- Add index for type column
CREATE INDEX idx_location_formats_type ON seo_location_formats(type);

-- Add helpful comment
COMMENT ON COLUMN seo_location_formats.type IS 
'Type of location entry:
- city: City entry with Nga/Për formats
- state: State entry that can have multiple cities';

-- Update existing rows to have city type
UPDATE seo_location_formats
SET type = 'city'
WHERE type IS NULL;