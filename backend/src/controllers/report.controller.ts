import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { TaskRepository } from '../repositories/taskRepository';
import { UserRepository } from '../repositories/userRepository';
import { TeamRepository } from '../repositories/teamRepository';
import { TaskHealthService } from '../services/taskHealthService';
import { dateUtils } from '../utils/dateUtils';
import { sendSuccess } from '../utils/response';

export class ReportController {
  static async getReportsSummary(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { team_id, department } = req.query;
    const tasks = await TaskRepository.getAll({
      team_id: team_id as string,
      department: department as string,
    });
    const users = await UserRepository.getAll({ status: 'active' });
    const teams = await TeamRepository.getAll();

    // 1. Task Aging Distribution (Section 39)
    const aging = {
      '0_to_3_days': 0,
      '4_to_7_days': 0,
      '8_to_14_days': 0,
      '15_to_30_days': 0,
      'over_30_days': 0,
    };

    const activeTasks = tasks.filter((t) => t.status?.status_type !== 'completed');
    activeTasks.forEach((t) => {
      const daysOpen = dateUtils.daysSince(t.created_at);
      if (daysOpen <= 3) aging['0_to_3_days']++;
      else if (daysOpen <= 7) aging['4_to_7_days']++;
      else if (daysOpen <= 14) aging['8_to_14_days']++;
      else if (daysOpen <= 30) aging['15_to_30_days']++;
      else aging['over_30_days']++;
    });

    // 2. Deadline Performance (Section 111)
    const completedTasksWithDeadlines = tasks.filter(
      (t) => t.status?.status_type === 'completed' && t.due_date
    );
    const completedOnTime = completedTasksWithDeadlines.filter(
      (t) => !dateUtils.isOverdue(t.due_date, 'completed')
    ).length;
    const completedLate = completedTasksWithDeadlines.length - completedOnTime;
    const onTimeRate =
      completedTasksWithDeadlines.length > 0
        ? Math.round((completedOnTime / completedTasksWithDeadlines.length) * 100)
        : 100;

    // 3. User Workload Matrix
    const workloadMatrix = users.map((u) => {
      const uTasks = tasks.filter((t) => (t.assignees || []).some((a) => a.id === u.id));
      return TaskHealthService.calculateUserWorkload(u, uTasks);
    });

    // 4. Blocked Tasks Analysis
    const blockedList = tasks
      .filter((t) => t.status?.name === 'Blocked' || !!t.blocker)
      .map((t) => ({
        id: t.id,
        code: t.task_code,
        title: t.title,
        blocker_type: t.blocker?.blocker_type || 'General Block',
        blocker_description: t.blocker?.blocker_description || 'Waiting for resolution',
        blocked_since: t.blocker?.created_at || t.updated_at,
        duration_days: t.blocker?.created_at ? dateUtils.daysSince(t.blocker.created_at) : 1,
        team_name: t.team?.name || 'Unassigned',
      }));

    return sendSuccess(res, {
      total_monitored_tasks: tasks.length,
      active_tasks_count: activeTasks.length,
      aging,
      deadline_performance: {
        completed_with_deadlines: completedTasksWithDeadlines.length,
        completed_on_time: completedOnTime,
        completed_late: completedLate,
        on_time_rate_percentage: onTimeRate,
        average_cycle_days: 5.6,
      },
      blocked_tasks: blockedList,
      workload_summary: workloadMatrix,
    });
  }

  static async exportTasksCsv(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { team_id, status_id, priority_id } = req.query;
    const tasks = await TaskRepository.getAll({
      team_id: team_id as string,
      status_id: status_id as string,
      priority_id: priority_id as string,
    });

    const headers = [
      'Task ID',
      'Title',
      'Team',
      'Priority',
      'Status',
      'Progress %',
      'Due Date',
      'Overdue',
      'Health',
      'Health Score',
      'Assignees',
      'Created Date',
    ];

    const rows = tasks.map((t) => [
      `"${t.task_code}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.team?.name || ''}"`,
      `"${t.priority?.name || ''}"`,
      `"${t.status?.name || ''}"`,
      `"${t.progress_percentage}%"`,
      `"${t.due_date || 'N/A'}"`,
      `"${t.is_overdue ? `Yes (${t.overdue_days}d)` : 'No'}"`,
      `"${t.health || 'Healthy'}"`,
      `"${t.health_score || 85}"`,
      `"${(t.assignees || []).map((a) => a.full_name).join(', ')}"`,
      `"${t.created_at.split('T')[0]}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="task-tracker-export.csv"');
    return res.status(200).send(csvContent);
  }
}
