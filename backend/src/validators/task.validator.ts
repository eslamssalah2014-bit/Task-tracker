import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  team_id: z.string().optional(),
  department: z.string().optional(),
  category_id: z.string().optional(),
  priority_id: z.string().min(1, 'Priority is required'),
  status_id: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  estimated_effort_hours: z.number().min(0).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  requires_approval: z.boolean().optional(),
  assignee_ids: z.array(z.string()).optional(),
  subtasks: z
    .array(
      z.object({
        title: z.string().min(2),
        assigned_to: z.string().optional(),
        priority: z.string().optional(),
      })
    )
    .optional(),
  checklists: z
    .array(
      z.object({
        title: z.string().min(1),
      })
    )
    .optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  is_archived: z.boolean().optional(),
  is_pinned: z.boolean().optional(),
  is_favorite: z.boolean().optional(),
});

export const addUpdateSchema = z.object({
  updateText: z.string().min(3, 'Update description is required'),
  progressPercentage: z.number().min(0).max(100),
  statusId: z.string().optional(),
  nextStep: z.string().optional(),
  blockerText: z.string().optional(),
});

export const setBlockedSchema = z.object({
  blockerType: z.enum([
    'Waiting for Approval',
    'Waiting for Another Team',
    'Technical Issue',
    'Missing Information',
    'Missing Resources',
    'Client Dependency',
    'Management Decision',
    'Other',
  ]),
  blockerDescription: z.string().min(5, 'Blocker description is required'),
  expectedResolutionDate: z.string().optional(),
});

export const addCommentSchema = z.object({
  text: z.string().min(1, 'Comment cannot be empty'),
  mentions: z.array(z.string()).optional(),
  attachmentUrl: z.string().optional(),
});

export const approvalActionSchema = z.object({
  notes: z.string().optional(),
});
