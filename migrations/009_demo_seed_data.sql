-- ============================================================================
-- DEMO SEED DATA for BuildBoard Hackathon
-- ============================================================================
-- This migration adds comprehensive demo data for showcasing BuildBoard.
--
-- IMPORTANT: This file uses the demo users from migration 002_seed_data.sql.
-- If you have REAL users from Google Auth, update the user UUID variables below.
--
-- Run: SELECT id, email, full_name, role FROM users; to get real IDs
--
-- User mapping (from 002_seed_data):
--   USER_ADMIN    = a1000000-0000-0000-0000-000000000001  (Abrar Admin)
--   USER_MANAGER  = a1000000-0000-0000-0000-000000000002  (Maya Manager)
--   USER_DEV1     = a1000000-0000-0000-0000-000000000003  (John Developer)
--   USER_DESIGN   = a1000000-0000-0000-0000-000000000004  (Sara Builder)
--   USER_HR       = a1000000-0000-0000-0000-000000000005  (Helen HR)
-- ============================================================================

DO $$
DECLARE
    -- ========== USER IDS (replace these with real user UUIDs) ==========
    u_admin   UUID := 'a1000000-0000-0000-0000-000000000001';
    u_manager UUID := 'a1000000-0000-0000-0000-000000000002';
    u_dev1    UUID := 'a1000000-0000-0000-0000-000000000003';
    u_design  UUID := 'a1000000-0000-0000-0000-000000000004';
    u_hr      UUID := 'a1000000-0000-0000-0000-000000000005';

    -- ========== IDEA IDS ==========
    -- Completed ideas
    idea_ai_onboarding   UUID := 'b2000000-0000-0000-0000-000000000001';
    idea_invoice_proc    UUID := 'b2000000-0000-0000-0000-000000000002';
    -- InProgress ideas
    idea_perf_monitor    UUID := 'b2000000-0000-0000-0000-000000000003';
    idea_wellness_dash   UUID := 'b2000000-0000-0000-0000-000000000004';
    -- BiddingOpen
    idea_inventory       UUID := 'b2000000-0000-0000-0000-000000000005';
    -- PendingApproval
    idea_meeting_sched   UUID := 'b2000000-0000-0000-0000-000000000006';

    -- ========== BID IDS ==========
    bid_1 UUID := 'c2000000-0000-0000-0000-000000000001';
    bid_2 UUID := 'c2000000-0000-0000-0000-000000000002';
    bid_3 UUID := 'c2000000-0000-0000-0000-000000000003';
    bid_4 UUID := 'c2000000-0000-0000-0000-000000000004';
    bid_5 UUID := 'c2000000-0000-0000-0000-000000000005';
    bid_6 UUID := 'c2000000-0000-0000-0000-000000000006';
    bid_7 UUID := 'c2000000-0000-0000-0000-000000000007';
    bid_8 UUID := 'c2000000-0000-0000-0000-000000000008';
    bid_9 UUID := 'c2000000-0000-0000-0000-000000000009';

BEGIN

-- ============================================================================
-- 1. IDEAS (6 new ideas across statuses)
-- ============================================================================

