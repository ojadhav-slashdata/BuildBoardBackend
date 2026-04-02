-- Migration 006: Business context fields + cutoff time precision

-- Business context fields on ideas
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS business_value TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS resources TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS challenges TEXT;

-- Make bid_cutoff_date support exact time (already TIMESTAMPTZ, just documenting)
-- Add rejection comment to ideas
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS rejection_comment TEXT;
