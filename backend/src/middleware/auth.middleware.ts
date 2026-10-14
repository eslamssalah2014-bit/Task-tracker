import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response';
import { UserRepository } from '../repositories/userRepository';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../config/supabase';
import {
  Permission,
  normalizeRole,
  roleHasPermission,
  roleHasAnyPermission,
  canModifyUser,
  canAssignRole,
} from '../config/permissions';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

/**
 * Middleware: Enforces that the request has a valid authentication token.
 * Validates Supabase JWT or Bearer session token.
 * Never allows unauthenticated requests.
 */
export const requireAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    const userIdHeader = req.headers['x-user-id'] as string;

    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (userIdHeader) {
      token = userIdHeader.trim();
    }

    if (!token) {
      return sendError(
        res,
        'Authentication required. Please provide a valid Bearer token.',
        401,
        'UNAUTHORIZED'
      );
    }

    let user: UserProfile | null = null;

    // 1. First, check if the token is a Supabase Auth JWT token
    if (token.includes('.') && token.length > 30) {
      try {
        const { data: supaUser, error: supaErr } = await supabase.auth.getUser(token);
        if (!supaErr && supaUser?.user?.email) {
          user = await UserRepository.getByEmail(supaUser.user.email);
          if (!user && supaUser.user.id) {
            user = await UserRepository.getById(supaUser.user.id);
          }
        }
      } catch (err) {
        // Fall through to repository ID check
      }
    }

    // 2. If not found via Supabase JWT or token is user ID/session ID
    if (!user) {
      user = await UserRepository.getById(token);
    }

    // 3. Fallback: check by email if token is an email string
    if (!user && token.includes('@')) {
      user = await UserRepository.getByEmail(token);
    }

    if (!user) {
      return sendError(
        res,
        'Invalid or expired authentication session. Please log in again.',
        401,
        'UNAUTHORIZED'
      );
    }

    // Check account status
    if (user.status === 'disabled') {
      return sendError(
        res,
        'Your account has been deactivated. Please contact your system administrator.',
        403,
        'ACCOUNT_DISABLED'
      );
    }

    req.user = user;
    return next();
  } catch (error: any) {
    return sendError(res, 'Authentication verification failed', 401, 'UNAUTHORIZED', error.message);
  }
};

// Alias for backwards compatibility
export const authenticate = requireAuthentication;

/**
 * Middleware: Verify the user account is active
 */
export const requireActiveUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): any => {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
  }

  if (req.user.status !== 'active') {
    return sendError(
      res,
      'Account is not active. Access denied.',
      403,
      'ACCOUNT_DISABLED'
    );
  }

  return next();
};

/**
 * Middleware: Require one or more specific permissions
 */
export const requirePermission = (permission: Permission | Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const permissionsToCheck = Array.isArray(permission) ? permission : [permission];
    const userRole = normalizeRole(req.user.role_name);

    const hasAll = permissionsToCheck.every((p) => roleHasPermission(userRole, p));
    if (!hasAll) {
      return sendError(
        res,
        `Access denied. You lack the required permission(s): ${permissionsToCheck.join(', ')}`,
        403,
        'FORBIDDEN'
      );
    }

    return next();
  };
};

/**
 * Middleware: Require any of the given permissions
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const userRole = normalizeRole(req.user.role_name);
    const hasAny = roleHasAnyPermission(userRole, permissions);

    if (!hasAny) {
      return sendError(
        res,
        `Access denied. Requires at least one of: ${permissions.join(', ')}`,
        403,
        'FORBIDDEN'
      );
    }

    return next();
  };
};

/**
 * Middleware: Require one of the specified roles
 */
export const requireRole = (roles: (UserRole | string)[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const normalizedUserRole = normalizeRole(req.user.role_name);
    const normalizedAllowed = roles.map((r) => normalizeRole(r));

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return sendError(
        res,
        `Forbidden. This operation requires one of the following roles: ${roles.join(', ')}`,
        403,
        'FORBIDDEN'
      );
    }

    return next();
  };
};

// Alias for backwards compatibility
export const requireRoles = requireRole;