INSERT INTO ideas (id, title, description, category, project_type, size, complexity, status, priority, submitted_by, approved_by, project_owner, estimated_hours, actual_hours, points_reward, bid_cutoff_date, expected_delivery_date, completed_at)
VALUES
  -- COMPLETED: AI-Powered Customer Onboarding
  (idea_ai_onboarding,
   'AI-Powered Customer Onboarding',
   'An intelligent onboarding flow that uses NLP to parse uploaded documents, auto-fill customer profiles, and generate personalized welcome sequences. Reduces manual data entry by 80% and cuts onboarding time from 3 days to 4 hours.',
   'AI/ML', 'product', 'large', 'high', 'completed', 'high',
   u_dev1, u_manager, u_manager,
   60, 52, 250,
   '2026-02-15T00:00:00Z', '2026-03-10T00:00:00Z', '2026-03-08T14:30:00Z'),

  -- COMPLETED: Automated Invoice Processing
  (idea_invoice_proc,
   'Automated Invoice Processing',
   'OCR + rules engine that extracts line items from vendor invoices, matches them to POs, flags discrepancies, and routes for approval. Integrates with the existing ERP via REST API.',
   'Automation', 'poc', 'medium', 'medium', 'completed', 'high',
   u_design, u_manager, u_hr,
   30, 28, 180,
   '2026-02-20T00:00:00Z', '2026-03-15T00:00:00Z', '2026-03-12T10:00:00Z'),

  -- IN_PROGRESS: Mobile App Performance Monitor
  (idea_perf_monitor,
   'Mobile App Performance Monitor',
   'Real-time dashboard that tracks mobile app crash rates, ANR events, slow renders, and network latency. Aggregates data from Firebase Crashlytics and custom telemetry, with Slack alerts for regressions.',
   'DevOps', 'product', 'large', 'high', 'in_progress', 'high',
   u_dev1, u_manager, u_design,
   80, 32, 0,
   '2026-03-01T00:00:00Z', '2026-04-20T00:00:00Z', NULL),

  -- IN_PROGRESS: Employee Wellness Dashboard
  (idea_wellness_dash,
   'Employee Wellness Dashboard',
   'Anonymous pulse survey system with a wellness score dashboard. Tracks team morale trends over time, surfaces burnout indicators, and suggests team activities. Fully GDPR-compliant with anonymized aggregation.',
   'Internal Tools', 'product', 'medium', 'medium', 'in_progress', 'medium',
   u_hr, u_manager, u_dev1,
   50, 18, 0,
   '2026-03-05T00:00:00Z', '2026-04-25T00:00:00Z', NULL),

  -- APPROVED (BiddingOpen): Real-time Inventory Tracker
  (idea_inventory,
   'Real-time Inventory Tracker',
   'WebSocket-powered inventory management that syncs stock levels across warehouses in real time. Includes low-stock alerts, demand forecasting using historical data, and barcode scanner integration for mobile.',
   'Operations', 'product', 'large', 'innovative', 'approved', 'high',
   u_design, u_manager, NULL,
   100, NULL, 0,
   '2026-04-10T00:00:00Z', '2026-05-15T00:00:00Z', NULL),

  -- PENDING: Smart Meeting Scheduler
  (idea_meeting_sched,
   'Smart Meeting Scheduler',
   'AI assistant that finds optimal meeting times by analyzing calendar availability, time zones, meeting fatigue scores, and focus time preferences. Auto-suggests agenda items based on recent Slack threads and Jira tickets.',
   'Productivity', 'poc', 'small', 'high', 'pending', 'medium',
   u_dev1, NULL, NULL,
   20, NULL, 0,
   NULL, NULL, NULL)

ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 2. BIDS (2-3 per BiddingOpen/InProgress idea)
-- ============================================================================

INSERT INTO bids (id, idea_id, user_id, bid_type, lead_user_id, proposed_hours, approach_note, committed_date, status)
VALUES
  -- Bids for AI-Powered Customer Onboarding (completed, winning bid assigned)
  (bid_1, idea_ai_onboarding, u_dev1, 'team', u_dev1, 55,
   'Will use spaCy for NLP document parsing, React for the flow UI, and SendGrid for welcome sequences. John leads backend, Sara on UI.',
   '2026-03-10T00:00:00Z', 'assigned'),
  (bid_2, idea_ai_onboarding, u_design, 'solo', NULL, 70,
   'Would build custom extraction pipeline with Tesseract + GPT-4. More accurate but higher time estimate.',
   '2026-03-10T00:00:00Z', 'rejected'),

  -- Bids for Automated Invoice Processing (completed, winning bid assigned)
  (bid_3, idea_invoice_proc, u_design, 'solo', NULL, 30,
   'Using Google Vision API for OCR, custom rules engine in Python, FastAPI endpoints for ERP integration.',
   '2026-03-15T00:00:00Z', 'assigned'),

  -- Bids for Mobile App Performance Monitor (in_progress, winning bid assigned)
  (bid_4, idea_perf_monitor, u_dev1, 'team', u_dev1, 75,
   'Firebase SDK integration + custom Grafana dashboards. Will build Slack bot for alerting. John on data pipeline, Sara on dashboard UI.',
   '2026-04-20T00:00:00Z', 'assigned'),
  (bid_5, idea_perf_monitor, u_design, 'solo', NULL, 90,
   'Full custom solution with Prometheus + custom React dashboard. Higher fidelity but more time.',
   '2026-04-20T00:00:00Z', 'rejected'),

  -- Bids for Employee Wellness Dashboard (in_progress, winning bid assigned)
  (bid_6, idea_wellness_dash, u_dev1, 'solo', NULL, 45,
   'React + Chart.js for visualization, Node.js backend with anonymization layer. Typeform-style surveys.',
   '2026-04-25T00:00:00Z', 'assigned'),

  -- Bids for Real-time Inventory Tracker (bidding open, all pending)
  (bid_7, idea_inventory, u_dev1, 'team', u_dev1, 90,
   'Socket.io for real-time sync, PostgreSQL with row-level change capture, React Native scanner app. Team of 2.',
   '2026-05-15T00:00:00Z', 'pending'),
  (bid_8, idea_inventory, u_design, 'solo', NULL, 110,
   'Full-stack Next.js approach with Supabase Realtime. Would include PWA mobile scanner.',
   '2026-05-15T00:00:00Z', 'pending'),
  (bid_9, idea_inventory, u_hr, 'solo', NULL, 95,
   'Go microservice with WebSocket pub/sub, Vue.js frontend. Lean and performant.',
   '2026-05-15T00:00:00Z', 'pending')

ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 3. TEAM MEMBERS (for team bids)
-- ============================================================================

