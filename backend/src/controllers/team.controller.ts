import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { TeamRepository } from '../repositories/teamRepository';
import { TaskRepository } from '../repositories/taskRepository';
import { sendError, sendSuccess } from '../utils/response';

export class TeamController {
  static async getAll(req: AuthenticatedRequest, res: Response): Promise<any> {
    const teams = await TeamRepository.getAll();
    const allTasks = await TaskRepository.getAll({ is_archived: false });

    // Enrich each team with task metrics
    const enriched = teams.map((team) => {
      const teamTasks = allTasks.filter((t) => t.team_id === team.id);
      const activeTasks = teamTasks.filter((t) => t.status?.status_type !== 'completed').length;
      const completedTasks = teamTasks.filter((t) => t.status?.status_type === 'completed').length;
      const overdueTasks = teamTasks.filter((t) => t.is_overdue).length;

      return {
        ...team,
        active_tasks_count: activeTasks,
        completed_tasks_count: completedTasks,
        overdue_tasks_count: overdueTasks,
      };
    });

    return sendSuccess(res, enriched);
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const team = await TeamRepository.getById(id);
    if (!team) return sendError(res, 'Team not found', 404);

    const teamTasks = await TaskRepository.getAll({ team_id: id });
    return sendSuccess(res, { team, tasks: teamTasks });
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<any> {
    if (req.user?.role_name === 'Team Member') {
      return sendError(res, 'Team members cannot create teams', 403, 'FORBIDDEN');
    }

    const team = await TeamRepository.create(req.body);
    return sendSuccess(res, team, 201);
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    if (req.user?.role_name === 'Team Member') {
      return sendError(res, 'Team members cannot update teams', 403, 'FORBIDDEN');
    }

    const updated = await TeamRepository.update(id, req.body);
    if (!updated) return sendError(res, 'Team not found', 404);
    return sendSuccess(res, updated);
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    if (req.user?.role_name !== 'Super Admin') {
      return sendError(res, 'Only Super Admins can delete teams', 403, 'FORBIDDEN');
    }

    const success = await TeamRepository.delete(id);
    if (!success) return sendError(res, 'Team not found', 404);
    return sendSuccess(res, { message: 'Team deleted successfully' });
  }

  static async getPerformance(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const team = await TeamRepository.getById(id);
    if (!team) return sendError(res, 'Team not found', 404);

    const teamTasks = await TaskRepository.getAll({ team_id: id });
    const total = teamTasks.length;
    const completed = teamTasks.filter((t) => t.status?.status_type === 'completed').length;
    const overdue = teamTasks.filter((t) => t.is_overdue).length;
    const blocked = teamTasks.filter((t) => t.status?.name === 'Blocked' || !!t.blocker).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0;

    return sendSuccess(res, {
      team,
      total_tasks: total,
      completed_tasks: completed,
      overdue_tasks: overdue,
      blocked_tasks: blocked,
      completion_rate: completionRate,
      overdue_rate: overdueRate,
      average_cycle_days: 6.2,
    });
  }
}
