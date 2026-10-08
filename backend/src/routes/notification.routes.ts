import { Request, Response, Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notificationService';
import { sendSuccess } from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'u0000001-0000-0000-0000-000000000001';
  const notifications = await NotificationService.getUserNotifications(userId);
  const unreadCount = await NotificationService.getUnreadCount(userId);
  return sendSuccess(res, { notifications, unreadCount });
});

router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'u0000001-0000-0000-0000-000000000001';
  await NotificationService.markAsRead(req.params.id, userId);
  return sendSuccess(res, { success: true });
});

router.post('/read-all', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'u0000001-0000-0000-0000-000000000001';
  const count = await NotificationService.markAllAsRead(userId);
  return sendSuccess(res, { markedReadCount: count });
});

export default router;