INSERT INTO team_members (bid_id, user_id, confirmed)
VALUES
  (bid_1, u_dev1, true),
  (bid_1, u_design, true),
  (bid_4, u_dev1, true),
  (bid_4, u_design, true),
  (bid_7, u_dev1, true),
  (bid_7, u_design, false)
ON CONFLICT (bid_id, user_id) DO NOTHING;


-- ============================================================================
-- 4. IDEA MEMBERS
-- ============================================================================

INSERT INTO idea_members (idea_id, user_id, role)
VALUES
  -- AI-Powered Customer Onboarding
  (idea_ai_onboarding, u_dev1, 'owner'),
  (idea_ai_onboarding, u_design, 'contributor'),
  (idea_ai_onboarding, u_manager, 'project_owner'),
  -- Automated Invoice Processing
  (idea_invoice_proc, u_design, 'owner'),
  (idea_invoice_proc, u_hr, 'project_owner'),
  -- Mobile App Performance Monitor
  (idea_perf_monitor, u_dev1, 'owner'),
  (idea_perf_monitor, u_design, 'contributor'),
  (idea_perf_monitor, u_manager, 'reviewer'),
  -- Employee Wellness Dashboard
  (idea_wellness_dash, u_hr, 'owner'),
  (idea_wellness_dash, u_dev1, 'contributor'),
  (idea_wellness_dash, u_manager, 'reviewer'),
  -- Inventory Tracker
  (idea_inventory, u_design, 'owner'),
  -- Meeting Scheduler
  (idea_meeting_sched, u_dev1, 'owner')
ON CONFLICT (idea_id, user_id) DO NOTHING;


-- ============================================================================
-- 5. PROJECT TASKS (for InProgress ideas - kanban cards)
-- ============================================================================

-- Mobile App Performance Monitor tasks
INSERT INTO project_tasks (idea_id, title, description, status, priority, assigned_to, created_by, due_date, "order")
VALUES
  (idea_perf_monitor, 'Set up Firebase Crashlytics SDK integration',
   'Integrate Firebase Crashlytics into the Android and iOS apps. Configure symbolication for native crashes.',
   'done', 'high', u_dev1, u_dev1, '2026-04-05T00:00:00Z', 1),
  (idea_perf_monitor, 'Build data ingestion pipeline',
   'Create ETL pipeline to pull crash/ANR data from Firebase into our PostgreSQL analytics DB every 5 minutes.',
   'done', 'high', u_dev1, u_dev1, '2026-04-08T00:00:00Z', 2),
  (idea_perf_monitor, 'Design and build main dashboard UI',
   'Grafana-style dashboard with crash rate trends, top crashers table, device breakdown, and network latency charts.',
   'in_progress', 'high', u_design, u_dev1, '2026-04-12T00:00:00Z', 3),
  (idea_perf_monitor, 'Implement Slack alerting bot',
   'Build Slack bot that sends alerts to #mobile-alerts when crash rate exceeds threshold. Include regression detection.',
   'todo', 'medium', u_dev1, u_dev1, '2026-04-15T00:00:00Z', 4),
  (idea_perf_monitor, 'Add network latency monitoring',
   'Instrument API calls to track P50/P95/P99 latencies. Display in dashboard with threshold highlighting.',
   'todo', 'medium', u_dev1, u_dev1, '2026-04-18T00:00:00Z', 5);

