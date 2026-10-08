import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { TaskRepository } from '../repositories/taskRepository';
import { sendError, sendSuccess } from '../utils/response';
import { NotificationService } from '../services/notificationService';
import { WebhookService } from '../services/webhookService';
import { AIService } from '../services/aiService';

export class TaskController {
  static async getAll(req: AuthenticatedRequest, res: Response): Promise<any> {
    const {
      team_id,
      user_id,
      created_by,
      status_id,
      priority_id,
      category_id,
      department,
      is_overdue,
      is_blocked,
      no_recent_update,
      needs_approval,
      is_archived,
      search,
    } = req.query;

    const tasks = await TaskRepository.getAll({
      team_id: team_id as string,
      user_id: user_id as string,
      created_by: created_by as string,
      status_id: status_id as string,
      priority_id: priority_id as string,
      category_id: category_id as string,
      department: department as string,
      is_overdue: is_overdue === 'true',
      is_blocked: is_blocked === 'true',
      no_recent_update: no_recent_update === 'true',
      needs_approval: needs_approval === 'true',
      is_archived: is_archived === 'true',
      search: search as string,
    });

    return sendSuccess(res, tasks);
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const task = await TaskRepository.getById(id);
    if (!task) {
      return sendError(res, 'Task not found', 404, 'TASK_NOT_FOUND');
    }
    return sendSuccess(res, task);
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<any> {
    const userId = req.user?.id || 'u0000001-0000-0000-0000-000000000001';
    const task = await TaskRepository.create({
      ...req.body,
      created_by: userId,
    });

    // Notify assignees
    if (req.body.assignee_ids && req.body.assignee_ids.length > 0) {
      for (const assigneeId of req.body.assignee_ids) {
        if (assigneeId !== userId) {
          await NotificationService.createNotification({
            userId: assigneeId,
            actorId: userId,
            taskId: task.id,
            taskCode: task.task_code,
            title: `Assigned: ${task.task_code}`,
            message: `You were assigned to "${task.title}"`,
            type: 'task_assigned',
          });
        }
      }
    }

    // Webhook dispatch
    await WebhookService.dispatch('task.created', { taskId: task.id, taskCode: task.task_code });

    return sendSuccess(res, task, 201);
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check permissions: Team members cannot modify sensitive fields (assigned users, delete, etc.)
    if (req.user?.role_name === 'Team Member' && (req.body.created_by || req.body.team_id)) {
      return sendError(res, 'Team members cannot alter task ownership or team assignment', 403, 'FORBIDDEN');
    }

    const updated = await TaskRepository.update(id, req.body, userId);
    if (!updated) {
      return sendError(res, 'Task not found', 404, 'TASK_NOT_FOUND');
    }

    await WebhookService.dispatch('task.updated', { taskId: updated.id, taskCode: updated.task_code });

    return sendSuccess(res, updated);
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    if (req.user?.role_name === 'Team Member') {
      return sendError(res, 'Team members are not allowed to delete tasks', 403, 'FORBIDDEN');
    }

    const success = await TaskRepository.delete(id, req.user?.id);
    if (!success) {
      return sendError(res, 'Task not found', 404, 'TASK_NOT_FOUND');
    }
    return sendSuccess(res, { message: 'Task deleted successfully' });
  }

  static async addUpdate(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const userId = req.user?.id || 'u0000003-0000-0000-0000-000000000003';

    const updatedTask = await TaskRepository.addUpdate(id, {
      userId,
      updateText: req.body.updateText,
      progressPercentage: req.body.progressPercentage,
      statusId: req.body.statusId,
      nextStep: req.body.nextStep,
      blockerText: req.body.blockerText,
    });

    if (!updatedTask) {
      return sendError(res, 'Task not found', 404, 'TASK_NOT_FOUND');
    }

    return sendSuccess(res, updatedTask);
  }

  static async setBlocked(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const userId = req.user?.id || 'u0000003-0000-0000-0000-000000000003';

    const updatedTask = await TaskRepository.setBlocked(id, {
      blockerType: req.body.blockerType,
      blockerDescription: req.body.blockerDescription,
      expectedResolutionDate: req.body.expectedResolutionDate,
      userId,
    });

    if (!updatedTask) {
      return sendError(res, 'Task not found', 404, 'TASK_NOT_FOUND');
    }

    // Notify Task Creator or Manager
    if (updatedTask.created_by && updatedTask.created_by !== userId) {
      await NotificationService.createNotification({
        userId: updatedTask.created_by,
        actorId: userId,
        taskId: updatedTask.id,
        taskCode: updatedTask.task_code,
        title: `🚨 Blocker Reported: ${updatedTask.task_code}`,
        message: `Task marked as blocked: ${req.body.blockerType}`,
        type: 'task_blocked',
      });
    }

    await WebhookService.dispatch('task.blocked', {
      taskId: updatedTask.id,
      blockerType: req.body.blockerType,
    });

    return sendSuccess(res, updatedTask);
  }

  static async resolveBlocker(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const userId = req.user?.id || 'u0000002-0000-0000-0000-000000000002';

    const updatedTask = await TaskRepository.resolveBlocker(id, userId);
    if (!updatedTask) {
      return sendError(res, 'Task or active blocker not found', 404);
    }
    return sendSuccess(res, updatedTask);
  }

  static async addSubtask(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const subtask = await TaskRepository.addSubtask(id, req.body);
    if (!subtask) {
      return sendError(res, 'Task not found', 404);
    }
    return sendSuccess(res, subtask, 201);
  }

  static async updateSubtask(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { subtaskId } = req.params;
    const updated = await TaskRepository.updateSubtask(subtaskId, req.body, true);
    if (!updated) {
      return sendError(res, 'Subtask not found', 404);
    }
    return sendSuccess(res, updated);
  }

  static async toggleChecklistItem(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { itemId } = req.params;
    const { isCompleted } = req.body;
    const success = await TaskRepository.toggleChecklistItem(itemId, isCompleted, req.user?.id);
    if (!success) {
      return sendError(res, 'Checklist item not found', 404);
    }
    return sendSuccess(res, { success: true, is_completed: isCompleted });
  }

  static async addComment(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const userId = req.user?.id || 'u0000003-0000-0000-0000-000000000003';

    const comment = await TaskRepository.addComment(id, {
      userId,
      text: req.body.text,
      mentions: req.body.mentions,
      attachmentUrl: req.body.attachmentUrl,
    });

    if (!comment) {
      return sendError(res, 'Task not found', 404);
    }

    // Mention notifications
    if (req.body.mentions && req.body.mentions.length > 0) {
      for (const mentionedUid of req.body.mentions) {
        if (mentionedUid !== userId) {
          await NotificationService.createNotification({
            userId: mentionedUid,
            actorId: userId,
            taskId: id,
            title: 'You were mentioned in a task comment',
            message: req.body.text.substring(0, 80),
            type: 'mention',
          });
        }
      }
    }

    return sendSuccess(res, comment, 201);
  }

  static async submitApproval(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const userId = req.user?.id || 'u0000003-0000-0000-0000-000000000003';

    const task = await TaskRepository.submitForApproval(id, userId);
    if (!task) return sendError(res, 'Task not found', 404);

    // Notify Manager or Creator
    if (task.team?.manager_id) {
      await NotificationService.createNotification({
        userId: task.team.manager_id,
        actorId: userId,
        taskId: task.id,
        taskCode: task.task_code,
        title: `Task Awaiting Approval: ${task.task_code}`,
        message: `Task "${task.title}" was submitted for your review.`,
        type: 'approval_request',
      });
    }

    return sendSuccess(res, task);
  }

  static async approve(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    if (req.user?.role_name === 'Team Member') {
      return sendError(res, 'Only Managers or Admins can approve tasks', 403, 'FORBIDDEN');
    }

    const task = await TaskRepository.approveTask(id, req.user?.id || 'u0000002-0000-0000-0000-000000000002', req.body.notes);
    if (!task) return sendError(res, 'Task not found', 404);

    // Notify creator & assignees
    for (const assignee of task.assignees || []) {
      await NotificationService.createNotification({
        userId: assignee.id,
        actorId: req.user?.id,
        taskId: task.id,
        taskCode: task.task_code,
        title: `✅ Task Approved: ${task.task_code}`,
        message: `Your task "${task.title}" was approved as Completed.`,
        type: 'task_approved',
      });
    }

    return sendSuccess(res, task);
  }

  static async reject(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    if (req.user?.role_name === 'Team Member') {
      return sendError(res, 'Only Managers or Admins can reject tasks', 403, 'FORBIDDEN');
    }

    if (!req.body.notes || req.body.notes.trim().length === 0) {
      return sendError(res, 'Rejection notes are required to explain necessary changes.', 400);
    }

    const task = await TaskRepository.rejectTask(
      id,
      req.user?.id || 'u0000002-0000-0000-0000-000000000002',
      req.body.notes
    );
    if (!task) return sendError(res, 'Task not found', 404);

    for (const assignee of task.assignees || []) {
      await NotificationService.createNotification({
        userId: assignee.id,
        actorId: req.user?.id,
        taskId: task.id,
        taskCode: task.task_code,
        title: `Changes Requested: ${task.task_code}`,
        message: req.body.notes,
        type: 'task_rejected',
      });
    }

    return sendSuccess(res, task);
  }

  static async duplicate(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const task = await TaskRepository.duplicate(id, {
      userId: req.user?.id || 'u0000001-0000-0000-0000-000000000001',
      duplicateAssignees: req.body.duplicateAssignees ?? true,
      duplicateDates: req.body.duplicateDates ?? false,
    });
    if (!task) return sendError(res, 'Original task not found', 404);
    return sendSuccess(res, task, 201);
  }

  static async addDependency(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const { dependsOnTaskId, dependencyType } = req.body;

    const result = await TaskRepository.addDependency(id, dependsOnTaskId, dependencyType);
    if (!result.success) {
      return sendError(res, result.message || 'Dependency could not be added', 400, 'DEPENDENCY_ERROR');
    }
    return sendSuccess(res, { success: true, message: 'Dependency registered successfully' });
  }

  static async getAISummary(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const task = await TaskRepository.getById(id);
    if (!task) return sendError(res, 'Task not found', 404);

    const summary = await AIService.generateTaskSummary(task);
    return sendSuccess(res, summary);
  }
}
