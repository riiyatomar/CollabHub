import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { z } from 'zod';

export const workspaceWebhookRouter = Router({ mergeParams: true });
export const webhookRouter = Router();

workspaceWebhookRouter.use(authenticate);

workspaceWebhookRouter.get('/', WebhookController.getWorkspaceWebhooks);

workspaceWebhookRouter.post(
  '/',
  validate(z.object({
    body: z.object({
      name: z.string().min(1).max(255),
      url: z.string().url(),
      events: z.array(z.string()),
      isActive: z.boolean().optional(),
    }),
  })),
  WebhookController.createWebhook
);

webhookRouter.use(authenticate);

webhookRouter.patch(
  '/:webhookId',
  validate(z.object({
    body: z.object({
      name: z.string().min(1).max(255).optional(),
      url: z.string().url().optional(),
      events: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
      rotateSecret: z.boolean().optional(),
    }),
  })),
  WebhookController.updateWebhook
);

webhookRouter.delete('/:webhookId', WebhookController.deleteWebhook);
