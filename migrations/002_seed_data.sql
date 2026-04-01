-- Migration 002: Seed Demo Data
-- Only inserts if users table is empty (safe to re-run)

INSERT INTO users (id, email, full_name, avatar_url, role, department, total_points, google_id)
SELECT * FROM (VALUES
  ('a1000000-0000-0000-0000-000000000001'::uuid, 'admin@demo.com', 'Abrar Admin', null::text, 'admin', 'Management', 0, 'google_admin_001'),
  ('a1000000-0000-0000-0000-000000000002'::uuid, 'manager@demo.com', 'Maya Manager', null, 'manager', 'Engineering', 0, 'google_mgr_001'),
  ('a1000000-0000-0000-0000-000000000003'::uuid, 'john@demo.com', 'John Developer', null, 'employee', 'Engineering', 150, 'google_emp_001'),
  ('a1000000-0000-0000-0000-000000000004'::uuid, 'sara@demo.com', 'Sara Builder', null, 'employee', 'Design', 75, 'google_emp_002'),
  ('a1000000-0000-0000-0000-000000000005'::uuid, 'hr@demo.com', 'Helen HR', null, 'hr', 'Human Resources', 0, 'google_hr_001')
) AS v(id, email, full_name, avatar_url, role, department, total_points, google_id)
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ideas (id, title, description, category, project_type, size, complexity, status, priority, submitted_by, approved_by, project_owner, estimated_hours, actual_hours, points_reward, bid_cutoff_date, expected_delivery_date, completed_at)
SELECT * FROM (VALUES
  ('b1000000-0000-0000-0000-000000000001'::uuid,
   'AI-Powered Code Review Bot',
   'Build a bot that auto-reviews PRs using Claude API and posts suggestions as comments.',
   'AI/ML', 'poc', 'medium', 'high', 'completed', 'high',
   'a1000000-0000-0000-0000-000000000003'::uuid,
   'a1000000-0000-0000-0000-000000000002'::uuid,
   'a1000000-0000-0000-0000-000000000002'::uuid,
   40::double precision, 35::double precision, 112, '2026-03-25T00:00:00Z'::timestamptz, '2026-04-01T00:00:00Z'::timestamptz, '2026-03-30T00:00:00Z'::timestamptz),
  ('b1000000-0000-0000-0000-000000000002'::uuid,
   'Employee Onboarding Portal',
   'Self-service portal for new joiners to complete onboarding steps, upload docs, and track progress.',
   'Internal Tools', 'product', 'large', 'medium', 'in_progress', 'medium',
   'a1000000-0000-0000-0000-000000000004'::uuid,
   'a1000000-0000-0000-0000-000000000002'::uuid,
   'a1000000-0000-0000-0000-000000000005'::uuid,
   80::double precision, 25::double precision, 0, '2026-03-28T00:00:00Z'::timestamptz, '2026-04-15T00:00:00Z'::timestamptz, null::timestamptz),
  ('b1000000-0000-0000-0000-000000000003'::uuid,
   'Slack Standup Bot',
   'Automated daily standup collection via Slack with summary posted to a channel.',
   'Automation', 'poc', 'small', 'low', 'approved', 'low',
   'a1000000-0000-0000-0000-000000000003'::uuid,
   'a1000000-0000-0000-0000-000000000002'::uuid,
   null::uuid, 16::double precision, null::double precision, 0, '2026-04-05T00:00:00Z'::timestamptz, '2026-04-10T00:00:00Z'::timestamptz, null::timestamptz),
  ('b1000000-0000-0000-0000-000000000004'::uuid,
   'Internal Knowledge Base Search',
   'Semantic search across company docs, wikis, and Confluence using embeddings.',
   'AI/ML', 'product', 'micro', 'low', 'pending', 'high',
   'a1000000-0000-0000-0000-000000000004'::uuid,
   null::uuid, null::uuid, null::double precision, null::double precision, 0, null::timestamptz, null::timestamptz, null::timestamptz),
  ('b1000000-0000-0000-0000-000000000005'::uuid,
   'Meeting Room Booking Dashboard',
   'Real-time dashboard showing meeting room availability integrated with Google Calendar.',
   'Internal Tools', 'poc', 'micro', 'low', 'pending', 'medium',
   'a1000000-0000-0000-0000-000000000003'::uuid,
   null::uuid, null::uuid, null::double precision, null::double precision, 0, null::timestamptz, null::timestamptz, null::timestamptz)
) AS v(id, title, description, category, project_type, size, complexity, status, priority, submitted_by, approved_by, project_owner, estimated_hours, actual_hours, points_reward, bid_cutoff_date, expected_delivery_date, completed_at)
WHERE NOT EXISTS (SELECT 1 FROM ideas LIMIT 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bids (id, idea_id, user_id, bid_type, lead_user_id, proposed_hours, approach_note, committed_date, status)
SELECT * FROM (VALUES
  ('c1000000-0000-0000-0000-000000000001'::uuid, 'b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 'solo', null::uuid, 35::double precision, 'Will use Claude API with GitHub webhooks for PR events.', '2026-04-01T00:00:00Z'::timestamptz, 'assigned'),
  ('c1000000-0000-0000-0000-000000000002'::uuid, 'b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000004'::uuid, 'team', 'a1000000-0000-0000-0000-000000000004'::uuid, 70::double precision, 'React frontend + Node backend. Sara leads UI, John on APIs.', '2026-04-15T00:00:00Z'::timestamptz, 'assigned'),
  ('c1000000-0000-0000-0000-000000000003'::uuid, 'b1000000-0000-0000-0000-000000000003'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 'solo', null::uuid, 12::double precision, 'Slack Bolt framework + cron job for daily triggers.', '2026-04-09T00:00:00Z'::timestamptz, 'pending')
) AS v(id, idea_id, user_id, bid_type, lead_user_id, proposed_hours, approach_note, committed_date, status)
WHERE NOT EXISTS (SELECT 1 FROM bids LIMIT 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO team_members (bid_id, user_id, confirmed)
SELECT * FROM (VALUES
  ('c1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000004'::uuid, true),
  ('c1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, true)
) AS v(bid_id, user_id, confirmed)
WHERE NOT EXISTS (SELECT 1 FROM team_members LIMIT 1);

INSERT INTO idea_members (idea_id, user_id, role)
SELECT * FROM (VALUES
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 'owner'),
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000002'::uuid, 'project_owner'),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000004'::uuid, 'owner'),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 'contributor'),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000005'::uuid, 'project_owner'),
  ('b1000000-0000-0000-0000-000000000003'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 'owner')
) AS v(idea_id, user_id, role)
WHERE NOT EXISTS (SELECT 1 FROM idea_members LIMIT 1);

INSERT INTO time_logs (idea_id, user_id, hours, description, logged_date)
SELECT * FROM (VALUES
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 8::double precision, 'Set up GitHub webhook + Claude API integration', '2026-03-26'::date),
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 10::double precision, 'Built PR comment parser and response formatter', '2026-03-27'::date),
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 9::double precision, 'Testing and edge cases', '2026-03-28'::date),
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 8::double precision, 'Final polish and demo prep', '2026-03-29'::date),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000004'::uuid, 6::double precision, 'Wireframes and component structure', '2026-03-30'::date),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 5::double precision, 'Backend API scaffolding', '2026-03-30'::date),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000004'::uuid, 7::double precision, 'Onboarding form UI', '2026-03-31'::date),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 7::double precision, 'Document upload API + storage', '2026-03-31'::date)
) AS v(idea_id, user_id, hours, description, logged_date)
WHERE NOT EXISTS (SELECT 1 FROM time_logs LIMIT 1);

INSERT INTO comments (idea_id, user_id, content)
SELECT * FROM (VALUES
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000002'::uuid, 'Great progress! Can we add multi-language support?'),
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 'Sure, will add language detection in next iteration.'),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000005'::uuid, 'Please make sure the doc upload supports PDF and images.'),
  ('b1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000004'::uuid, 'Already handled — using Supabase storage with type validation.'),
  ('b1000000-0000-0000-0000-000000000003'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid, 'Planning to use Slack Bolt — any preference on the summary format?')
) AS v(idea_id, user_id, content)
WHERE NOT EXISTS (SELECT 1 FROM comments LIMIT 1);

INSERT INTO feedbacks (idea_id, user_id, rating, comment)
SELECT * FROM (VALUES
  ('b1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000002'::uuid, 'excellent', 'Fantastic demo! The bot caught real issues in test PRs. Early delivery too.')
) AS v(idea_id, user_id, rating, comment)
WHERE NOT EXISTS (SELECT 1 FROM feedbacks LIMIT 1);

UPDATE users SET total_points = 112 WHERE id = 'a1000000-0000-0000-0000-000000000003';
