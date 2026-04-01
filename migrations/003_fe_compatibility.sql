-- Migration 003: FE Compatibility
-- Add project_owner_name column and update status/enum values to PascalCase

-- Add project_owner_name text column
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS project_owner_name TEXT;

-- Add bidder_name to bids
ALTER TABLE bids ADD COLUMN IF NOT EXISTS bidder_name TEXT;

-- Drop old CHECK constraints and add PascalCase ones
ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_status_check;
ALTER TABLE ideas ADD CONSTRAINT ideas_status_check CHECK (status IN ('PendingApproval', 'BiddingOpen', 'BiddingClosed', 'InProgress', 'Completed', 'Archived', 'Rejected', 'draft', 'pending', 'approved', 'bidding_closed', 'assigned', 'in_progress', 'completed', 'archived', 'rejected'));

ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_project_type_check;
ALTER TABLE ideas ADD CONSTRAINT ideas_project_type_check CHECK (project_type IN ('POC', 'FullProduct', 'poc', 'product'));

ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_size_check;
ALTER TABLE ideas ADD CONSTRAINT ideas_size_check CHECK (size IN ('Micro', 'Small', 'Medium', 'Large', 'XL', 'Enterprise', 'micro', 'small', 'medium', 'large', 'xl', 'enterprise'));

ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_complexity_check;
ALTER TABLE ideas ADD CONSTRAINT ideas_complexity_check CHECK (complexity IN ('Low', 'Medium', 'High', 'Innovative', 'low', 'medium', 'high', 'innovative'));

ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_status_check;
ALTER TABLE bids ADD CONSTRAINT bids_status_check CHECK (status IN ('Pending', 'Won', 'Not Selected', 'Active', 'pending', 'assigned', 'rejected'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('Employee', 'Manager', 'Admin', 'HR', 'employee', 'manager', 'hr', 'admin'));

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_rating_check;
ALTER TABLE feedbacks ADD CONSTRAINT feedbacks_rating_check CHECK (rating IN ('Poor', 'Average', 'Good', 'Excellent', 'poor', 'average', 'good', 'excellent'));

-- Update existing seed data to PascalCase
UPDATE ideas SET status = 'Completed' WHERE status = 'completed';
UPDATE ideas SET status = 'InProgress' WHERE status = 'in_progress';
UPDATE ideas SET status = 'BiddingOpen' WHERE status = 'approved';
UPDATE ideas SET status = 'PendingApproval' WHERE status = 'pending';
UPDATE ideas SET status = 'Rejected' WHERE status = 'rejected';
UPDATE ideas SET project_type = 'POC' WHERE project_type = 'poc';
UPDATE ideas SET project_type = 'FullProduct' WHERE project_type = 'product';
UPDATE ideas SET size = initcap(size) WHERE size = lower(size);
UPDATE ideas SET complexity = initcap(complexity) WHERE complexity = lower(complexity);

UPDATE bids SET status = 'Won' WHERE status = 'assigned';
UPDATE bids SET status = 'Pending' WHERE status = 'pending';
UPDATE bids SET status = 'Not Selected' WHERE status = 'rejected';

UPDATE users SET role = 'Employee' WHERE role = 'employee';
UPDATE users SET role = 'Manager' WHERE role = 'manager';
UPDATE users SET role = 'Admin' WHERE role = 'admin';
UPDATE users SET role = 'HR' WHERE role = 'hr';

UPDATE feedbacks SET rating = initcap(rating) WHERE rating = lower(rating);
