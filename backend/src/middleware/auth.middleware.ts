import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response';
import { UserRepository } from '../repositories/userRepository';
import { UserProfile, UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    const userIdHeader = req.headers['x-user-id'] as string;

    // Support Bearer token or development x-user-id header
    let userId = userIdHeader;
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // In production with Supabase Auth: verify JWT and extract user id
      // For fast local & standalone testing: support user IDs directly or encoded tokens
      userId = token;
    }

    // Default fallback to Admin for convenient initial testing if no header is passed
    if (!userId) {
      userId = 'u0000001-0000-0000-0000-000000000001'; // Eslam Salah (Super Admin)
    }

    const user = await UserRepository.getById(userId);
    if (!user) {
      return sendError(res, 'User not found or unauthorized', 401, 'UNAUTHORIZED');
    }

    if (user.status === 'disabled') {
      return sendError(res, 'User account is disabled', 403, 'ACCOUNT_DISABLED');
    }

    req.user = user;
    return next();
  } catch (error: any) {
    return sendError(res, 'Authentication failed', 401, 'UNAUTHORIZED', error.message);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 */
export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!roles.includes(req.user.role_name as UserRole)) {
      return sendError(
        res,
        `Forbidden. This action requires one of the following roles: ${roles.join(', ')}`,
        403,
        'FORBIDDEN'
      );
    }

    return next();
  };
};
