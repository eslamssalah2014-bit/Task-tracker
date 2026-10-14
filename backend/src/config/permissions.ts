// ========================================================
// Task Tracker - Centralized RBAC Permissions Configuration
// ========================================================

export type UserRole = 'Super Admin' | 'Admin' | 'Education Manager' | 'Team Member';

export type Permission =
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.disable'
  | 'users.assign_role'
  | 'tasks.view_all'
  | 'tasks.view_assigned'
  | 'tasks.create'
  | 'tasks.edit'
  | 'tasks.delete'
  | 'tasks.assign'
  | 'tasks.update_progress'
  | 'tasks.change_status'
  | 'tasks.approve'
  | 'teams.view'
  | 'teams.manage'
  | 'reports.view'
  | 'settings.manage'
  | 'audit_logs.view';

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  'Super Admin': [
    'users.view',
    'users.create',
    'users.edit',
    'users.disable',
    'users.assign_role',
    'tasks.view_all',
    'tasks.view_assigned',
    'tasks.create',
    'tasks.edit',
    'tasks.delete',
    'tasks.assign',
    'tasks.update_progress',
    'tasks.change_status',
    'tasks.approve',
    'teams.view',
    'teams.manage',
    'reports.view',
    'settings.manage',
    'audit_logs.view',
  ],
  'Admin': [
    'users.view',
    'users.create',
    'users.edit',
    'users.disable',
    'tasks.view_all',
    'tasks.view_assigned',
    'tasks.create',
    'tasks.edit',
    'tasks.delete',
    'tasks.assign',
    'tasks.update_progress',
    'tasks.change_status',
    'tasks.approve',
    'teams.view',
    'teams.manage',
    'reports.view',
    'audit_logs.view',
  ],
  'Education Manager': [
    'tasks.view_all',
    'tasks.view_assigned',
    'tasks.create',
    'tasks.edit',
    'tasks.assign',
    'tasks.update_progress',
    'tasks.change_status',
    'tasks.approve',
    'teams.view',
    'reports.view',
  ],
  'Team Member': [
    'tasks.view_assigned',
    'tasks.update_progress',
    'tasks.change_status',
  ],
};

/**
 * Normalizes legacy role names (e.g., 'Manager' -> 'Education Manager')
 */
export function normalizeRole(roleName?: string): UserRole {
  if (!roleName) return 'Team Member';
  if (roleName === 'Manager') return 'Education Manager';
  if (
    roleName === 'Super Admin' ||
    roleName === 'Admin' ||
    roleName === 'Education Manager' ||
    roleName === 'Team Member'
  ) {
    return roleName;
  }
  return 'Team Member';
}

/**
 * Check if a role has a given permission
 */
export function roleHasPermission(roleName: string | undefined, permission: Permission): boolean {
  const normalized = normalizeRole(roleName);
  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the given permissions
 */
export function roleHasAnyPermission(roleName: string | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHasPermission(roleName, p));
}

/**
 * Check if a user can modify a target user's profile or status
 * - Super Admin can manage anyone
 * - Admin can manage users who are not Super Admin, and cannot promote to Super Admin
 * - Others cannot modify user accounts
 */
export function canModifyUser(
  actingUser: { role_name?: string; id?: string },
  targetUser: { role_name?: string; id?: string }
): boolean {
  if (!actingUser) return false;
  const actingRole = normalizeRole(actingUser.role_name);
  const targetRole = normalizeRole(targetUser.role_name);

  // Self profile update is allowed for non-privileged fields
  if (actingUser.id && targetUser.id && actingUser.id === targetUser.id) {
    return true;
  }

  if (actingRole === 'Super Admin') return true;

  if (actingRole === 'Admin') {
    // Admin cannot modify Super Admin accounts
    if (targetRole === 'Super Admin') return false;
    return true;
  }

  return false;
}

/**
 * Check if a user is allowed to assign a specific role to another user
 */
export function canAssignRole(
  actingUser: { role_name?: string },
  roleToAssign: UserRole
): boolean {
  if (!actingUser) return false;
  const actingRole = normalizeRole(actingUser.role_name);
  if (actingRole === 'Super Admin') return true;
  if (actingRole === 'Admin') {
    // Admin cannot create or assign Super Admin role
    return roleToAssign !== 'Super Admin';
  }
  return false;
}
