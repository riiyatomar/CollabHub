import { Router } from 'express';
import { CalendarController } from '../controllers/calendarController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { z } from 'zod';

export const workspaceCalendarRouter = Router({ mergeParams: true });
export const calendarRouter = Router();

workspaceCalendarRouter.use(authenticate);

workspaceCalendarRouter.get('/', CalendarController.getWorkspaceEvents);

workspaceCalendarRouter.post(
  '/',
  validate(z.object({
    body: z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional().nullable(),
      startTime: z.string(),
      endTime: z.string(),
      type: z.enum(['MEETING', 'TASK', 'REMINDER', 'CUSTOM']),
      entityId: z.string().optional().nullable(),
      isAllDay: z.boolean().optional(),
    }),
  })),
  CalendarController.createEvent
);

calendarRouter.use(authenticate);

calendarRouter.patch(
  '/:eventId',
  validate(z.object({
    body: z.object({
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional().nullable(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      type: z.enum(['MEETING', 'TASK', 'REMINDER', 'CUSTOM']).optional(),
      entityId: z.string().optional().nullable(),
      isAllDay: z.boolean().optional(),
    }),
  })),
  CalendarController.updateEvent
);

calendarRouter.delete('/:eventId', CalendarController.deleteEvent);
