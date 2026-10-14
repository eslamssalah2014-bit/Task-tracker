import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { requireAuthentication, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuthentication);

router.get('/summary', DashboardController.getSummary);
router.get('/charts', DashboardController.getCharts);
router.get('/manager-insights', requireRole(['Super Admin', 'Admin', 'Education Manager']), DashboardController.getManagerInsights);

export default router;
