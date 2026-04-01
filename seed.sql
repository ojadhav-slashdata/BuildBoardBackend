-- ============================================
-- BuildBoard — Seed Data for Demo
-- Run this AFTER the migration SQL
-- ============================================

-- 1. Insert demo users
INSERT INTO users (id, email, full_name, avatar_url, role, department, total_points, google_id) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'admin@demo.com', 'Abrar Admin', null, 'admin', 'Management', 0, 'google_admin_001'),
  ('a1000000-0000-0000-0000-000000000002', 'manager@demo.com', 'Maya Manager', null, 'manager', 'Engineering', 0, 'google_mgr_001'),
  ('a1000000-0000-0000-0000-000000000003', 'john@demo.com', 'John Developer', null, 'employee', 'Engineering', 150, 'google_emp_001'),
  ('a1000000-0000-0000-0000-000000000004', 'sara@demo.com', 'Sara Builder', null, 'employee', 'Design', 75, 'google_emp_002'),
  ('a1000000-0000-0000-0000-000000000005', 'hr@demo.com', 'Helen HR', null, 'hr', 'Human Resources', 0, 'google_hr_001');

-- 2. Insert demo ideas (various statuses)
INSERT INTO ideas (id, title, description, category, project_type, size, complexity, status, priority, submitted_by, approved_by, project_owner, estimated_hours, actual_hours, points_reward, bid_cutoff_date, expected_delivery_date, completed_at) VALUES
  -- Completed idea
  ('b1000000-0000-0000-0000-000000000001',
   'AI-Powered Code Review Bot',
   'Build a bot that auto-reviews PRs using Claude API and posts suggestions as comments.',
   'AI/ML', 'poc', 'medium', 'high', 'completed', 'high',
   'a1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000002',
   40, 35, 112,
   '2026-03-25T00:00:00Z', '2026-04-01T00:00:00Z', '2026-03-30T00:00:00Z'),

  -- In progress idea
  ('b1000000-0000-0000-0000-000000000002',
   'Employee Onboarding Portal',
   'Self-service portal for new joiners to complete onboarding steps, upload docs, and track progress.',
   'Internal Tools', 'product', 'large', 'medium', 'in_progress', 'medium',
   'a1000000-0000-0000-0000-000000000004',
   'a1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000005',
   80, 25, 0,
   '2026-03-28T00:00:00Z', '2026-04-15T00:00:00Z', null),

  -- Approved (open for bidding)
  ('b1000000-0000-0000-0000-000000000003',
   'Slack Standup Bot',
   'Automated daily standup collection via Slack with summary posted to a channel.',
   'Automation', 'poc', 'small', 'low', 'approved', 'low',
   'a1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000002',
   null, 16, null, 0,
   '2026-04-05T00:00:00Z', '2026-04-10T00:00:00Z', null),

  -- Pending approval
  ('b1000000-0000-0000-0000-000000000004',
   'Internal Knowledge Base Search',
   'Semantic search across company docs, wikis, and Confluence using embeddings.',
   'AI/ML', 'product', 'micro', 'low', 'pending', 'high',
   'a1000000-0000-0000-0000-000000000004',
   null, null, null, null, 0, null, null, null),

  -- Another pending
  ('b1000000-0000-0000-0000-000000000005',
   'Meeting Room Booking Dashboard',
   'Real-time dashboard showing meeting room availability integrated with Google Calendar.',
   'Internal Tools', 'poc', 'micro', 'low', 'pending', 'medium',
   'a1000000-0000-0000-0000-000000000003',
   null, null, null, null, 0, null, null, null);

-- 3. Insert bids
INSERT INTO bids (id, idea_id, user_id, bid_type, lead_user_id, proposed_hours, approach_note, committed_date, status) VALUES
  -- Assigned bid on completed idea (solo)
  ('c1000000-0000-0000-0000-000000000001',
   'b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000003',
   'solo', null, 35,
   'Will use Claude API with GitHub webhooks for PR events.',
   '2026-04-01T00:00:00Z', 'assigned'),

  -- Assigned team bid on in-progress idea
  ('c1000000-0000-0000-0000-000000000002',
   'b1000000-0000-0000-0000-000000000002',
   'a1000000-0000-0000-0000-000000000004',
   'team', 'a1000000-0000-0000-0000-000000000004', 70,
   'React frontend + Node backend. Sara leads UI, John on APIs.',
   '2026-04-15T00:00:00Z', 'assigned'),

  -- Pending bid on approved idea
  ('c1000000-0000-0000-0000-000000000003',
   'b1000000-0000-0000-0000-000000000003',
   'a1000000-0000-0000-0000-000000000003',
   'solo', null, 12,
   'Slack Bolt framework + cron job for daily triggers.',
   '2026-04-09T00:00:00Z', 'pending');

-- 4. Team members for team bid
INSERT INTO team_members (bid_id, user_id, confirmed) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', true),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', true);

-- 5. Idea members (access control)
INSERT INTO idea_members (idea_id, user_id, role) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'owner'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'project_owner'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'owner'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'contributor'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'project_owner'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'owner');

-- 6. Time logs
INSERT INTO time_logs (idea_id, user_id, hours, description, logged_date) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 8, 'Set up GitHub webhook + Claude API integration', '2026-03-26'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 10, 'Built PR comment parser and response formatter', '2026-03-27'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 9, 'Testing and edge cases', '2026-03-28'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 8, 'Final polish and demo prep', '2026-03-29'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 6, 'Wireframes and component structure', '2026-03-30'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 5, 'Backend API scaffolding', '2026-03-30'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 7, 'Onboarding form UI', '2026-03-31'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 7, 'Document upload API + storage', '2026-03-31');

-- 7. Comments
INSERT INTO comments (idea_id, user_id, content) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Great progress! Can we add multi-language support?'),
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'Sure, will add language detection in next iteration.'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', 'Please make sure the doc upload supports PDF and images.'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', 'Already handled — using Supabase storage with type validation.'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Planning to use Slack Bolt — any preference on the summary format?');

-- 8. Feedback on completed idea
INSERT INTO feedbacks (idea_id, user_id, rating, comment) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'excellent', 'Fantastic demo! The bot caught real issues in test PRs. Early delivery too.');

-- 9. Update John''s points (from the completed idea: medium + high complexity + early + excellent = 112)
UPDATE users SET total_points = 112 WHERE id = 'a1000000-0000-0000-0000-000000000003';
