import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { requireAuthentication, requirePermission } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  addCommentSchema,
  addUpdateSchema,
  createTaskSchema,
  setBlockedSchema,
  updateTaskSchema,
} from '../validators/task.validator';

const router = Router();

router.use(requireAuthentication);

// Read tasks
router.get('/', TaskController.getAll);
router.get('/:id', TaskController.getById);

// Create task requires tasks.create
router.post('/', requirePermission('tasks.create'), validateRequest(createTaskSchema), TaskController.create);

// Update task (scoped in controller)
router.patch('/:id', validateRequest(updateTaskSchema), TaskController.update);

// Delete task requires tasks.delete
router.delete('/:id', requirePermission('tasks.delete'), TaskController.delete);

// Updates & Blockers (permitted for assigned members / managers)
router.post('/:id/updates', validateRequest(addUpdateSchema), TaskController.addUpdate);
router.post('/:id/blocked', validateRequest(setBlockedSchema), TaskController.setBlocked);
router.post('/:id/unblock', TaskController.resolveBlocker);

// Subtasks & Checklists
router.post('/:id/subtasks', TaskController.addSubtask);
router.patch('/subtasks/:subtaskId', TaskController.updateSubtask);
router.post('/checklists/:itemId/toggle', TaskController.toggleChecklistItem);

// Comments
router.post('/:id/comments', validateRequest(addCommentSchema), TaskController.addComment);

// Approval Workflow requires tasks.approve
router.post('/:id/submit-approval', TaskController.submitApproval);
router.post('/:id/approve', requirePermission('tasks.approve'), TaskController.approve);
router.post('/:id/reject', requirePermission('tasks.approve'), TaskController.reject);

// Productivity
router.post('/:id/duplicate', requirePermission('tasks.create'), TaskController.duplicate);
router.post('/:id/dependencies', TaskController.addDependency);
router.get('/:id/ai-summary', TaskController.getAISummary);

export default router;
