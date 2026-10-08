import { Task, TaskHealth, WorkloadItem, WorkloadLevel, UserProfile } from '../types';
import { dateUtils } from '../utils/dateUtils';
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';

export class TaskHealthService {
  /**
   * Calculates dynamic health status and score (0 - 100)
   */
  static evaluateTaskHealth(
    task: Task,
    noUpdateThresholdDays = 3
  ): {
    health: TaskHealth;
    score: number;
    riskReason?: string;
    hasRecentUpdate: boolean;
    daysSinceLastUpdate: number;
    isOverdue: boolean;
    overdueDays: number;
    daysRemaining: number;
  } {
    const isCompleted = task.status?.status_type === 'completed' || task.progress_percentage === 100;
    const isBlocked = task.status?.status_type === 'waiting' && task.status?.name.toLowerCase().includes('blocked') || task.status?.name === 'Blocked';

    // Status type overrides
    if (isCompleted) {
      return {
        health: 'Completed',
        score: 100,
        hasRecentUpdate: true,
        daysSinceLastUpdate: 0,
        isOverdue: false,
        overdueDays: 0,
        daysRemaining: 0,
      };
    }

    if (isBlocked) {
      return {
        health: 'Blocked',
        score: 30,
        riskReason: 'Task is currently blocked and waiting for resolution.',
        hasRecentUpdate: true,
        daysSinceLastUpdate: 0,
        isOverdue: dateUtils.isOverdue(task.due_date, task.status?.status_type),
        overdueDays: dateUtils.overdueDays(task.due_date),
        daysRemaining: dateUtils.daysRemaining(task.due_date),
      };
    }

    const isOverdue = dateUtils.isOverdue(task.due_date, task.status?.status_type);
    const overdueDays = dateUtils.overdueDays(task.due_date);
    const daysRemaining = dateUtils.daysRemaining(task.due_date);

    // Last update tracking
    const lastUpdateDate = task.updates && task.updates.length > 0
      ? task.updates[0].created_at
      : task.updated_at || task.created_at;
    const daysSinceLastUpdate = dateUtils.daysSince(lastUpdateDate);
    const hasRecentUpdate = daysSinceLastUpdate <= noUpdateThresholdDays;

    let score = 85; // Baseline healthy score
    let riskReason: string | undefined;

    // 1. Overdue penalty
    if (isOverdue) {
      score -= Math.min(50, overdueDays * 12);
      riskReason = `Task is overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}.`;
    }

    // 2. Deadline proximity vs progress
    if (!isOverdue && task.due_date) {
      if (daysRemaining <= 1 && task.progress_percentage < 30) {
        score -= 40;
        riskReason = 'Deadline is within 24 hours with low progress completed.';
      } else if (daysRemaining <= 3 && task.progress_percentage < 50) {
        score -= 25;
        riskReason = 'Deadline approaching within 3 days with less than 50% progress.';
      }
    }

    // 3. Elapsed time vs progress calculation
    if (task.start_date && task.due_date && !isOverdue) {
      const start = startOfDay(parseISO(task.start_date));
      const due = startOfDay(parseISO(task.due_date));
      const totalDays = Math.max(1, differenceInCalendarDays(due, start));
      const elapsedDays = Math.max(0, differenceInCalendarDays(startOfDay(new Date()), start));
      const elapsedRatio = Math.min(1, elapsedDays / totalDays);

      if (elapsedRatio >= 0.7 && task.progress_percentage < 30) {
        score -= 30;
        riskReason = `Over ${Math.round(elapsedRatio * 100)}% of time elapsed with only ${task.progress_percentage}% progress.`;
      }
    }

    // 4. Missing update penalty
    if (!hasRecentUpdate && task.status?.status_type === 'in_progress') {
      score -= Math.min(25, (daysSinceLastUpdate - noUpdateThresholdDays + 1) * 6);
      if (!riskReason) {
        riskReason = `No updates provided for ${daysSinceLastUpdate} days.`;
      }
    }

    // 5. Dependency check penalty
    if (task.dependencies && task.dependencies.some((d) => !d.depends_on_is_completed)) {
      score -= 15;
      if (!riskReason) {
        riskReason = 'Predecessor task dependency is not yet resolved.';
      }
    }

    // 6. Priority weighting adjustments
    if (task.priority?.name === 'Critical' && score < 70) {
      score -= 10;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    // Health categorization
    let health: TaskHealth = 'Healthy';
    if (score < 40 || isOverdue) {
      health = 'Critical';
    } else if (score < 70) {
      health = 'At Risk';
    }

    return {
      health,
      score,
      riskReason,
      hasRecentUpdate,
      daysSinceLastUpdate,
      isOverdue,
      overdueDays,
      daysRemaining,
    };
  }

  /**
   * Calculates Workload levels for users based on task count, effort, and priority
   */
  static calculateUserWorkload(
    user: UserProfile,
    userTasks: Task[],
    thresholds = { low: 3, normal: 6, high: 10 }
  ): WorkloadItem {
    const activeTasks = userTasks.filter(
      (t) => t.status?.status_type !== 'completed' && t.status?.status_type !== 'cancelled'
    );

    const urgentTasks = activeTasks.filter(
      (t) => t.priority?.name === 'Urgent' || t.priority?.name === 'Critical'
    ).length;

    const overdueTasks = activeTasks.filter((t) => dateUtils.isOverdue(t.due_date, t.status?.status_type)).length;

    const blockedTasks = activeTasks.filter(
      (t) => t.status?.name === 'Blocked' || t.status?.status_type === 'waiting'
    ).length;

    const estimatedRemainingHours = activeTasks.reduce((sum, t) => {
      const remainingProgressRatio = Math.max(0, 1 - (t.progress_percentage || 0) / 100);
      return sum + (Number(t.estimated_effort_hours) || 0) * remainingProgressRatio;
    }, 0);

    // Composite workload weighting
    const compositeScore =
      activeTasks.length * 1 +
      urgentTasks * 1.5 +
      overdueTasks * 1.2 +
      (estimatedRemainingHours > 30 ? 3 : estimatedRemainingHours > 15 ? 1.5 : 0);

    let workloadLevel: WorkloadLevel = 'Normal';
    if (compositeScore < thresholds.low) {
      workloadLevel = 'Low';
    } else if (compositeScore <= thresholds.normal) {
      workloadLevel = 'Normal';
    } else if (compositeScore <= thresholds.high) {
      workloadLevel = 'High';
    } else {
      workloadLevel = 'Overloaded';
    }

    return {
      user,
      active_tasks: activeTasks.length,
      urgent_tasks: urgentTasks,
      overdue_tasks: overdueTasks,
      blocked_tasks: blockedTasks,
      estimated_remaining_hours: Math.round(estimatedRemainingHours * 10) / 10,
      workload_level: workloadLevel,
    };
  }
}
