import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { SystemRepository } from '../repositories/systemRepository';
import { sendError, sendSuccess } from '../utils/response';

export class SettingsController {
  static async getMetadata(req: AuthenticatedRequest, res: Response): Promise<any> {
    const statuses = await SystemRepository.getStatuses();
    const priorities = await SystemRepository.getPriorities();
    const categories = await SystemRepository.getCategories();
    const tags = await SystemRepository.getTags();
    const settings = await SystemRepository.getSettings();

    return sendSuccess(res, {
      statuses,
      priorities,
      categories,
      tags,
      settings,
    });
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<any> {
    if (req.user?.role_name !== 'Super Admin') {
      return sendError(res, 'Only Super Admins can update system settings', 403, 'FORBIDDEN');
    }

    const { key, value } = req.body;
    await SystemRepository.updateSetting(key, value);
    return sendSuccess(res, { message: 'Settings updated successfully' });
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<any> {
    if (req.user?.role_name !== 'Super Admin') {
      return sendError(res, 'Only Super Admins can view audit logs', 403, 'FORBIDDEN');
    }

    const { userId, taskId, module, limit } = req.query;
    const logs = await SystemRepository.getAuditLogs({
      userId: userId as string,
      taskId: taskId as string,
      module: module as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });

    return sendSuccess(res, logs);
  }

  static async getTemplates(req: AuthenticatedRequest, res: Response): Promise<any> {
    const templates = await SystemRepository.getTemplates();
    return sendSuccess(res, templates);
  }

  static async createTemplate(req: AuthenticatedRequest, res: Response): Promise<any> {
    if (req.user?.role_name === 'Team Member') {
      return sendError(res, 'Team members cannot create templates', 403, 'FORBIDDEN');
    }

    const tmpl = await SystemRepository.createTemplate({
      ...req.body,
      created_by: req.user?.id,
    });
    return sendSuccess(res, tmpl, 201);
  }

  static async getSavedFilters(req: AuthenticatedRequest, res: Response): Promise<any> {
    const userId = req.user?.id || 'u0000001-0000-0000-0000-000000000001';
    const filters = await SystemRepository.getSavedFilters(userId);
    return sendSuccess(res, filters);
  }

  static async createSavedFilter(req: AuthenticatedRequest, res: Response): Promise<any> {
    const userId = req.user?.id || 'u0000001-0000-0000-0000-000000000001';
    const saved = await SystemRepository.createSavedFilter({
      ...req.body,
      user_id: userId,
    });
    return sendSuccess(res, saved, 201);
  }
}
