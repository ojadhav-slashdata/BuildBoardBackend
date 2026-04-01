-- Migration 005: Bidding auto-assign support + new columns

-- Add estimated hours range to ideas
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS min_hours DOUBLE PRECISION;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS max_hours DOUBLE PRECISION;

-- Add performance score to bids
ALTER TABLE bids ADD COLUMN IF NOT EXISTS performance_score DOUBLE PRECISION DEFAULT 50;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS late_justification TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS is_auto_assigned BOOLEAN DEFAULT false;

-- Add rework support
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS delivery_note TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS rework_feedback TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS rework_items TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS can_rework BOOLEAN DEFAULT true;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS submitted_for_review_at TIMESTAMPTZ;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS submitted_for_review_by UUID REFERENCES users(id);

-- Extension requests table
CREATE TABLE IF NOT EXISTS extension_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    current_date_val TIMESTAMPTZ NOT NULL,
    new_proposed_date TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    is_scope_change BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    manager_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add bid cutoff tracking
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS auto_assigned BOOLEAN DEFAULT false;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS winner_bid_id UUID REFERENCES bids(id);

CREATE INDEX IF NOT EXISTS idx_extension_requests_idea ON extension_requests(idea_id);
