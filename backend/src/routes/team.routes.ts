import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createTeamSchema, updateTeamSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate);

router.get('/', TeamController.getAll);
router.get('/:id', TeamController.getById);
router.get('/:id/performance', TeamController.getPerformance);
router.post('/', validateRequest(createTeamSchema), TeamController.create);
router.patch('/:id', validateRequest(updateTeamSchema), TeamController.update);
router.delete('/:id', TeamController.delete);

export default router;
