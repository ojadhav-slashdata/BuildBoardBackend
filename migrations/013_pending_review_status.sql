-- Migration 013: Add PendingReview status
ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_status_check;
ALTER TABLE ideas ADD CONSTRAINT ideas_status_check CHECK (status IN (
  'PendingApproval', 'BiddingOpen', 'BiddingClosed', 'InProgress', 'PendingReview', 'Completed', 'Archived', 'Rejected', 'Expired',
  'draft', 'pending', 'approved', 'bidding_closed', 'assigned', 'in_progress', 'completed', 'archived', 'rejected'
));
