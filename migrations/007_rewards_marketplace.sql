-- Migration 007: Rewards Marketplace

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🎁',
    tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 4),
    points_cost INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other' CHECK (category IN ('Gift cards', 'Staycations', 'Meals', 'Swag', 'Learning', 'Experience', 'Other')),
    available BOOLEAN DEFAULT true,
    guaranteed_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    reward_id UUID NOT NULL REFERENCES rewards(id),
    points_spent INTEGER NOT NULL,
    platform TEXT,
    delivery_email TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Fulfilled', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Savings goals
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    reward_id UUID NOT NULL REFERENCES rewards(id),
    target_points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, reward_id)
);

-- Points batches (for expiry tracking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS redeemable_points INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS point_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    points INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    source TEXT,
    idea_id UUID REFERENCES ideas(id),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '12 months')
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_point_batches_user ON point_batches(user_id);

-- Seed default rewards catalog
INSERT INTO rewards (title, description, icon, tier, points_cost, category) VALUES
  ('Online course credit', 'Coursera, Udemy, LinkedIn Learning', '📚', 1, 250, 'Learning'),
  ('Meal voucher', 'Partner restaurants · AED 100 value', '🍽️', 1, 350, 'Meals'),
  ('Gift card — your choice', 'Amazon, Noon, Carrefour · AED 200', '🎁', 2, 500, 'Gift cards'),
  ('Spa day experience', 'Partner spas · solo session', '🧖', 2, 800, 'Staycations'),
  ('Weekend staycation', '2-night hotel for 2 · UAE partners', '🏨', 3, 1500, 'Staycations'),
  ('Premium gift card', 'Apple, Samsung · AED 500 value', '🎁', 3, 2000, 'Gift cards'),
  ('Dubai weekend experience', 'Activities + dining + hotel · 2 people', '🏖️', 4, 3000, 'Experience'),
  ('Travel voucher', 'Airline or hotel · AED 1,500 value', '✈️', 4, 3500, 'Experience')
ON CONFLICT DO NOTHING;
