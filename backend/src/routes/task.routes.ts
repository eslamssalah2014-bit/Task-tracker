import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  addCommentSchema,
  addUpdateSchema,
  createTaskSchema,
  setBlockedSchema,
  updateTaskSchema,
} from '../validators/task.validator';

const router = Router();

router.use(authenticate);

router.get('/', TaskController.getAll);
router.get('/:id', TaskController.getById);
router.post('/', validateRequest(createTaskSchema), TaskController.create);
router.patch('/:id', validateRequest(updateTaskSchema), TaskController.update);
router.delete('/:id', TaskController.delete);

// Updates & Blockers
router.post('/:id/updates', validateRequest(addUpdateSchema), TaskController.addUpdate);
router.post('/:id/blocked', validateRequest(setBlockedSchema), TaskController.setBlocked);
router.post('/:id/unblock', TaskController.resolveBlocker);

// Subtasks & Checklists
router.post('/:id/subtasks', TaskController.addSubtask);
router.patch('/subtasks/:subtaskId', TaskController.updateSubtask);
router.post('/checklists/:itemId/toggle', TaskController.toggleChecklistItem);

// Comments
router.post('/:id/comments', validateRequest(addCommentSchema), TaskController.addComment);

// Approval Workflow
router.post('/:id/submit-approval', TaskController.submitApproval);
router.post('/:id/approve', TaskController.approve);
router.post('/:id/reject', TaskController.reject);

// Productivity
router.post('/:id/duplicate', TaskController.duplicate);
router.post('/:id/dependencies', TaskController.addDependency);
router.get('/:id/ai-summary', TaskController.getAISummary);

export default router;
