-- ========================================================
-- Task Tracker - RBAC & Permissions Migration
-- Adds Admin, Education Manager, Permissions & Mappings
-- ========================================================

-- 1. Ensure Roles Exist & Normalize Existing Data
UPDATE roles SET name = 'Education Manager' WHERE name = 'Manager';

INSERT INTO roles (id, name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Super Admin', 'Full access to all system resources, settings, user management, and configurations'),
('22222222-1111-2222-1111-222222222222', 'Admin', 'Administrative operations, user management, team oversight, and reporting'),
('22222222-2222-2222-2222-222222222222', 'Education Manager', 'Can supervise education teams, create and assign tasks, manage progress, and review reports'),
('33333333-3333-3333-3333-333333333333', 'Team Member', 'Executes assigned tasks, provides updates, comments, and flags blockers')
ON CONFLICT (name) DO NOTHING;

-- 2. Populate Standard Permissions
INSERT INTO permissions (name, module, description) VALUES
('users.view', 'users', 'View user profiles and user management directory'),
('users.create', 'users', 'Create and provision new user accounts'),
('users.edit', 'users', 'Edit user profiles and information'),
('users.disable', 'users', 'Activate or deactivate user accounts'),
('users.assign_role', 'users', 'Assign and change user roles'),
('tasks.view_all', 'tasks', 'View all system tasks across teams'),
('tasks.view_assigned', 'tasks', 'View assigned and shared tasks'),
('tasks.create', 'tasks', 'Create new tasks'),
('tasks.edit', 'tasks', 'Edit task details, schedules, and properties'),
('tasks.delete', 'tasks', 'Delete tasks'),
('tasks.assign', 'tasks', 'Assign or reassign tasks to team members'),
('tasks.update_progress', 'tasks', 'Update progress percentage and task updates'),
('tasks.change_status', 'tasks', 'Change task status'),
('tasks.approve', 'tasks', 'Approve or reject tasks requiring manager approval'),
('teams.view', 'teams', 'View team lists and structures'),
('teams.manage', 'teams', 'Create, update, and manage teams'),
('reports.view', 'reports', 'View analytical reports and export metrics'),
('settings.manage', 'settings', 'Configure system settings, statuses, priorities, and categories'),
('audit_logs.view', 'settings', 'View audit logs and system activity trails')
ON CONFLICT (name) DO UPDATE SET module = EXCLUDED.module, description = EXCLUDED.description;

-- 3. Map Role Permissions
-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin: User management (except settings.manage), Tasks, Teams, Reports, Audit Logs
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Admin' AND p.name IN (
    'users.view', 'users.create', 'users.edit', 'users.disable',
    'tasks.view_all', 'tasks.view_assigned', 'tasks.create', 'tasks.edit',
    'tasks.delete', 'tasks.assign', 'tasks.update_progress', 'tasks.change_status',
    'tasks.approve', 'teams.view', 'teams.manage', 'reports.view', 'audit_logs.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Education Manager: Operational task oversight, team viewing, reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Education Manager' AND p.name IN (
    'tasks.view_all', 'tasks.view_assigned', 'tasks.create', 'tasks.edit',
    'tasks.assign', 'tasks.update_progress', 'tasks.change_status',
    'tasks.approve', 'teams.view', 'reports.view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Team Member: Assigned tasks execution
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Team Member' AND p.name IN (
    'tasks.view_assigned', 'tasks.update_progress', 'tasks.change_status'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
