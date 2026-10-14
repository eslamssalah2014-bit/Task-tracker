import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { requireAuthentication, requirePermission } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuthentication);

router.get('/summary', requirePermission('reports.view'), ReportController.getReportsSummary);
router.get('/export-csv', requirePermission('reports.view'), ReportController.exportTasksCsv);

export default router;
