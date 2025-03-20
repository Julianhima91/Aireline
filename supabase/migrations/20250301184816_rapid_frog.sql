-- Add status column to seo_location_formats table
ALTER TABLE seo_location_formats
ADD COLUMN status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('ready', 'pending', 'disabled'));

-- Add index for status column
CREATE INDEX idx_location_formats_status ON seo_location_formats(status);

-- Add helpful comment
COMMENT ON COLUMN seo_location_formats.status IS 
'Status of the location format configuration:
- ready: OK to be used
- pending: Waiting for configuration
- disabled: Not needed';

-- Update existing rows to have default status
UPDATE seo_location_formats
SET status = 'pending'
WHERE status IS NULL;