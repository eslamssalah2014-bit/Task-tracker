import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate);

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.get('/:id/performance', UserController.getPerformance);
router.post('/', validateRequest(createUserSchema), UserController.create);
router.patch('/:id', validateRequest(updateUserSchema), UserController.update);
router.patch('/:id/status', UserController.updateStatus);
router.delete('/:id', UserController.delete);

export default router;
