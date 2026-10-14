import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { requireAuthentication, requirePermission } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createTeamSchema, updateTeamSchema } from '../validators/user.validator';

const router = Router();

router.use(requireAuthentication);

router.get('/', requirePermission('teams.view'), TeamController.getAll);
router.get('/:id', requirePermission('teams.view'), TeamController.getById);
router.get('/:id/performance', requirePermission('teams.view'), TeamController.getPerformance);
router.post('/', requirePermission('teams.manage'), validateRequest(createTeamSchema), TeamController.create);
router.patch('/:id', requirePermission('teams.manage'), validateRequest(updateTeamSchema), TeamController.update);
router.delete('/:id', requirePermission('teams.manage'), TeamController.delete);

export default router;
