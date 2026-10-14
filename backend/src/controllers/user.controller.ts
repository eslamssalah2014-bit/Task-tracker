import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { UserRepository } from '../repositories/userRepository';
import { TaskRepository } from '../repositories/taskRepository';
import { sendError, sendSuccess } from '../utils/response';
import { TaskHealthService } from '../services/taskHealthService';
import { canModifyUser, canAssignRole, normalizeRole } from '../config/permissions';
import { supabase } from '../config/supabase';

export class UserController {
  static async getAll(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { role, department, status, search } = req.query;

    const users = await UserRepository.getAll({
      role: role as string,
      department: department as string,
      status: status as string,
      search: search as string,
    });

    const allTasks = await TaskRepository.getAll({ is_archived: false });

    // Enrich each user with active and completed task counts
    const enrichedUsers = users.map((u) => {
      const userTasks = allTasks.filter((t) => (t.assignees || []).some((a) => a.id === u.id));
      const activeCount = userTasks.filter((t) => t.status?.status_type !== 'completed' && t.status?.status_type !== 'cancelled').length;
      const completedCount = userTasks.filter((t) => t.status?.status_type === 'completed').length;

      return {
        ...u,
        active_tasks_count: activeCount,
        completed_tasks_count: completedCount,
      };
    });

    return sendSuccess(res, enrichedUsers);
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const user = await UserRepository.getById(id);
    if (!user) {
      return sendError(res, 'User not found', 404, 'NOT_FOUND');
    }

    const allTasks = await TaskRepository.getAll({ is_archived: false });
    const userTasks = allTasks.filter((t) => (t.assignees || []).some((a) => a.id === user.id));
    const workload = TaskHealthService.calculateUserWorkload(user, userTasks);

    return sendSuccess(res, {
      user,
      workload,
      tasks: userTasks,
    });
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { email, full_name, role_name } = req.body;

    const targetRole = normalizeRole(role_name);

    // Validate that acting user can assign this role
    if (!canAssignRole(req.user!, targetRole)) {
      return sendError(
        res,
        'Only Super Admins can assign or provision Super Admin accounts',
        403,
        'FORBIDDEN'
      );
    }

    const existing = await UserRepository.getByEmail(email);
    if (existing) {
      return sendError(res, 'A user with this email address already exists', 409, 'CONFLICT');
    }

    // Try provisioning in Supabase Auth via Admin API if available
    try {
      await supabase.auth.admin.createUser({
        email,
        password: req.body.password || 'Welcome@123',
        email_confirm: true,
        user_metadata: {
          full_name,
          role: targetRole,
        },
      });
    } catch (e) {
      // Non-fatal if Supabase Auth is in mock mode
    }

    const newUser = await UserRepository.create({
      ...req.body,
      role_name: targetRole,
    });

    return sendSuccess(res, newUser, 201);
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const targetUser = await UserRepository.getById(id);

    if (!targetUser) {
      return sendError(res, 'User not found', 404, 'NOT_FOUND');
    }

    // Security check: can acting user modify target user?
    if (!canModifyUser(req.user!, targetUser)) {
      return sendError(
        res,
        'You do not have permission to modify this user account. Super Admin accounts are protected.',
        403,
        'FORBIDDEN'
      );
    }

    // If changing role, check permission
    if (req.body.role_name) {
      const newRole = normalizeRole(req.body.role_name);
      if (!canAssignRole(req.user!, newRole)) {
        return sendError(
          res,
          'You are not authorized to assign the requested role',
          403,
          'FORBIDDEN'
        );
      }
    }

    const updated = await UserRepository.update(id, req.body);
    return sendSuccess(res, updated);
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const { status } = req.body;

    const targetUser = await UserRepository.getById(id);
    if (!targetUser) {
      return sendError(res, 'User not found', 404, 'NOT_FOUND');
    }

    // Protection: Super Admin accounts cannot be disabled
    if (normalizeRole(targetUser.role_name) === 'Super Admin' && status === 'disabled') {
      return sendError(
        res,
        'Super Admin accounts cannot be deactivated to prevent lockout.',
        403,
        'FORBIDDEN'
      );
    }

    if (!canModifyUser(req.user!, targetUser)) {
      return sendError(
        res,
        'You do not have permission to change this user status.',
        403,
        'FORBIDDEN'
      );
    }

    const updated = await UserRepository.updateStatus(id, status);
    return sendSuccess(res, updated);
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;

    // Only Super Admin can delete
    if (normalizeRole(req.user?.role_name) !== 'Super Admin') {
      return sendError(res, 'Only Super Admins can delete users', 403, 'FORBIDDEN');
    }

    const targetUser = await UserRepository.getById(id);
    if (!targetUser) {
      return sendError(res, 'User not found', 404, 'NOT_FOUND');
    }

    if (normalizeRole(targetUser.role_name) === 'Super Admin') {
      return sendError(res, 'Super Admin accounts cannot be deleted', 403, 'FORBIDDEN');
    }

    const success = await UserRepository.delete(id);
    return sendSuccess(res, { success });
  }

  static async getPerformance(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const user = await UserRepository.getById(id);
    if (!user) {
      return sendError(res, 'User not found', 404, 'NOT_FOUND');
    }

    const allTasks = await TaskRepository.getAll({ is_archived: false });
    const userTasks = allTasks.filter((t) => (t.assignees || []).some((a) => a.id === user.id));
    const workload = TaskHealthService.calculateUserWorkload(user, userTasks);

    return sendSuccess(res, {
      user,
      workload,
      totalAssigned: userTasks.length,
      completed: userTasks.filter((t) => t.status?.status_type === 'completed').length,
      overdue: userTasks.filter((t) => TaskHealthService.evaluateTaskHealth(t).isOverdue).length,
    });
  }
}