-- Employee Wellness Dashboard tasks
INSERT INTO project_tasks (idea_id, title, description, status, priority, assigned_to, created_by, due_date, "order")
VALUES
  (idea_wellness_dash, 'Design anonymous survey schema',
   'Create survey question bank and database schema that ensures full anonymity. No PII in responses table.',
   'done', 'high', u_dev1, u_hr, '2026-04-02T00:00:00Z', 1),
  (idea_wellness_dash, 'Build survey submission flow',
   'Typeform-style survey UI with progress indicator, skip logic, and anonymous submission endpoint.',
   'in_progress', 'high', u_dev1, u_hr, '2026-04-08T00:00:00Z', 2),
  (idea_wellness_dash, 'Create wellness score algorithm',
   'Weighted scoring model that combines survey responses into a 0-100 wellness score per team. Include trend calculation.',
   'in_review', 'high', u_dev1, u_hr, '2026-04-10T00:00:00Z', 3),
  (idea_wellness_dash, 'Build team dashboard with charts',
   'Chart.js visualizations showing wellness trends, participation rates, and category breakdowns per department.',
   'todo', 'medium', u_dev1, u_hr, '2026-04-15T00:00:00Z', 4);


-- ============================================================================
-- 6. PROJECT MESSAGES (5-8 per project in General and Requirements channels)
-- ============================================================================

-- Mobile App Performance Monitor messages
INSERT INTO project_messages (idea_id, user_id, channel, content, message_type, created_at)
VALUES
  (idea_perf_monitor, u_dev1, 'general', 'Kicked off the project! Firebase SDK integration is the first priority.', 'message', '2026-03-20T09:00:00Z'),
  (idea_perf_monitor, u_design, 'general', 'I have some Figma mockups ready for the dashboard layout. Will share the link shortly.', 'message', '2026-03-20T09:15:00Z'),
  (idea_perf_monitor, u_manager, 'general', 'Looks great. Make sure we include ANR tracking alongside crash rates. Product wants both.', 'message', '2026-03-20T10:30:00Z'),
  (idea_perf_monitor, u_dev1, 'requirements', 'Confirmed: Firebase free tier supports up to 500M events/month. Should be plenty for our scale.', 'requirement', '2026-03-21T11:00:00Z'),
  (idea_perf_monitor, u_design, 'design', 'Dashboard mockups are in Figma. Going with a dark theme to match the DevOps tooling aesthetic.', 'design_link', '2026-03-22T14:00:00Z'),
  (idea_perf_monitor, u_dev1, 'blockers', 'Need Firebase service account credentials from DevOps team. Raised a ticket.', 'blocker', '2026-03-23T08:00:00Z'),
  (idea_perf_monitor, u_dev1, 'general', 'Got the credentials. Data pipeline is now pulling live crash data. Dashboard next!', 'update', '2026-03-25T16:00:00Z'),
  (idea_perf_monitor, u_manager, 'general', 'Can we add a weekly email digest? Low priority but would be nice for stakeholders.', 'message', '2026-03-27T09:00:00Z');

-- Employee Wellness Dashboard messages
INSERT INTO project_messages (idea_id, user_id, channel, content, message_type, created_at)
VALUES
  (idea_wellness_dash, u_hr, 'general', 'Starting the wellness dashboard project. Privacy is the top concern - everything must be fully anonymous.', 'message', '2026-03-18T09:00:00Z'),
  (idea_wellness_dash, u_dev1, 'general', 'Agreed. I am designing the schema so individual responses cannot be traced back. Using k-anonymity threshold of 5.', 'message', '2026-03-18T09:30:00Z'),
  (idea_wellness_dash, u_hr, 'requirements', 'HR needs: 1) Weekly pulse surveys (5 questions max), 2) Department-level dashboards, 3) Burnout risk indicators, 4) Activity suggestions.', 'requirement', '2026-03-18T10:00:00Z'),
  (idea_wellness_dash, u_dev1, 'requirements', 'Technical requirement: must support at least 500 concurrent survey submissions during peak Monday morning window.', 'requirement', '2026-03-19T11:00:00Z'),
  (idea_wellness_dash, u_manager, 'general', 'Legal has signed off on the anonymization approach. Green light to proceed.', 'message', '2026-03-20T14:00:00Z'),
  (idea_wellness_dash, u_dev1, 'general', 'Survey schema is done. Moving on to the submission flow. Using React Hook Form for the frontend.', 'update', '2026-03-25T16:00:00Z'),
  (idea_wellness_dash, u_hr, 'general', 'Can we add a "How are you feeling today?" emoji quick-poll on the landing page? Super low friction.', 'message', '2026-03-28T09:00:00Z');


