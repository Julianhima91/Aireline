-- Add error tracking columns to saved_searches
ALTER TABLE saved_searches
ADD COLUMN last_error text,
ADD COLUMN error_timestamp timestamptz;