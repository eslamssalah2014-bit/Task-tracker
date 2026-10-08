import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/metadata', SettingsController.getMetadata);
router.patch('/', SettingsController.updateSettings);
router.get('/audit-logs', SettingsController.getAuditLogs);
router.get('/templates', SettingsController.getTemplates);
router.post('/templates', SettingsController.createTemplate);
router.get('/saved-filters', SettingsController.getSavedFilters);
router.post('/saved-filters', SettingsController.createSavedFilter);

export default router;
