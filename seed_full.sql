-- ============================================================
-- BuildBoard — Full Realistic Seed Data
-- Run in Supabase SQL Editor
-- ⚠️ This DELETES all existing data except admin users
-- ============================================================

-- Step 1: Clear everything (order matters for FK constraints)
TRUNCATE project_requirements, project_links, project_messages, project_tasks,
         feedbacks, comments, time_logs, team_members, idea_members,
         extension_requests, bids, redemptions, savings_goals, point_batches,
         milestones, ideas CASCADE;

-- Delete non-admin users (keep your real admin accounts)
DELETE FROM users WHERE role != 'Admin';

-- Step 2: Create realistic users
INSERT INTO users (id, email, full_name, avatar_url, role, department, total_points, redeemable_points, google_id) VALUES
  ('u0000001-0000-0000-0000-000000000001', 'sarah.chen@company.com', 'Sarah Chen', null, 'Manager', 'Engineering', 0, 0, 'gid_sarah'),
  ('u0000001-0000-0000-0000-000000000002', 'marcus.johnson@company.com', 'Marcus Johnson', null, 'Employee', 'Engineering', 875, 875, 'gid_marcus'),
  ('u0000001-0000-0000-0000-000000000003', 'priya.sharma@company.com', 'Priya Sharma', null, 'Employee', 'Design', 1240, 1240, 'gid_priya'),
  ('u0000001-0000-0000-0000-000000000004', 'james.wilson@company.com', 'James Wilson', null, 'Employee', 'Engineering', 620, 620, 'gid_james'),
  ('u0000001-0000-0000-0000-000000000005', 'aisha.khan@company.com', 'Aisha Khan', null, 'Employee', 'Product', 2150, 1900, 'gid_aisha'),
  ('u0000001-0000-0000-0000-000000000006', 'david.lee@company.com', 'David Lee', null, 'Employee', 'Engineering', 430, 430, 'gid_david'),
  ('u0000001-0000-0000-0000-000000000007', 'emma.taylor@company.com', 'Emma Taylor', null, 'HR', 'Human Resources', 0, 0, 'gid_emma'),
  ('u0000001-0000-0000-0000-000000000008', 'raj.patel@company.com', 'Raj Patel', null, 'Employee', 'Operations', 310, 310, 'gid_raj'),
  ('u0000001-0000-0000-0000-000000000009', 'lisa.wang@company.com', 'Lisa Wang', null, 'Employee', 'Engineering', 1580, 1330, 'gid_lisa'),
  ('u0000001-0000-0000-0000-000000000010', 'omar.hassan@company.com', 'Omar Hassan', null, 'Manager', 'Product', 0, 0, 'gid_omar');

-- Step 3: Ideas (various statuses for a realistic portal)

-- COMPLETED IDEAS (3)
INSERT INTO ideas (id, title, description, category, project_type, size, complexity, status, priority,
  submitted_by, approved_by, project_owner, project_owner_name, estimated_hours, actual_hours, min_hours, max_hours,
  points_reward, bid_cutoff_date, expected_delivery_date, completed_at, business_value, challenges)
VALUES
  ('i0000001-0000-0000-0000-000000000001',
   'AI-Powered Customer Support Chatbot',
   'Build an intelligent chatbot using Claude API that handles Tier 1 customer support queries, reducing response time from 4 hours to under 2 minutes. Integrates with Zendesk and Slack.',
   'Tech', 'FullProduct', 'Large', 'High', 'Completed', 'high',
   'u0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000001',
   'u0000001-0000-0000-0000-000000000003', 'Priya Sharma',
   120, 105, 80, 140, 237,
   '2026-02-15T00:00:00Z', '2026-03-15T00:00:00Z', '2026-03-12T00:00:00Z',
   'Customer satisfaction,Efficiency,Cost saving', 'Need Zendesk API access and Claude API key provisioning'),

  ('i0000001-0000-0000-0000-000000000002',
   'Automated Invoice Reconciliation Tool',
   'Python-based tool that reconciles invoices against purchase orders and flags discrepancies automatically. Saves finance team 20 hours per week of manual checking.',
   'Finance', 'POC', 'Medium', 'Medium', 'Completed', 'medium',
   'u0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000010',
   'u0000001-0000-0000-0000-000000000005', 'Aisha Khan',
   40, 38, 30, 50, 95,
   '2026-01-20T00:00:00Z', '2026-02-10T00:00:00Z', '2026-02-08T00:00:00Z',
   'Cost saving,Efficiency', 'Need access to accounting system API'),

  ('i0000001-0000-0000-0000-000000000003',
   'Employee Pulse Survey Dashboard',
   'Real-time dashboard that visualizes weekly pulse survey results with sentiment analysis. Department heads can track team morale trends over time.',
   'HR', 'POC', 'Small', 'Low', 'Completed', 'low',
   'u0000001-0000-0000-0000-000000000008', 'u0000001-0000-0000-0000-000000000001',
   'u0000001-0000-0000-0000-000000000007', 'Emma Taylor',
   16, 14, 12, 20, 60,
   '2026-01-10T00:00:00Z', '2026-01-25T00:00:00Z', '2026-01-22T00:00:00Z',
   'Efficiency,Customer satisfaction', null);

