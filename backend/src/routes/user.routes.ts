import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuthentication, requirePermission, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(requireAuthentication);

router.get('/', requirePermission('users.view'), UserController.getAll);
router.get('/:id', requirePermission('users.view'), UserController.getById);
router.get('/:id/performance', requirePermission('users.view'), UserController.getPerformance);
router.post('/', requirePermission('users.create'), validateRequest(createUserSchema), UserController.create);
router.patch('/:id', requirePermission('users.edit'), validateRequest(updateUserSchema), UserController.update);
router.patch('/:id/status', requirePermission('users.disable'), UserController.updateStatus);
router.delete('/:id', requireRole(['Super Admin']), UserController.delete);

export default router;
