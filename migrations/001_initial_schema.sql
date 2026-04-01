-- Migration 001: Initial Schema
-- Creates all BuildBoard tables

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'hr', 'admin')),
    department TEXT,
    total_points INTEGER NOT NULL DEFAULT 0,
    google_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    project_type TEXT NOT NULL DEFAULT 'poc' CHECK (project_type IN ('poc', 'product')),
    size TEXT NOT NULL DEFAULT 'micro' CHECK (size IN ('micro', 'small', 'medium', 'large', 'xl', 'enterprise')),
    complexity TEXT NOT NULL DEFAULT 'low' CHECK (complexity IN ('low', 'medium', 'high', 'innovative')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'bidding_closed', 'assigned', 'in_progress', 'completed', 'archived', 'rejected')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    submitted_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    project_owner UUID REFERENCES users(id),
    estimated_hours DOUBLE PRECISION,
    actual_hours DOUBLE PRECISION,
    points_reward INTEGER NOT NULL DEFAULT 0,
    bid_cutoff_date TIMESTAMPTZ,
    expected_delivery_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    bid_type TEXT NOT NULL DEFAULT 'solo' CHECK (bid_type IN ('solo', 'team')),
    lead_user_id UUID REFERENCES users(id),
    proposed_hours DOUBLE PRECISION NOT NULL,
    approach_note TEXT,
    committed_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(bid_id, user_id)
);

CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    hours DOUBLE PRECISION NOT NULL,
    description TEXT,
    logged_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('owner', 'contributor', 'reviewer', 'project_owner')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    rating TEXT NOT NULL CHECK (rating IN ('poor', 'average', 'good', 'excellent')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    reward_description TEXT,
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_submitted_by ON ideas(submitted_by);
CREATE INDEX IF NOT EXISTS idx_ideas_project_owner ON ideas(project_owner);
CREATE INDEX IF NOT EXISTS idx_bids_idea_id ON bids(idea_id);
CREATE INDEX IF NOT EXISTS idx_bids_lead_user_id ON bids(lead_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_bid_id ON team_members(bid_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_idea_id ON time_logs(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_members_idea_id ON idea_members(idea_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_idea_id ON feedbacks(idea_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