-- IN PROGRESS IDEAS (2)
INSERT INTO ideas (id, title, description, category, project_type, size, complexity, status, priority,
  submitted_by, approved_by, project_owner, project_owner_name, estimated_hours, min_hours, max_hours,
  actual_hours, bid_cutoff_date, expected_delivery_date, business_value, challenges)
VALUES
  ('i0000001-0000-0000-0000-000000000004',
   'Smart Meeting Room Booking System',
   'Intelligent room booking that considers team size, equipment needs, and historical preferences. Integrates with Google Calendar and shows real-time availability on office displays.',
   'Operations', 'FullProduct', 'Large', 'High', 'InProgress', 'high',
   'u0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000001',
   'u0000001-0000-0000-0000-000000000002', 'Marcus Johnson',
   140, 100, 160, 68,
   '2026-03-10T00:00:00Z', '2026-04-20T00:00:00Z',
   'Efficiency,Product enhancement', 'Google Calendar API rate limits may require caching strategy'),

  ('i0000001-0000-0000-0000-000000000005',
   'Internal Knowledge Base with Semantic Search',
   'Centralized knowledge base with AI-powered semantic search across Confluence, Notion, and Google Docs. Employees find answers in seconds instead of hours of searching.',
   'Tech', 'FullProduct', 'XL', 'Innovative', 'InProgress', 'high',
   'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000010',
   'u0000001-0000-0000-0000-000000000009', 'Lisa Wang',
   200, 160, 240, 42,
   '2026-03-20T00:00:00Z', '2026-05-30T00:00:00Z',
   'Efficiency,Product enhancement,Customer satisfaction', 'Embedding model selection and vector DB setup are unknowns');

-- BIDDING OPEN IDEAS (3)
INSERT INTO ideas (id, title, description, category, project_type, size, complexity, status, priority,
  submitted_by, approved_by, project_owner, project_owner_name, estimated_hours, min_hours, max_hours,
  bid_cutoff_date, expected_delivery_date, business_value, challenges)
VALUES
  ('i0000001-0000-0000-0000-000000000006',
   'Automated Code Quality Scanner',
   'CI/CD pipeline integration that automatically scans PRs for code quality, security vulnerabilities, and architectural violations. Generates reports and blocks merges if critical issues found.',
   'Tech', 'FullProduct', 'Large', 'High', 'BiddingOpen', 'high',
   'u0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000001',
   'u0000001-0000-0000-0000-000000000004', 'James Wilson',
   120, 80, 150,
   '2026-04-10T23:59:00Z', '2026-05-15T00:00:00Z',
   'Efficiency,Product enhancement', 'Need to evaluate SonarQube vs custom solution'),

  ('i0000001-0000-0000-0000-000000000007',
   'Client Onboarding Automation',
   'End-to-end client onboarding workflow that automates document collection, KYC verification, account setup, and welcome communications. Reduces onboarding from 5 days to same-day.',
   'Operations', 'FullProduct', 'Large', 'Medium', 'BiddingOpen', 'medium',
   'u0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000010',
   'u0000001-0000-0000-0000-000000000005', 'Aisha Khan',
   100, 80, 130,
   '2026-04-08T18:00:00Z', '2026-05-10T00:00:00Z',
   'Customer acquisition,Efficiency,Cost saving', 'KYC integration requires legal review'),

  ('i0000001-0000-0000-0000-000000000008',
   'Expense Report Smart Processor',
   'Mobile-first expense submission with receipt OCR, auto-categorization, policy violation detection, and one-click approval workflows.',
   'Finance', 'POC', 'Medium', 'Medium', 'BiddingOpen', 'medium',
   'u0000001-0000-0000-0000-000000000008', 'u0000001-0000-0000-0000-000000000001',
   'u0000001-0000-0000-0000-000000000008', 'Raj Patel',
   50, 35, 60,
   '2026-04-12T23:59:00Z', '2026-04-30T00:00:00Z',
   'Efficiency,Cost saving', 'OCR accuracy for handwritten receipts may be low');

