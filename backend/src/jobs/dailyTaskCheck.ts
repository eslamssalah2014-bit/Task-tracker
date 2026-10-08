import { TaskRepository } from '../repositories/taskRepository';
import { NotificationService } from '../services/notificationService';
import { EmailService } from '../services/emailService';
import { logger } from '../utils/logger';

export class DailyTaskCheckJob {
  static async run(): Promise<{
    checkedTasksCount: number;
    overdueAlertsSent: number;
    dueTodayAlertsSent: number;
    stalledUpdateAlertsSent: number;
  }> {
    logger.info('[DailyTaskCheckJob] Running scheduled operational health and deadline scan...');

    const tasks = await TaskRepository.getAll({ is_archived: false });
    let overdueAlerts = 0;
    let dueTodayAlerts = 0;
    let stalledAlerts = 0;

    for (const task of tasks) {
      if (task.status?.status_type === 'completed' || task.status?.status_type === 'cancelled') {
        continue;
      }

      // 1. Check Overdue
      if (task.is_overdue && task.overdue_days && task.overdue_days >= 1) {
        for (const assignee of task.assignees || []) {
          await NotificationService.createNotification({
            userId: assignee.id,
            taskId: task.id,
            taskCode: task.task_code,
            title: `⚠️ Task Overdue: ${task.task_code}`,
            message: `"${task.title}" is ${task.overdue_days} day(s) overdue. Please submit an update or flag any blockers.`,
            type: 'task_overdue',
          });
          await EmailService.sendOverdueNotice(
            assignee.email,
            assignee.full_name,
            task.title,
            task.task_code,
            task.overdue_days
          );
        }
        overdueAlerts++;
      }

      // 2. Check Due Today
      if (task.is_due_today) {
        for (const assignee of task.assignees || []) {
          await NotificationService.createNotification({
            userId: assignee.id,
            taskId: task.id,
            taskCode: task.task_code,
            title: `🔔 Due Today: ${task.task_code}`,
            message: `"${task.title}" is due today.`,
            type: 'task_due_today',
          });
        }
        dueTodayAlerts++;
      }

      // 3. Stalled In-Progress Tasks (No update > 3 days)
      if (!task.has_recent_update && task.status?.status_type === 'in_progress') {
        for (const assignee of task.assignees || []) {
          await NotificationService.createNotification({
            userId: assignee.id,
            taskId: task.id,
            taskCode: task.task_code,
            title: `⏱️ Update Reminder: ${task.task_code}`,
            message: `No status updates have been recorded for ${task.days_since_last_update} days. Please add an update.`,
            type: 'task_no_update',
          });
        }
        stalledAlerts++;
      }
    }

    logger.info(
      `[DailyTaskCheckJob] Scan complete. Processed ${tasks.length} tasks: ${overdueAlerts} overdue alerts, ${dueTodayAlerts} due today, ${stalledAlerts} stalled updates flagged.`
    );

    return {
      checkedTasksCount: tasks.length,
      overdueAlertsSent: overdueAlerts,
      dueTodayAlertsSent: dueTodayAlerts,
      stalledUpdateAlertsSent: stalledAlerts,
    };
  }
}