-- ============================================================================
-- 7. TIME LOGS (for InProgress and Completed ideas)
-- ============================================================================

-- AI-Powered Customer Onboarding (completed)
INSERT INTO time_logs (idea_id, user_id, hours, description, logged_date)
VALUES
  (idea_ai_onboarding, u_dev1, 8, 'NLP pipeline setup with spaCy model training', '2026-02-20'),
  (idea_ai_onboarding, u_dev1, 10, 'Document parsing module for ID cards and utility bills', '2026-02-22'),
  (idea_ai_onboarding, u_design, 6, 'Onboarding wizard UI wireframes and component library', '2026-02-23'),
  (idea_ai_onboarding, u_dev1, 7, 'Auto-fill engine and profile generation logic', '2026-02-25'),
  (idea_ai_onboarding, u_design, 8, 'Built onboarding wizard frontend with step navigation', '2026-02-27'),
  (idea_ai_onboarding, u_dev1, 6, 'SendGrid integration for welcome email sequences', '2026-03-01'),
  (idea_ai_onboarding, u_dev1, 4, 'End-to-end testing and bug fixes', '2026-03-05'),
  (idea_ai_onboarding, u_design, 3, 'Final UI polish and responsive design fixes', '2026-03-07');

-- Automated Invoice Processing (completed)
INSERT INTO time_logs (idea_id, user_id, hours, description, logged_date)
VALUES
  (idea_invoice_proc, u_design, 8, 'Google Vision API integration and OCR pipeline', '2026-02-25'),
  (idea_invoice_proc, u_design, 6, 'Rules engine for line item extraction and PO matching', '2026-02-28'),
  (idea_invoice_proc, u_design, 7, 'Approval workflow with email notifications', '2026-03-03'),
  (idea_invoice_proc, u_design, 4, 'ERP REST API integration and field mapping', '2026-03-06'),
  (idea_invoice_proc, u_design, 3, 'Testing with real invoice samples and edge cases', '2026-03-10');

-- Mobile App Performance Monitor (in_progress)
INSERT INTO time_logs (idea_id, user_id, hours, description, logged_date)
VALUES
  (idea_perf_monitor, u_dev1, 6, 'Firebase Crashlytics SDK setup for Android', '2026-03-20'),
  (idea_perf_monitor, u_dev1, 5, 'Firebase Crashlytics SDK setup for iOS', '2026-03-21'),
  (idea_perf_monitor, u_dev1, 8, 'Data ingestion pipeline from Firebase to PostgreSQL', '2026-03-24'),
  (idea_perf_monitor, u_design, 4, 'Dashboard layout design and component prototyping', '2026-03-25'),
  (idea_perf_monitor, u_dev1, 5, 'Crash rate aggregation queries and API endpoints', '2026-03-27'),
  (idea_perf_monitor, u_design, 4, 'Started building dashboard chart components', '2026-03-30');

-- Employee Wellness Dashboard (in_progress)
INSERT INTO time_logs (idea_id, user_id, hours, description, logged_date)
VALUES
  (idea_wellness_dash, u_dev1, 5, 'Designed anonymous survey database schema', '2026-03-19'),
  (idea_wellness_dash, u_dev1, 6, 'Built survey API with anonymization layer', '2026-03-22'),
  (idea_wellness_dash, u_dev1, 4, 'Survey submission frontend with React Hook Form', '2026-03-26'),
  (idea_wellness_dash, u_dev1, 3, 'Wellness score algorithm prototype', '2026-03-30');


-- ============================================================================
-- 8. COMMENTS (2-3 per idea)
-- ============================================================================