-- PENDING APPROVAL IDEAS (3)
INSERT INTO ideas (id, title, description, category, project_type, size, complexity, status, priority,
  submitted_by, project_owner_name, business_value, challenges)
VALUES
  ('i0000001-0000-0000-0000-000000000009',
   'Real-Time Sales Pipeline Predictor',
   'ML model that predicts deal closure probability based on historical patterns, communication frequency, and deal stage duration. Surfaces at-risk deals to managers proactively.',
   'Tech', 'FullProduct', 'Micro', 'Low', 'PendingApproval', 'high',
   'u0000001-0000-0000-0000-000000000009', 'Lisa Wang',
   'Customer acquisition,Product enhancement', 'Need CRM data access and historical deal data'),

  ('i0000001-0000-0000-0000-000000000010',
   'Office Space Utilization Tracker',
   'IoT sensor integration to track desk and room utilization in real-time. Generates heatmaps and recommendations for space optimization.',
   'Operations', 'POC', 'Micro', 'Low', 'PendingApproval', 'low',
   'u0000001-0000-0000-0000-000000000006', 'David Lee',
   'Cost saving,Efficiency', 'IoT sensor procurement and installation logistics'),

  ('i0000001-0000-0000-0000-000000000011',
   'Learning Path Recommendation Engine',
   'Personalized learning recommendations based on role, skills gap analysis, and career trajectory. Integrates with Coursera, Udemy, and internal training.',
   'HR', 'POC', 'Micro', 'Low', 'PendingApproval', 'medium',
   'u0000001-0000-0000-0000-000000000003', 'Priya Sharma',
   'Efficiency,Product enhancement', null);

-- Step 4: Idea Members
INSERT INTO idea_members (idea_id, user_id, role) VALUES
  -- Completed: AI Chatbot
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 'owner'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 'contributor'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 'contributor'),
  -- Completed: Invoice Tool
  ('i0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000005', 'owner'),
  ('i0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000004', 'contributor'),
  -- Completed: Pulse Survey
  ('i0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000008', 'owner'),
  ('i0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000007', 'project_owner'),
  -- In Progress: Meeting Room
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 'owner'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000006', 'contributor'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', 'contributor'),
  -- In Progress: Knowledge Base
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000009', 'owner'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000003', 'contributor');

