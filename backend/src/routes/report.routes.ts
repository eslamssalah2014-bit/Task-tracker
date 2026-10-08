import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/summary', ReportController.getReportsSummary);
router.get('/export-csv', ReportController.exportTasksCsv);

export default router;
