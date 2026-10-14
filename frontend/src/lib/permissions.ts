// ========================================================
// Task Tracker - Frontend Centralized RBAC Permissions
// ========================================================

import { UserRole } from '../types';

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
  'Manager': [
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
 * Normalizes legacy role names (e.g. 'Manager' -> 'Education Manager')
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
 * Return default landing page for each role upon login
 */
export function getRedirectPathForRole(roleName: string | undefined): string {
  const normalized = normalizeRole(roleName);
  switch (normalized) {
    case 'Super Admin':
    case 'Admin':
      return '/';
    case 'Education Manager':
      return '/manager';
    case 'Team Member':
    default:
      return '/my-tasks';
  }
}

/**
 * Check if a user can modify a target user's profile
 */
export function canModifyUser(
  actingUser: { role_name?: string; id?: string } | null,
  targetUser: { role_name?: string; id?: string } | null
): boolean {
  if (!actingUser || !targetUser) return false;
  const actingRole = normalizeRole(actingUser.role_name);
  const targetRole = normalizeRole(targetUser.role_name);

  if (actingUser.id && targetUser.id && actingUser.id === targetUser.id) {
    return true;
  }

  if (actingRole === 'Super Admin') return true;

  if (actingRole === 'Admin') {
    if (targetRole === 'Super Admin') return false;
    return true;
  }

  return false;
}

/**
 * Check if acting user is allowed to assign a specific role
 */
export function canAssignRole(
  actingUser: { role_name?: string } | null,
  roleToAssign: UserRole
): boolean {
  if (!actingUser) return false;
  const actingRole = normalizeRole(actingUser.role_name);
  if (actingRole === 'Super Admin') return true;
  if (actingRole === 'Admin') {
    return roleToAssign !== 'Super Admin';
  }
  return false;
}