-- Step 5: Bids
INSERT INTO bids (id, idea_id, user_id, bid_type, lead_user_id, proposed_hours, approach_note, committed_date, status, bidder_name, performance_score) VALUES
  -- Completed: AI Chatbot — team bid (won)
  ('b0000001-0000-0000-0000-000000000001', 'i0000001-0000-0000-0000-000000000001',
   'u0000001-0000-0000-0000-000000000003', 'team', 'u0000001-0000-0000-0000-000000000003', 105,
   'Team approach: Priya leads UX + conversational design, Marcus builds API integration layer, Lisa handles Claude API fine-tuning. Phased delivery with weekly demos.',
   '2026-03-12T00:00:00Z', 'Won', 'Priya Sharma', 82),

  -- Completed: Invoice Tool — solo bid (won)
  ('b0000001-0000-0000-0000-000000000002', 'i0000001-0000-0000-0000-000000000002',
   'u0000001-0000-0000-0000-000000000005', 'solo', null, 38,
   'Will use Python pandas for reconciliation logic with fuzzy matching on invoice numbers. Export discrepancy reports as CSV.',
   '2026-02-08T00:00:00Z', 'Won', 'Aisha Khan', 78),

  -- Completed: Pulse Survey — solo bid (won)
  ('b0000001-0000-0000-0000-000000000003', 'i0000001-0000-0000-0000-000000000003',
   'u0000001-0000-0000-0000-000000000008', 'solo', null, 14,
   'React dashboard with Chart.js for visualizations. Will use Google Forms API to pull survey responses automatically.',
   '2026-01-22T00:00:00Z', 'Won', 'Raj Patel', 65),

  -- In Progress: Meeting Room — team bid (won)
  ('b0000001-0000-0000-0000-000000000004', 'i0000001-0000-0000-0000-000000000004',
   'u0000001-0000-0000-0000-000000000002', 'team', 'u0000001-0000-0000-0000-000000000002', 130,
   'Marcus leads backend (Node.js + Google Calendar API), David builds the room display UI (React), James handles the recommendation algorithm.',
   '2026-04-18T00:00:00Z', 'Won', 'Marcus Johnson', 75),

  -- In Progress: Knowledge Base — solo bid (won)
  ('b0000001-0000-0000-0000-000000000005', 'i0000001-0000-0000-0000-000000000005',
   'u0000001-0000-0000-0000-000000000009', 'solo', null, 190,
   'Using OpenAI embeddings + Pinecone vector DB for semantic search. Will build a Chrome extension for instant search from any page.',
   '2026-05-25T00:00:00Z', 'Won', 'Lisa Wang', 88),

  -- Bidding: Code Scanner — two competing bids
  ('b0000001-0000-0000-0000-000000000006', 'i0000001-0000-0000-0000-000000000006',
   'u0000001-0000-0000-0000-000000000004', 'solo', null, 100,
   'Custom AST-based scanner for architectural violations + SonarQube integration for security. GitHub Actions integration with PR blocking.',
   '2026-05-10T00:00:00Z', 'Pending', 'James Wilson', 72),

  ('b0000001-0000-0000-0000-000000000007', 'i0000001-0000-0000-0000-000000000006',
   'u0000001-0000-0000-0000-000000000009', 'solo', null, 110,
   'Will use ESLint custom rules + CodeQL for security scanning. Generates markdown reports on each PR with actionable fix suggestions.',
   '2026-05-12T00:00:00Z', 'Pending', 'Lisa Wang', 88),

  -- Bidding: Client Onboarding — team bid
  ('b0000001-0000-0000-0000-000000000008', 'i0000001-0000-0000-0000-000000000007',
   'u0000001-0000-0000-0000-000000000005', 'team', 'u0000001-0000-0000-0000-000000000005', 90,
   'Aisha leads product design, Raj handles document processing pipeline, David builds the client-facing portal.',
   '2026-05-05T00:00:00Z', 'Pending', 'Aisha Khan', 80),

  -- Bidding: Expense Processor — solo bid
  ('b0000001-0000-0000-0000-000000000009', 'i0000001-0000-0000-0000-000000000008',
   'u0000001-0000-0000-0000-000000000006', 'solo', null, 45,
   'React Native mobile app with Tesseract OCR for receipts. Will integrate with existing approval workflow system.',
   '2026-04-28T00:00:00Z', 'Pending', 'David Lee', 60);

-- Step 6: Team Members
INSERT INTO team_members (bid_id, user_id, confirmed) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', true),
  ('b0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', true),
  ('b0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', true),
  ('b0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', true),
  ('b0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000006', true),
  ('b0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', true),
  ('b0000001-0000-0000-0000-000000000008', 'u0000001-0000-0000-0000-000000000005', true),
  ('b0000001-0000-0000-0000-000000000008', 'u0000001-0000-0000-0000-000000000008', true),
  ('b0000001-0000-0000-0000-000000000008', 'u0000001-0000-0000-0000-000000000006', false);