INSERT INTO comments (idea_id, user_id, content)
VALUES
  -- AI-Powered Customer Onboarding
  (idea_ai_onboarding, u_manager, 'This could save the onboarding team 20+ hours per week. Impressive scope.'),
  (idea_ai_onboarding, u_hr, 'Can we extend this to internal employee onboarding as well?'),
  (idea_ai_onboarding, u_dev1, 'Absolutely, the NLP pipeline is generic enough. Would need a new template set.'),

  -- Automated Invoice Processing
  (idea_invoice_proc, u_manager, 'Finance team has been asking for this. Great to see it delivered early.'),
  (idea_invoice_proc, u_design, 'OCR accuracy is at 96% on the test invoice set. Working on improving edge cases.'),
  (idea_invoice_proc, u_hr, 'The approval routing is exactly what we needed. Clean implementation.'),

  -- Mobile App Performance Monitor
  (idea_perf_monitor, u_manager, 'This will be critical for the upcoming v3.0 release. Prioritize crash rate dashboards.'),
  (idea_perf_monitor, u_design, 'Dashboard mockups are ready for review in Figma. Link in the project workspace.'),

  -- Employee Wellness Dashboard
  (idea_wellness_dash, u_manager, 'Make sure we get Legal sign-off on the anonymization before any pilot.'),
  (idea_wellness_dash, u_hr, 'We already have 3 departments interested in piloting this.'),
  (idea_wellness_dash, u_dev1, 'Anonymization uses k-anonymity with threshold of 5. No individual can be identified.'),

  -- Real-time Inventory Tracker
  (idea_inventory, u_manager, 'Operations team is very excited about this. Real-time sync is a game changer.'),
  (idea_inventory, u_dev1, 'I would recommend Socket.io over raw WebSockets for the fallback support.'),

  -- Smart Meeting Scheduler
  (idea_meeting_sched, u_design, 'I would love to work on the UI for this one. Calendar interfaces are fun.'),
  (idea_meeting_sched, u_manager, 'Interesting idea. Let us discuss feasibility in the next sprint planning.');


-- ============================================================================
-- 9. FEEDBACKS (for Completed ideas)
-- ============================================================================

INSERT INTO feedbacks (idea_id, user_id, rating, comment)
VALUES
  -- AI-Powered Customer Onboarding
  (idea_ai_onboarding, u_manager, 'excellent', 'Outstanding work. The NLP accuracy exceeded expectations and the onboarding team is thrilled. Delivered 2 days early.'),
  (idea_ai_onboarding, u_hr, 'good', 'Very useful tool. Would love to see it extended to internal onboarding flows as well.'),

  -- Automated Invoice Processing
  (idea_invoice_proc, u_manager, 'excellent', 'Finance team reported 75% reduction in manual invoice processing time. Clean API integration with ERP.'),
  (idea_invoice_proc, u_admin, 'good', 'Solid POC. The OCR accuracy could be improved for handwritten invoices but overall very good.');


-- ============================================================================
-- 10. PROJECT REQUIREMENTS (3-4 per InProgress project)
-- ============================================================================

-- Mobile App Performance Monitor
INSERT INTO project_requirements (idea_id, title, description, status, priority, created_by, assigned_to)
VALUES
  (idea_perf_monitor, 'Crash rate trend visualization',
   'Line chart showing crash-free rate over last 7/30/90 days with drill-down by app version.',
   'in_progress', 'must_have', u_manager, u_design),
  (idea_perf_monitor, 'ANR detection and alerting',
   'Detect Application Not Responding events on Android, aggregate by screen and device model.',
   'open', 'must_have', u_manager, u_dev1),
  (idea_perf_monitor, 'Slack integration for alerts',
   'Post alerts to configurable Slack channel when crash rate exceeds defined threshold.',
   'open', 'should_have', u_dev1, u_dev1),
  (idea_perf_monitor, 'Device and OS breakdown',
   'Pie chart showing crash distribution by device manufacturer and OS version.',
   'done', 'nice_to_have', u_design, u_design);

