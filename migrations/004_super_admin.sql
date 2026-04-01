-- Migration 004: Ensure super admin user exists
-- This creates a default admin user if no admin exists

INSERT INTO users (email, full_name, role, total_points)
SELECT 'admin@buildboard.com', 'Super Admin', 'Admin', 0
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role = 'Admin');
