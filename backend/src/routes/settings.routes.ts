import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { requireAuthentication, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuthentication);

router.get('/metadata', SettingsController.getMetadata);
router.patch('/', requirePermission('settings.manage'), SettingsController.updateSettings);
router.get('/audit-logs', requirePermission('audit_logs.view'), SettingsController.getAuditLogs);
router.get('/templates', SettingsController.getTemplates);
router.post('/templates', requirePermission('settings.manage'), SettingsController.createTemplate);
router.get('/saved-filters', SettingsController.getSavedFilters);
router.post('/saved-filters', SettingsController.createSavedFilter);

export default router;