-- Employee Wellness Dashboard
INSERT INTO project_requirements (idea_id, title, description, status, priority, created_by, assigned_to)
VALUES
  (idea_wellness_dash, 'Anonymous survey submission',
   'Surveys must be fully anonymous. No PII stored alongside responses. k-anonymity threshold of 5.',
   'done', 'must_have', u_hr, u_dev1),
  (idea_wellness_dash, 'Department-level wellness score',
   'Aggregate wellness score (0-100) per department with weekly trend line.',
   'in_progress', 'must_have', u_hr, u_dev1),
  (idea_wellness_dash, 'Burnout risk indicators',
   'Flag teams where wellness score drops below 40 or declines more than 15 points in 2 weeks.',
   'open', 'should_have', u_hr, u_dev1),
  (idea_wellness_dash, 'Activity suggestions engine',
   'Suggest team activities based on low-scoring categories (e.g., social events if connection score is low).',
   'open', 'nice_to_have', u_hr, u_dev1);


-- ============================================================================
-- 11. PROJECT LINKS (Figma, GitHub, Docs per project)
-- ============================================================================

INSERT INTO project_links (idea_id, title, url, link_type, added_by)
VALUES
  -- Mobile App Performance Monitor
  (idea_perf_monitor, 'Dashboard Figma Mockups', 'https://figma.com/file/perf-monitor-dashboard', 'figma', u_design),
  (idea_perf_monitor, 'GitHub Repository', 'https://github.com/buildboard/perf-monitor', 'github', u_dev1),
  (idea_perf_monitor, 'Technical Design Doc', 'https://docs.google.com/document/d/perf-monitor-tdd', 'docs', u_dev1),
  (idea_perf_monitor, 'Firebase Console', 'https://console.firebase.google.com/project/buildboard-perf', 'other', u_dev1),

  -- Employee Wellness Dashboard
  (idea_wellness_dash, 'Survey UI Figma', 'https://figma.com/file/wellness-survey-ui', 'figma', u_design),
  (idea_wellness_dash, 'GitHub Repository', 'https://github.com/buildboard/wellness-dashboard', 'github', u_dev1),
  (idea_wellness_dash, 'Privacy Impact Assessment', 'https://docs.google.com/document/d/wellness-pia', 'docs', u_hr),

  -- AI-Powered Customer Onboarding (completed, still has links)
  (idea_ai_onboarding, 'Onboarding Flow Figma', 'https://figma.com/file/ai-onboarding-flow', 'figma', u_design),
  (idea_ai_onboarding, 'GitHub Repository', 'https://github.com/buildboard/ai-onboarding', 'github', u_dev1),
  (idea_ai_onboarding, 'Demo Video', 'https://loom.com/share/ai-onboarding-demo', 'other', u_dev1);


-- ============================================================================
-- 12. POINT BATCHES (earned points for demo users)
-- ============================================================================

INSERT INTO point_batches (user_id, points, remaining, source, idea_id, earned_at, expires_at)
VALUES
  -- John Developer earned points for AI Onboarding and prior work
  (u_dev1, 250, 250, 'Completed: AI-Powered Customer Onboarding', idea_ai_onboarding, '2026-03-08T14:30:00Z', '2027-03-08T14:30:00Z'),
  (u_dev1, 112, 62, 'Completed: AI-Powered Code Review Bot', NULL, '2026-03-30T00:00:00Z', '2027-03-30T00:00:00Z'),

  -- Sara Builder earned points for Invoice Processing
  (u_design, 180, 180, 'Completed: Automated Invoice Processing', idea_invoice_proc, '2026-03-12T10:00:00Z', '2027-03-12T10:00:00Z'),
  (u_design, 75, 75, 'Early delivery bonus', idea_invoice_proc, '2026-03-12T10:00:00Z', '2027-03-12T10:00:00Z');


-- ============================================================================
-- 13. UPDATE USER POINTS
-- ============================================================================

UPDATE users SET total_points = 362, redeemable_points = 312 WHERE id = u_dev1;
UPDATE users SET total_points = 255, redeemable_points = 255 WHERE id = u_design;


-- ============================================================================
-- 14. MILESTONES (achievements for demo users)
-- ============================================================================

INSERT INTO milestones (user_id, title, points_required, reward_description, is_claimed)
VALUES
  (u_dev1, 'First Project Completed', 100, 'Complete your first innovation project', true),
  (u_dev1, 'Innovation Streak', 300, 'Earn 300+ points from completed projects', true),
  (u_design, 'First Project Completed', 100, 'Complete your first innovation project', true),
  (u_design, 'Solo Champion', 200, 'Successfully deliver a solo project', false);


END $$;