-- Step 7: Time Logs (realistic daily entries)
INSERT INTO time_logs (idea_id, user_id, hours, description, logged_date) VALUES
  -- AI Chatbot (completed — 105 hrs total across 3 members)
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 6, 'Designed conversational flows and user personas', '2026-02-18'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 8, 'Set up Zendesk webhook integration and message router', '2026-02-18'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 7, 'Claude API prompt engineering and response templating', '2026-02-19'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 8, 'Built chat widget UI with real-time message streaming', '2026-02-20'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 7, 'Implemented fallback to human agent escalation flow', '2026-02-21'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 8, 'Fine-tuned response accuracy — 94% correct on test set', '2026-02-24'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 7, 'Added Slack notification channel for flagged conversations', '2026-02-25'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 6, 'Load testing and connection pooling optimization', '2026-02-26'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 8, 'Built analytics dashboard for chatbot performance metrics', '2026-02-27'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 6, 'End-to-end testing with real customer scenarios', '2026-03-03'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 7, 'Production deployment and monitoring setup', '2026-03-04'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 6, 'Documentation and knowledge transfer to support team', '2026-03-05'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000003', 7, 'Demo prep and final bug fixes', '2026-03-10'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002', 6, 'Final review and performance benchmarks', '2026-03-11'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 8, 'Added multi-language support (Arabic + English)', '2026-03-12'),

  -- Invoice Tool (completed — 38 hrs)
  ('i0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000005', 8, 'Data extraction pipeline from accounting system', '2026-01-25'),
  ('i0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000005', 7, 'Fuzzy matching algorithm for invoice numbers', '2026-01-27'),
  ('i0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000005', 8, 'Discrepancy detection and reporting module', '2026-01-29'),
  ('i0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000005', 7, 'CSV export and email notification system', '2026-02-03'),
  ('i0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000005', 8, 'Testing with real invoice data and demo prep', '2026-02-06'),

  -- Meeting Room (in progress — 68 hrs so far)
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 8, 'Google Calendar API integration and OAuth setup', '2026-03-15'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000006', 6, 'Room display UI wireframes and component library', '2026-03-15'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', 7, 'Recommendation algorithm — collaborative filtering approach', '2026-03-17'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 7, 'Room availability real-time sync engine', '2026-03-18'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000006', 8, 'Built room display kiosk mode with touch booking', '2026-03-20'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', 6, 'Equipment preference learning from past bookings', '2026-03-22'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 7, 'Conflict resolution when multiple teams want same room', '2026-03-25'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000006', 6, 'Mobile-responsive booking interface', '2026-03-27'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', 6, 'Analytics dashboard for space utilization metrics', '2026-03-28'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 7, 'Slack bot for room booking via /book command', '2026-04-01'),

  -- Knowledge Base (in progress — 42 hrs so far)
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000009', 8, 'Set up Pinecone vector DB and embedding pipeline', '2026-03-25'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000009', 7, 'Confluence and Notion API connectors for content ingestion', '2026-03-26'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000003', 6, 'Search UI with auto-complete and result highlighting', '2026-03-27'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000009', 7, 'Chunking strategy optimization — paragraph-level works best', '2026-03-28'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000003', 6, 'Chrome extension popup with instant search', '2026-03-31'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000009', 8, 'Google Docs API connector and incremental indexing', '2026-04-01');

-- Step 8: Comments
INSERT INTO comments (idea_id, user_id, content) VALUES
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'Impressive accuracy on the test set! Can we add Arabic language support before launch?'),
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000009', 'Done — added Arabic NLU pipeline. Now handles both EN and AR seamlessly.'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000001', 'The Slack /book command is a great addition. Can you also add /rooms to show availability?'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 'Good idea — adding /rooms and /myrooms commands this week.'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000010', 'The semantic search demo was incredible. How accurate is it on technical documentation?'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000009', 'About 91% relevant results in top 3 for engineering docs. Still tuning for legal docs.'),
  ('i0000001-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000001', 'Both bids look strong. Lisa has higher score but James proposed a more thorough approach. Let the cutoff pass and we review.'),
  ('i0000001-0000-0000-0000-000000000007', 'u0000001-0000-0000-0000-000000000010', 'Legal team confirmed KYC API integration is approved. Green light to proceed once bid is assigned.');

-- Step 9: Feedbacks on completed ideas
INSERT INTO feedbacks (idea_id, user_id, rating, comment) VALUES
  ('i0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000001', 'Excellent', 'Outstanding work. The chatbot handles 73% of Tier 1 queries without human intervention. Response time dropped from 4 hours to 90 seconds. The Arabic support was a brilliant addition.'),
  ('i0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000010', 'Good', 'Solid tool that saves the finance team significant time. Would love to see a web UI in the next iteration instead of CLI-only.'),
  ('i0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000001', 'Good', 'Clean dashboard with useful insights. Sentiment analysis is helpful. Delivered early which is great.');

