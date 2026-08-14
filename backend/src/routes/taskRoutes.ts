import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { z } from 'zod';

export const workspaceTaskRouter = Router({ mergeParams: true });
export const taskRouter = Router();

// Routes nested under /workspaces/:workspaceId/tasks
workspaceTaskRouter.use(authenticate);

workspaceTaskRouter.get('/', TaskController.getWorkspaceTasks);

workspaceTaskRouter.post(
  '/',
  validate(z.object({
    body: z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional().nullable(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      dueDate: z.string().optional().nullable(),
      assigneeId: z.string().uuid().optional().nullable(),
      channelId: z.string().uuid().optional().nullable(),
      messageId: z.string().uuid().optional().nullable(),
      labelIds: z.array(z.string().uuid()).optional(),
    }),
  })),
  TaskController.createTask
);

// Routes nested under /tasks/:taskId
taskRouter.use(authenticate);

taskRouter.patch(
  '/:taskId',
  validate(z.object({
    body: z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional().nullable(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
      dueDate: z.string().optional().nullable(),
      assigneeId: z.string().uuid().optional().nullable(),
      labelIds: z.array(z.string().uuid()).optional(),
    }),
  })),
  TaskController.updateTask
);

taskRouter.delete('/:taskId', TaskController.deleteTask);
