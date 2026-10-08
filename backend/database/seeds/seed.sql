-- ========================================================
-- Task Tracker - Seed Data Script
-- Initial Roles, Permissions, Statuses, Priorities, Teams,
-- Users, Tasks, Subtasks, Checklists, Updates & Activity Logs
-- ========================================================

-- Roles
INSERT INTO roles (id, name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Super Admin', 'Full access to all system resources, settings, and user management'),
('22222222-2222-2222-2222-222222222222', 'Manager', 'Can create, assign, supervise tasks and monitor team performance'),
('33333333-3333-3333-3333-333333333333', 'Team Member', 'Executes assigned tasks, provides updates, comments, and flags blockers')
ON CONFLICT (name) DO NOTHING;

-- Statuses
INSERT INTO task_statuses (id, name, color, order_index, status_type, is_default) VALUES
('a0000001-0000-0000-0000-000000000001', 'Not Started', '#94a3b8', 1, 'open', true),
('a0000001-0000-0000-0000-000000000002', 'In Progress', '#3b82f6', 2, 'in_progress', false),
('a0000001-0000-0000-0000-000000000003', 'Waiting', '#f59e0b', 3, 'waiting', false),
('a0000001-0000-0000-0000-000000000004', 'Blocked', '#ef4444', 4, 'in_progress', false),
('a0000001-0000-0000-0000-000000000005', 'Under Review', '#8b5cf6', 5, 'waiting', false),
('a0000001-0000-0000-0000-000000000006', 'Completed', '#10b981', 6, 'completed', false),
('a0000001-0000-0000-0000-000000000007', 'Cancelled', '#64748b', 7, 'cancelled', false)
ON CONFLICT (name) DO NOTHING;

-- Priorities
INSERT INTO task_priorities (id, name, level, order_index, icon, color, weight) VALUES
('b0000001-0000-0000-0000-000000000001', 'Low', 1, 1, 'arrow-down', '#94a3b8', 1),
('b0000001-0000-0000-0000-000000000002', 'Medium', 2, 2, 'minus', '#3b82f6', 2),
('b0000001-0000-0000-0000-000000000003', 'High', 3, 3, 'arrow-up', '#f59e0b', 3),
('b0000001-0000-0000-0000-000000000004', 'Urgent', 4, 4, 'alert-triangle', '#f97316', 4),
('b0000001-0000-0000-0000-000000000005', 'Critical', 5, 5, 'flame', '#ef4444', 5)
ON CONFLICT (name) DO NOTHING;

-- Categories
INSERT INTO task_categories (id, name, description, color) VALUES
('c0000001-0000-0000-0000-000000000001', 'Technical', 'Technical development, infrastructure and engineering', '#2563eb'),
('c0000001-0000-0000-0000-000000000002', 'Content', 'Curriculum, course outlines, and instructional material', '#7c3aed'),
('c0000001-0000-0000-0000-000000000003', 'Operations', 'Daily operations, process flows, and coordination', '#059669'),
('c0000001-0000-0000-0000-000000000004', 'Quality', 'QA reviews, audits, and performance benchmarking', '#d97706'),
('c0000001-0000-0000-0000-000000000005', 'Security', 'Penetration testing, SOC, vulnerability assessments', '#dc2626'),
('c0000001-0000-0000-0000-000000000006', 'Meeting', 'Internal and external alignment and strategic meetings', '#4b5563')
ON CONFLICT (name) DO NOTHING;

-- Tags
INSERT INTO tags (id, name, color) VALUES
('d0000001-0000-0000-0000-000000000001', '#PenTest', '#ef4444'),
('d0000001-0000-0000-0000-000000000002', '#Content', '#8b5cf6'),
('d0000001-0000-0000-0000-000000000003', '#Urgent', '#f97316'),
('d0000001-0000-0000-0000-000000000004', '#Instructor', '#06b6d4'),
('d0000001-0000-0000-0000-000000000005', '#DevOps', '#3b82f6'),
('d0000001-0000-0000-0000-000000000006', '#SOC', '#10b981')
ON CONFLICT (name) DO NOTHING;

-- Demo Profiles (Users)
-- Passwords default hash for demo: 'Admin@123'
INSERT INTO profiles (id, email, password_hash, full_name, avatar_url, phone, role_id, department, job_title, status, timezone) VALUES
('u0000001-0000-0000-0000-000000000001', 'eslam@tasktracker.io', '$2b$10$abcdefghijklmnopqrstuv', 'Eslam Salah', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '+20 100 123 4567', '11111111-1111-1111-1111-111111111111', 'Executive', 'Head of Operations & Systems', 'active', 'Africa/Cairo'),
('u0000002-0000-0000-0000-000000000002', 'walied@tasktracker.io', '$2b$10$abcdefghijklmnopqrstuv', 'Walied Said', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '+20 100 234 5678', '22222222-2222-2222-2222-222222222222', 'Education & Tech', 'Education & Security Manager', 'active', 'Africa/Cairo'),
('u0000003-0000-0000-0000-000000000003', 'sarah@tasktracker.io', '$2b$10$abcdefghijklmnopqrstuv', 'Sarah Ahmed', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '+20 100 345 6789', '33333333-3333-3333-3333-333333333333', 'Education & Tech', 'Senior Penetration Testing Lead', 'active', 'Africa/Cairo'),
('u0000004-0000-0000-0000-000000000004', 'mohamed@tasktracker.io', '$2b$10$abcdefghijklmnopqrstuv', 'Mohamed Mostafa', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '+20 100 456 7890', '33333333-3333-3333-3333-333333333333', 'Infrastructure', 'DevOps & Cloud Engineer', 'active', 'Africa/Cairo'),
('u0000005-0000-0000-0000-000000000005', 'nourhan@tasktracker.io', '$2b$10$abcdefghijklmnopqrstuv', 'Nourhan Ali', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', '+20 100 567 8901', '33333333-3333-3333-3333-333333333333', 'Quality Assurance', 'QA & Content Coordinator', 'active', 'Africa/Cairo'),
('u0000006-0000-0000-0000-000000000006', 'kareem@tasktracker.io', '$2b$10$abcdefghijklmnopqrstuv', 'Kareem Hassan', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '+20 100 678 9012', '33333333-3333-3333-3333-333333333333', 'Security Operations', 'SOC Analyst Tier II', 'active', 'Africa/Cairo')
ON CONFLICT (email) DO NOTHING;

-- Demo Teams
INSERT INTO teams (id, name, description, manager_id, department, status) VALUES
('t0000001-0000-0000-0000-000000000001', 'Penetration Testing & Offensive Sec', 'Responsible for curriculum, lab environments, and pen testing courses', 'u0000002-0000-0000-0000-000000000002', 'Education & Tech', 'active'),
('t0000002-0000-0000-0000-000000000002', 'DevOps & Cloud Infrastructure', 'Manages cloud labs, deployment pipelines, and server reliability', 'u0000002-0000-0000-0000-000000000002', 'Infrastructure', 'active'),
('t0000003-0000-0000-0000-000000000003', 'Operations & Quality Assurance', 'Manages course QA, student feedback loops, and instructional quality', 'u0000001-0000-0000-0000-000000000001', 'Executive', 'active')
ON CONFLICT DO NOTHING;

-- Team Members
INSERT INTO team_members (team_id, user_id, role_in_team) VALUES
('t0000001-0000-0000-0000-000000000001', 'u0000002-0000-0000-0000-000000000002', 'Manager'),
('t0000001-0000-0000-0000-000000000001', 'u0000003-0000-0000-0000-000000000003', 'Track Lead'),
('t0000001-0000-0000-0000-000000000001', 'u0000005-0000-0000-0000-000000000005', 'QA Coordinator'),
('t0000002-0000-0000-0000-000000000002', 'u0000004-0000-0000-0000-000000000004', 'Lead Engineer'),
('t0000003-0000-0000-0000-000000000003', 'u0000005-0000-0000-0000-000000000005', 'QA Lead'),
('t0000001-0000-0000-0000-000000000001', 'u0000006-0000-0000-0000-000000000006', 'Security Specialist')
ON CONFLICT DO NOTHING;

-- System Settings
INSERT INTO system_settings (setting_key, setting_value_json, description) VALUES
('no_update_threshold_days', '{"value": 3}'::jsonb, 'Threshold in days to flag tasks with no recent updates'),
('sla_urgent_hours', '{"value": 4}'::jsonb, 'SLA maximum hours before first update for urgent tasks'),
('sla_high_hours', '{"value": 24}'::jsonb, 'SLA maximum hours before first update for high priority tasks'),
('timezone', '{"value": "Africa/Cairo"}'::jsonb, 'Default organizational timezone'),
('workload_thresholds', '{"low": 3, "normal": 6, "high": 10}'::jsonb, 'Thresholds for workload categorization')
ON CONFLICT (setting_key) DO NOTHING;