-- Step 10: Point batches (for marketplace/expiry)
INSERT INTO point_batches (user_id, points, remaining, source, idea_id, earned_at, expires_at) VALUES
  ('u0000001-0000-0000-0000-000000000003', 79, 79, 'AI-Powered Customer Support Chatbot (Excellent)', 'i0000001-0000-0000-0000-000000000001', '2026-03-12', '2027-03-12'),
  ('u0000001-0000-0000-0000-000000000002', 79, 79, 'AI-Powered Customer Support Chatbot (Excellent)', 'i0000001-0000-0000-0000-000000000001', '2026-03-12', '2027-03-12'),
  ('u0000001-0000-0000-0000-000000000009', 79, 79, 'AI-Powered Customer Support Chatbot (Excellent)', 'i0000001-0000-0000-0000-000000000001', '2026-03-12', '2027-03-12'),
  ('u0000001-0000-0000-0000-000000000005', 95, 95, 'Automated Invoice Reconciliation (Good)', 'i0000001-0000-0000-0000-000000000002', '2026-02-08', '2027-02-08'),
  ('u0000001-0000-0000-0000-000000000008', 60, 60, 'Employee Pulse Survey Dashboard (Good)', 'i0000001-0000-0000-0000-000000000003', '2026-01-22', '2027-01-22'),
  ('u0000001-0000-0000-0000-000000000003', 5, 5, 'Idea submission bonus', null, '2026-03-15', '2027-03-15'),
  ('u0000001-0000-0000-0000-000000000005', 5, 5, 'Idea submission bonus', null, '2026-02-10', '2027-02-10'),
  ('u0000001-0000-0000-0000-000000000009', 500, 250, 'Various early contributions', null, '2025-12-01', '2026-12-01'),
  ('u0000001-0000-0000-0000-000000000005', 800, 550, 'Various early contributions', null, '2025-11-15', '2026-11-15'),
  ('u0000001-0000-0000-0000-000000000009', 1000, 1000, 'Hackathon Q1 bonus', null, '2026-01-15', '2027-01-15');

-- Step 11: Project Tasks (for in-progress ideas)
INSERT INTO project_tasks (idea_id, title, description, status, priority, assigned_to, created_by, due_date, "order") VALUES
  -- Meeting Room project tasks
  ('i0000001-0000-0000-0000-000000000004', 'Google Calendar API integration', 'Set up OAuth2 and calendar read/write access', 'done', 'high', 'u0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000002', '2026-03-20', 1),
  ('i0000001-0000-0000-0000-000000000004', 'Room display kiosk UI', 'Touch-friendly interface for room displays showing availability', 'done', 'high', 'u0000001-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000002', '2026-03-25', 2),
  ('i0000001-0000-0000-0000-000000000004', 'Recommendation algorithm', 'ML model for room suggestions based on team preferences', 'in_progress', 'high', 'u0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', '2026-04-05', 3),
  ('i0000001-0000-0000-0000-000000000004', 'Slack bot /book and /rooms commands', 'Slack integration for quick room booking', 'in_progress', 'medium', 'u0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000002', '2026-04-08', 4),
  ('i0000001-0000-0000-0000-000000000004', 'Mobile-responsive booking interface', 'Responsive design for phone/tablet booking', 'in_review', 'medium', 'u0000001-0000-0000-0000-000000000006', 'u0000001-0000-0000-0000-000000000002', '2026-04-10', 5),
  ('i0000001-0000-0000-0000-000000000004', 'Space utilization analytics dashboard', 'Charts showing room usage patterns and peak times', 'todo', 'medium', 'u0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', '2026-04-12', 6),
  ('i0000001-0000-0000-0000-000000000004', 'Conflict resolution for double bookings', 'Handle race conditions and suggest alternatives', 'todo', 'high', 'u0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000002', '2026-04-15', 7),
  ('i0000001-0000-0000-0000-000000000004', 'End-to-end testing and load testing', 'Test with 100+ concurrent bookings', 'todo', 'low', null, 'u0000001-0000-0000-0000-000000000002', '2026-04-18', 8),

  -- Knowledge Base project tasks
  ('i0000001-0000-0000-0000-000000000005', 'Pinecone vector DB setup', 'Initialize indexes and configure embedding dimensions', 'done', 'high', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009', '2026-03-28', 1),
  ('i0000001-0000-0000-0000-000000000005', 'Confluence API connector', 'Pull and index all Confluence spaces', 'done', 'high', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009', '2026-04-01', 2),
  ('i0000001-0000-0000-0000-000000000005', 'Search UI with auto-complete', 'React search component with real-time suggestions', 'done', 'high', 'u0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000009', '2026-04-03', 3),
  ('i0000001-0000-0000-0000-000000000005', 'Google Docs connector', 'Index shared Google Docs with incremental updates', 'in_progress', 'high', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009', '2026-04-10', 4),
  ('i0000001-0000-0000-0000-000000000005', 'Chrome extension', 'Popup extension for instant search from any webpage', 'in_progress', 'medium', 'u0000001-0000-0000-0000-000000000003', 'u0000001-0000-0000-0000-000000000009', '2026-04-15', 5),
  ('i0000001-0000-0000-0000-000000000005', 'Notion API connector', 'Index Notion workspaces', 'todo', 'medium', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009', '2026-04-20', 6),
  ('i0000001-0000-0000-0000-000000000005', 'Permission-aware search results', 'Only show results user has access to', 'todo', 'high', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009', '2026-05-01', 7),
  ('i0000001-0000-0000-0000-000000000005', 'Search analytics and feedback loop', 'Track what people search for and improve results', 'todo', 'low', null, 'u0000001-0000-0000-0000-000000000009', '2026-05-15', 8);

-- Step 12: Project Messages
INSERT INTO project_messages (idea_id, user_id, channel, content, message_type) VALUES
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 'General', 'Team sync: we are on track for the April 20 delivery. Kiosk UI is done, recommendation algo is looking good.', 'message'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000006', 'General', 'Kiosk mode tested on 3 different screen sizes — all working well. Submitted for review.', 'update'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', 'Design', 'Should we use a heatmap or bar chart for the utilization dashboard? I have mockups for both.', 'message'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 'Design', 'Heatmap looks way better for spatial data. Go with that. Can you link the Figma?', 'message'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 'Blockers', 'Google Calendar API rate limit is 100 requests/minute. We need a caching layer for the real-time display.', 'blocker'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000004', 'Blockers', 'I can build a Redis cache layer. Should take about 4 hours. Will have it done by Friday.', 'message'),
  ('i0000001-0000-0000-0000-000000000004', 'u0000001-0000-0000-0000-000000000002', 'Requirements', 'Updated requirement: rooms should show equipment list (projector, whiteboard, video conferencing) on the display.', 'requirement'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000009', 'General', 'Semantic search accuracy is now at 91% for engineering docs. Still tuning for legal and HR content.', 'update'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000003', 'Design', 'Chrome extension mockup ready — minimalist popup with instant results. Will share Figma link.', 'design_link'),
  ('i0000001-0000-0000-0000-000000000005', 'u0000001-0000-0000-0000-000000000009', 'Requirements', 'Critical: search results must respect document permissions. Users should only see docs they have access to.', 'requirement');

-- Step 13: Project Links
INSERT INTO project_links (idea_id, title, url, link_type, added_by) VALUES
  ('i0000001-0000-0000-0000-000000000004', 'Room Booking UI Designs', 'https://figma.com/file/room-booking-designs', 'figma', 'u0000001-0000-0000-0000-000000000006'),
  ('i0000001-0000-0000-0000-000000000004', 'GitHub Repository', 'https://github.com/company/smart-rooms', 'github', 'u0000001-0000-0000-0000-000000000002'),
  ('i0000001-0000-0000-0000-000000000004', 'Technical Architecture Doc', 'https://docs.google.com/document/d/room-arch', 'docs', 'u0000001-0000-0000-0000-000000000002'),
  ('i0000001-0000-0000-0000-000000000004', 'Google Calendar API Docs', 'https://developers.google.com/calendar', 'docs', 'u0000001-0000-0000-0000-000000000002'),
  ('i0000001-0000-0000-0000-000000000005', 'Search UI Figma', 'https://figma.com/file/knowledge-search-ui', 'figma', 'u0000001-0000-0000-0000-000000000003'),
  ('i0000001-0000-0000-0000-000000000005', 'GitHub — Search Engine', 'https://github.com/company/knowledge-search', 'github', 'u0000001-0000-0000-0000-000000000009'),
  ('i0000001-0000-0000-0000-000000000005', 'Chrome Extension Prototype', 'https://company-search-ext.vercel.app', 'prototype', 'u0000001-0000-0000-0000-000000000003'),
  ('i0000001-0000-0000-0000-000000000005', 'Pinecone Dashboard', 'https://app.pinecone.io/organizations/company', 'other', 'u0000001-0000-0000-0000-000000000009');

-- Step 14: Project Requirements
INSERT INTO project_requirements (idea_id, title, description, status, priority, created_by, assigned_to) VALUES
  ('i0000001-0000-0000-0000-000000000004', 'Google Calendar read/write integration', 'OAuth2 flow + calendar event CRUD', 'done', 'must_have', 'u0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000002'),
  ('i0000001-0000-0000-0000-000000000004', 'Real-time room availability display', 'Auto-refresh every 30 seconds on kiosk screens', 'done', 'must_have', 'u0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000006'),
  ('i0000001-0000-0000-0000-000000000004', 'Smart room recommendation', 'Suggest best room based on team size and equipment needs', 'in_progress', 'must_have', 'u0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000004'),
  ('i0000001-0000-0000-0000-000000000004', 'Slack bot commands', '/book, /rooms, /myrooms slash commands', 'in_progress', 'should_have', 'u0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000002'),
  ('i0000001-0000-0000-0000-000000000004', 'Equipment list on room display', 'Show projector, whiteboard, VC availability per room', 'open', 'should_have', 'u0000001-0000-0000-0000-000000000002', 'u0000001-0000-0000-0000-000000000006'),
  ('i0000001-0000-0000-0000-000000000004', 'Space utilization analytics', 'Weekly report on room usage patterns', 'open', 'nice_to_have', 'u0000001-0000-0000-0000-000000000001', 'u0000001-0000-0000-0000-000000000004'),
  ('i0000001-0000-0000-0000-000000000005', 'Confluence content indexing', 'All spaces indexed with daily incremental updates', 'done', 'must_have', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009'),
  ('i0000001-0000-0000-0000-000000000005', 'Semantic search with 90%+ accuracy', 'Top 3 results relevant for engineering queries', 'done', 'must_have', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009'),
  ('i0000001-0000-0000-0000-000000000005', 'Google Docs connector', 'Index shared drives and personal docs', 'in_progress', 'must_have', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009'),
  ('i0000001-0000-0000-0000-000000000005', 'Permission-aware results', 'Respect document-level access permissions in search', 'open', 'must_have', 'u0000001-0000-0000-0000-000000000010', 'u0000001-0000-0000-0000-000000000009'),
  ('i0000001-0000-0000-0000-000000000005', 'Chrome extension', 'Instant search popup from any webpage', 'in_progress', 'should_have', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000003'),
  ('i0000001-0000-0000-0000-000000000005', 'Notion workspace indexing', 'Index team Notion workspaces', 'open', 'should_have', 'u0000001-0000-0000-0000-000000000009', 'u0000001-0000-0000-0000-000000000009');

-- Step 15: Milestones
INSERT INTO milestones (user_id, title, points_required, reward_description, is_claimed) VALUES
  ('u0000001-0000-0000-0000-000000000005', 'Reached 2,000 points!', 2000, 'Pending HR review', false);

-- Done!
SELECT 'Seed complete! Created:' as status,
  (SELECT count(*) FROM users) as users,
  (SELECT count(*) FROM ideas) as ideas,
  (SELECT count(*) FROM bids) as bids,
  (SELECT count(*) FROM time_logs) as time_logs,
  (SELECT count(*) FROM project_tasks) as tasks,
  (SELECT count(*) FROM project_messages) as messages,
  (SELECT count(*) FROM project_links) as links,
  (SELECT count(*) FROM project_requirements) as requirements;
